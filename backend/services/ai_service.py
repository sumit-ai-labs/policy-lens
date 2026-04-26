import json
import os
import re
from difflib import SequenceMatcher
from typing import List

from dotenv import load_dotenv
from google import genai
import concurrent.futures

from services.scoring import detect_policy_type


env_path = os.path.join(os.path.dirname(os.path.dirname(__file__)), ".env")
load_dotenv(env_path)


def get_api_key():
    return os.getenv("GEMINI_API_KEY") or os.getenv("GOOGLE_API_KEY")


def _strip_code_fences(raw: str) -> str:
    start = raw.find('{')
    end = raw.rfind('}')
    if start != -1 and end != -1 and end > start:
        return raw[start:end+1]
    return raw.strip()


def _normalize_text(value: str) -> str:
    return re.sub(r"\s+", " ", (value or "").strip().lower())


def _truncate_text(value: str, limit: int = 140) -> str:
    cleaned = re.sub(r"\s+", " ", (value or "").strip())
    if len(cleaned) <= limit:
        return cleaned
    return cleaned[: limit - 3].rstrip() + "..."


def _match_source(clause: str, retrieved_chunks: List[dict]) -> dict:
    normalized_clause = _normalize_text(clause)
    best_chunk = None
    best_score = 0.0

    for chunk in retrieved_chunks:
        chunk_text = _normalize_text(chunk.get("text", ""))
        if not chunk_text:
            continue

        ratio = SequenceMatcher(None, normalized_clause, chunk_text).ratio()
        if normalized_clause and normalized_clause in chunk_text:
            ratio += 0.35

        if ratio > best_score:
            best_score = ratio
            best_chunk = chunk

    if not best_chunk:
        return {
            "source": "Page 1",
            "source_page": 1,
            "source_chunk_id": None,
        }

    page = best_chunk.get("page", 1)
    chunk_id = best_chunk.get("chunk_id")
    return {
        "source": f"Page {page}" + (f" | Chunk {chunk_id}" if chunk_id else ""),
        "source_page": page,
        "source_chunk_id": chunk_id,
    }


def _dedupe_strings(items: List[str], limit: int | None = None) -> List[str]:
    seen = set()
    deduped = []
    for item in items or []:
        normalized = _normalize_text(item)
        if normalized and normalized not in seen:
            seen.add(normalized)
            deduped.append(_truncate_text(item, limit or 160))
    return deduped


def _calibrate_impact_level(clause: str, reason: str, impact_level: str) -> str:
    normalized = _normalize_text(f"{clause} {reason}")
    severe_markers = [
        "claim rejection",
        "claim denied",
        "claim denial",
        "surrender penalty",
        "lock-in",
        "withdrawal restriction",
        "fund value",
        "market risk",
        "charge deducted",
        "forfeiture",
        "premium discontinuance",
        "no liquidity",
        "money can decrease",
        "benefit may not be paid",
        "policy cancellation",
        "void",
    ]
    administrative_markers = [
        "non-issuance",
        "regulatory",
        "statutory",
        "kyc",
        "aml",
        "notice",
        "tax law",
        "compliance",
        "servicing",
        "administrative",
        "governed by law",
    ]

    lowered = (impact_level or "medium").lower()
    if lowered == "high":
        if any(marker in normalized for marker in administrative_markers) and not any(
            marker in normalized for marker in severe_markers
        ):
            return "medium"
    return lowered


def _infer_risk_title(clause: str, reason: str) -> str:
    normalized = _normalize_text(f"{clause} {reason}")
    mapping = [
        ("claim rejection", "Claim Rejection Risk"),
        ("claim denied", "Claim Rejection Risk"),
        ("deadline", "Strict Deadline"),
        ("waiting period", "Waiting Period Restriction"),
        ("surrender", "Surrender Loss Risk"),
        ("lock-in", "Lock-in Restriction"),
        ("premium", "Premium Compliance Risk"),
        ("market risk", "Market-Linked Value Risk"),
        ("nav", "NAV Fluctuation Risk"),
        ("charge", "Financial Charge Impact"),
        ("discretion", "Insurer Discretion Risk"),
        ("void", "Policy Void Risk"),
        ("forfeiture", "Forfeiture Risk"),
        ("document", "Documentation Risk"),
    ]

    for keyword, title in mapping:
        if keyword in normalized:
            return title

    words = re.sub(r"[^A-Za-z0-9\s]", "", clause).split()
    return " ".join(words[:4]).strip().title() or "Policy Risk"


def _normalize_risks(risks: List[dict], retrieved_chunks: List[dict]) -> List[dict]:
    unique_risks = []
    seen_clauses = set()

    for risk in risks or []:
        title = risk.get("title", "").strip()
        clause = risk.get("clause", "").strip() or title
        if not clause:
            continue

        normalized_clause = _normalize_text(clause)
        if normalized_clause in seen_clauses:
            continue
        seen_clauses.add(normalized_clause)

        reason = risk.get("impact", "").strip() or risk.get("reason", "").strip() or "This clause can negatively affect the policyholder."
        calibrated_impact = _calibrate_impact_level(
            clause,
            reason,
            (risk.get("level") or risk.get("impact_level", "medium") or "medium").lower(),
        )
        source_payload = _match_source(clause, retrieved_chunks)
        page = risk.get("page")

        unique_risks.append(
            {
                "title": title or _infer_risk_title(clause, reason),
                "clause": _truncate_text(clause, 180),
                "reason": _truncate_text(reason, 120),
                "impact": calibrated_impact.upper(),
                "impact_level": calibrated_impact,
                "source": risk.get("source") or (f"Page {page}" if page else source_payload["source"]),
                "source_page": page or risk.get("source_page") or source_payload["source_page"],
                "source_chunk_id": risk.get("source_chunk_id") or source_payload["source_chunk_id"],
            }
        )

    impact_order = {"high": 0, "medium": 1, "low": 2}
    unique_risks.sort(key=lambda item: (impact_order.get(item.get("impact_level", "medium"), 3), item["title"]))
    return unique_risks


def _derive_tags(policy_type: str, safe_points: List[str], all_risks: List[dict]) -> List[str]:
    tags: List[str] = []
    risk_blob = " ".join(_normalize_text(risk.get("title", "") + " " + risk.get("reason", "")) for risk in all_risks[:5])

    for point in safe_points[:2]:
        tags.append(f"✅ {_truncate_text(point, 28)}")

    if "lock-in" in risk_blob or "surrender" in risk_blob or "withdrawal" in risk_blob:
        tags.append("⚠️ Limited flexibility")
    if "claim" in risk_blob or "document" in risk_blob or "deadline" in risk_blob:
        tags.append("⚠️ Strict claim rules")
    if "charge" in risk_blob or "premium" in risk_blob or "market" in risk_blob:
        tags.append("❗ Financial caution")
    if "deadline" in risk_blob or "waiting period" in risk_blob:
        tags.append("⏱ Deadline sensitive")
    if policy_type in {"life", "life/annuity", "annuity"} and not tags:
        tags.append("✅ Long-term income focus")

    seen = set()
    deduped: List[str] = []
    for tag in tags:
        normalized = _normalize_text(tag)
        if normalized and normalized not in seen:
            seen.add(normalized)
            deduped.append(tag)
    return deduped[:3]


def _derive_final_verdict(policy_type: str, short_summary: str, all_risks: List[dict], safe_points: List[str]) -> str:
    normalized_risks = " ".join(_normalize_text(risk.get("title", "") + " " + risk.get("reason", "")) for risk in all_risks[:4])

    if "lock-in" in normalized_risks or "surrender" in normalized_risks:
        return "High risk - suitable only if you accept lock-in and exit loss."
    if "claim" in normalized_risks or "document" in normalized_risks:
        return "Medium risk - suitable only if you can follow strict claim steps."
    if policy_type in {"life", "life/annuity", "annuity"}:
        return "Medium risk - suitable for long-term income, not for flexibility."
    if safe_points:
        return "Lower risk - suitable if the benefits match how you plan to use it."
    return _truncate_text(short_summary, 90)


def _build_what_this_means(all_risks: List[dict], conditions: List[str], exclusions: List[str]) -> str:
    normalized_risks = " ".join(_normalize_text(risk.get("title", "") + " " + risk.get("reason", "")) for risk in all_risks[:4])

    if "lock-in" in normalized_risks or "surrender" in normalized_risks:
        return "You may lose money if you exit early or need flexibility."
    if "claim" in normalized_risks or "document" in normalized_risks or "deadline" in normalized_risks:
        return "Missing documents or deadlines may delay or weaken your claim."
    if exclusions:
        return "The exclusions can sharply reduce when this policy actually pays."
    if conditions:
        return "This policy works best if you can follow the timelines and document rules closely."
    return "Use this policy only if its benefits fit how you actually plan to use it."


def _build_short_summary(policy_type: str, simplified_text: str, all_risks: List[dict]) -> str:
    base = _truncate_text(simplified_text, 180)
    if not base:
        risk_level = "moderate" if all_risks else "lower"
        return f"This {policy_type or 'insurance'} policy shows {risk_level} complexity and should be reviewed carefully."

    sentences = re.split(r"(?<=[.!?])\s+", base)
    compact = " ".join(sentences[:2]).strip()
    return _truncate_text(compact, 180)


def _build_top_risks(all_risks: List[dict]) -> List[dict]:
    top_risks = []
    for risk in all_risks[:3]:
        top_risks.append(
            {
                "title": risk.get("title", "Policy Risk"),
                "level": risk.get("impact", "MEDIUM"),
                "description": _truncate_text(risk.get("reason", ""), 90),
                "source": risk.get("source", "Page 1"),
            }
        )
    return top_risks


def _fallback_analysis(retrieved_chunks: List[dict], full_text: str, policy_type_hint: str) -> dict:
    risks = []
    text_lower = full_text.lower() if full_text else " ".join([c.get("text", "") for c in retrieved_chunks]).lower()

    if "penalty" in text_lower:
        risks.append(("Penalty clause", "HIGH", "High penalty for non-compliance or early exit."))
    if "deductible" in text_lower:
        risks.append(("Deductible risk", "MEDIUM", "Policy contains deductible limits."))
    if "void" in text_lower or "denied" in text_lower:
        risks.append(("Claim denial risk", "HIGH", "Strict conditions could lead to claim denial."))
    if "may" in text_lower or "subject to" in text_lower:
        risks.append(("Ambiguity risk", "MEDIUM", "Discretionary language creates uncertainty."))

    fallback_risks = []
    for i, (title, level, reason) in enumerate(risks):
        fallback_risks.append({
            "title": title,
            "clause": "Rule-based extraction",
            "reason": reason,
            "impact": level,
            "impact_level": level.lower(),
            "source": "Rule Fallback",
            "source_page": 1,
            "source_chunk_id": None,
        })
        
    if not fallback_risks:
        fallback_risks.append({
            "title": "Manual Review Needed",
            "clause": "Fallback applied",
            "reason": "The AI response failed, so this policy should be reviewed manually.",
            "impact": "MEDIUM",
            "impact_level": "medium",
            "source": "Rule Fallback",
            "source_page": 1,
            "source_chunk_id": None,
        })

    high = sum(1 for r in fallback_risks if r["impact"] == "HIGH")
    medium = sum(1 for r in fallback_risks if r["impact"] == "MEDIUM")

    short_summary = "The policy was analyzed via rule-based fallback due to AI timeout."
    return {
        "policy_type": policy_type_hint or "unknown",
        "risk_level": "HIGH" if high > 0 else "MEDIUM",
        "short_summary": short_summary,
        "simplified_text": short_summary,
        "final_verdict": "Rule-based review applied before relying on this policy decision.",
        "quick_insight": "Rule-based fallback applied.",
        "what_this_means": ["Review exclusions and conditions manually", "AI response is unavailable"],
        "tags": ["⚠️ Rule-based Fallback", "⏱ AI Timeout"],
        "safe_points": [],
        "conditions": [],
        "exclusions": [],
        "top_risks": _build_top_risks(fallback_risks),
        "all_risks": fallback_risks,
        "risk_summary": {
            "high": high,
            "medium": medium,
            "low": 0
        },
        "ai_scores": {
            "ai_severity": min(10, high * 2 + medium),
            "ai_complexity": 6,
            "ai_risk_density": min(10, len(risks)),
            "ai_user_impact": 5,
        },
        "confidence": {
            "score": 5,
            "reason": "Rule-based fallback applied"
        },
        "analysis_method": "Rule-Based Fallback",
    }


def analyze_with_ai(context_text: str, retrieved_chunks: List[dict], full_text: str = "") -> dict:
    api_key = get_api_key()
    if not api_key:
        raise ValueError("No Gemini API key found. Please set GEMINI_API_KEY in .env")

    client = genai.Client(api_key=api_key)
    policy_type_hint = detect_policy_type(full_text or context_text)

    prompt = f"""You are an expert insurance policy analyzer, legal risk interpreter, and evidence-based AI system.

Your job:
Analyze insurance policy text and produce a clean, structured, decision-ready output with legal clarity, supporting evidence, and scoring signals.

---

🧠 STEP 1: UNDERSTAND POLICY TYPE

Classify correctly into:
- Life Insurance
- Health Insurance
- Motor Insurance
- Investment / ULIP
- Annuity / Pension

⚠️ Do NOT guess incorrectly. Use clear signals from text.

---

🧠 STEP 2: EXTRACT EVIDENCE (VERY IMPORTANT)

For each important clause, create structured evidence:

{{
  "snippet": "exact clause text (shortened if needed)",
  "label": "risk | exclusion | condition | ambiguity",
  "impact": "HIGH | MEDIUM | LOW",
  "confidence": 0–1
}}

⚠️ Rules:
- Only meaningful clauses
- Avoid duplicates
- Max 10–15 evidence items
- Confidence based on clarity + directness of clause

---

🧠 STEP 3: DEFINE RISK LEVELS (MANDATORY CONSISTENCY)

Classify impact using clear rules:

HIGH:
- claim rejection, denial, cancellation
- major financial loss
- strict exclusions

MEDIUM:
- restrictions, penalties, partial coverage
- conditional approvals

LOW:
- procedural requirements
- minor limitations

⚠️ Use both rule logic + context understanding

---

🧠 STEP 4: IDENTIFY RISKS

From evidence, extract:

- financial risks (charges, deductibles, depreciation)
- claim risks (rejection, deadlines, documentation)
- usage restrictions
- hidden risks (ambiguity, discretion)

Each risk MUST be supported by evidence.

---

🧠 STEP 5: LEGAL & AMBIGUITY ANALYSIS

For each risk:

1. legal_meaning → what insurer can legally do
2. ambiguity → uncertainty, vague wording, or interpretation risk
   ⚠️ MUST highlight confusion or risk of misinterpretation
   ⚠️ MUST NOT describe clear clauses or confirm policy details
   ⚠️ MUST NOT say "clear", "detailed", or restate what is already obvious
   Example GOOD: "Insurer may interpret 'reasonable' differently than policyholder"
   Example BAD: "Policy clearly defines claim submission process"
3. impact → real-world user effect

⚠️ Keep each:
- max 12 words
- clear and non-repetitive
- ambiguity must highlight uncertainty (not restate risk)

---

🧠 STEP 6: SECTION RULES

- short_summary → max 12 words, decision-focused
- quick_insight → max 12 words, MUST highlight a risk, limitation, or user loss
  ⚠️ MUST NOT describe general coverage or what the policy "covers"
  ⚠️ MUST NOT use phrases like "covers", "provides coverage", "offers"
  ⚠️ MUST focus on user impact, loss scenario, or hidden restriction
  Example GOOD: "High deductibles may significantly reduce claim payout"
  Example BAD: "This policy covers hospitalization and surgical expenses"
- decision_tags → 3–5 emoji tags
- what_this_means → max 3 bullets, no repetition

- top_risks → EXACTLY 3 (most critical, from evidence)
- all_risks → remaining risks ONLY (no duplicates with top_risks)

- conditions → max 10 short bullets
- exclusions → unique only, no repetition
- safe_points → positive aspects if present

---

🧠 STEP 7: SCORING SIGNALS (EVIDENCE-BASED)

Compute scores strictly based on extracted evidence:

- severity:
  based on weighted impact of HIGH, MEDIUM, LOW risks

- frequency:
  based on total number of risks (normalized scale)

- tam:
  based on policy type + proportion of HIGH risks

- whitespace:
  based on ambiguity + complexity of clauses

⚠️ DO NOT randomize
⚠️ Scores must be consistent with evidence

---

🧠 STEP 8: RISK DISTRIBUTION

Count:

{{
  "high": number of HIGH risks,
  "medium": number of MEDIUM risks,
  "low": number of LOW risks
}}

---

🧠 STEP 9: CONFIDENCE (EVIDENCE-DRIVEN)

Calculate confidence using:

- number of evidence items
- clarity of clauses
- consistency across risks
- strength of supporting snippets

HIGH (8–10):
- multiple clear supporting clauses

MEDIUM (5–7):
- moderate clarity

LOW (0–4):
- weak or ambiguous evidence

Also ensure:
- higher evidence → higher confidence
- ambiguity reduces confidence

---

🧠 STEP 10: CALIBRATION AWARENESS (IMPORTANT)

Ensure scores reflect real-world impact:

- high severity → should align with real financial risk
- multiple risks → increase frequency logically
- avoid exaggerated or unrealistic scoring

---

🧠 STEP 11: FINAL VERDICT

- 1 line only
- decision-focused
- based on risk + evidence + scores

---

🧠 STEP 12: SCORING ADJUSTMENTS (IMPORTANT REFINEMENT)

Apply the following correction rules BEFORE finalizing scores:

1. WHITESPACE IMPACT CONTROL

If risks are primarily based on ambiguity (vague wording, undefined terms, discretionary language)
AND there are no strong financial or claim-denial clauses:

- Reduce severity slightly (do not treat ambiguity as direct financial risk)
- Keep whitespace high, but avoid inflating overall risk excessively

---

2. TAM ADJUSTMENT (REAL-WORLD IMPACT CHECK)

If policy lacks clear financial loss, penalties, or monetary impact clauses:

- Reduce TAM score
- Do NOT assign high TAM based only on ambiguity or procedural conditions

---

3. SAFE POINT FILTER (STRICT)

Include safe_points ONLY if:

- clearly beneficial to user
- unconditional or user-friendly
- directly reduces risk (e.g. free-look period, guaranteed payout)

DO NOT include:

- conditional statements
- neutral clauses
- statements that depend on approval or conditions

---

4. FINAL SCORE BALANCING

Ensure:

- ambiguity alone does NOT produce a very high ITCH score
- high ITCH requires either:
  - strong financial risk OR
  - claim rejection OR
  - multiple high-impact clauses

---

🧠 STEP 13: FINAL CONSISTENCY CHECK (CRITICAL)

Before returning, verify all of the following:

1. FINAL RISK LEVEL ENFORCEMENT (CRITICAL)

Set risk_level strictly based on ITCH:

- 0–40 → LOW
- 41–70 → MEDIUM
- 71–100 → HIGH

⚠️ DO NOT manually assign risk_level
⚠️ MUST match ITCH score ALWAYS

---

2. SCORE CONSISTENCY WITH RISK DISTRIBUTION

Enforce these rules:

- HIGH risk count ≥ 2  → severity MUST be ≥ 7
- total risks ≥ 3      → frequency MUST NOT be very low (< 3)
- no financial risk     → TAM MUST NOT exceed 6
- If ambiguity-driven risks dominate:
  - reduce TAM slightly
  - avoid pushing ITCH too high unless financial risk exists

---

3. NO CONTRADICTIONS

Verify there are no conflicts between:

- scores (severity, frequency, tam, whitespace)
- labels (risk_level, top risk levels)
- risk_summary counts (high, medium, low)

If contradictions exist, fix scores to match evidence before returning.

---

---

🧠 STEP 14: FINAL OUTPUT REFINEMENT (IMPORTANT)

Apply the following refinements BEFORE returning output:

1. TAM CALIBRATION (REAL-WORLD IMPACT)

If the policy:

- does NOT include direct financial loss (no charges, penalties, deductions, large monetary impact)
- is mainly based on ambiguity, discretion, or procedural conditions

Then:

- Reduce TAM score slightly
- Avoid assigning TAM > 6 unless clear financial impact exists

---

2. FREQUENCY ADJUSTMENT

Ensure frequency reflects actual number of risks:

- If total risks ≥ 4 → frequency should not be very low
- Normalize frequency to reflect moderate density (avoid underestimation)

---

3. DECISION TAG QUALITY (UX IMPROVEMENT)

Ensure decision_tags are:

- meaningful and descriptive (not generic symbols only)
- short but informative

GOOD examples:
- ⚠️ discretionary
- 📜 strict rules
- ❓ ambiguous
- 💰 financial risk

BAD examples:
- ❓ ⚠️ ❗ (without context)

---

4. FINAL VERDICT COMPLETENESS

Ensure final_verdict is:

- full sentence
- not truncated
- no ellipsis (...)

---

🧠 STEP 15: OVERALL CONSISTENCY CHECK (MANDATORY)

Before returning:

✔ Scores align with risk distribution
✔ TAM reflects real financial impact
✔ Frequency reflects number of risks
✔ Tags are meaningful
✔ Final verdict is complete
✔ No duplicate risks
✔ top_risks NOT repeated in all_risks
✔ No repeated sentences
✔ All fields follow length rules
✔ Every major risk supported by evidence
✔ Output is clean and structured

---

OUTPUT: STRICT JSON ONLY

{{
  "policy_type": "",
  "risk_level": "HIGH | MEDIUM | LOW",

  "short_summary": "",
  "quick_insight": "",

  "decision_tags": [],

  "what_this_means": [],

  "evidence": [
    {{
      "snippet": "exact clause text",
      "label": "risk | exclusion | condition | ambiguity",
      "impact": "HIGH | MEDIUM | LOW",
      "confidence": 0.0
    }}
  ],

  "top_risks": [
    {{
      "title": "2-4 words",
      "level": "HIGH | MEDIUM | LOW",
      "impact": "max 10 words",
      "legal_meaning": "max 12 words",
      "ambiguity": "max 12 words"
    }}
  ],

  "all_risks": [
    {{
      "title": "2-4 words",
      "level": "HIGH | MEDIUM | LOW",
      "impact": "max 10 words",
      "legal_meaning": "max 12 words",
      "ambiguity": "max 12 words"
    }}
  ],

  "conditions": [],
  "exclusions": [],

  "safe_points": [],

  "risk_summary": {{
    "high": 0,
    "medium": 0,
    "low": 0
  }},

  "scores": {{
    "severity": 0,
    "frequency": 0,
    "tam": 0,
    "whitespace": 0
  }},

  "confidence": {{
    "score": 0,
    "reason": "max 12 words"
  }},

  "final_verdict": ""
}}

---

INPUT POLICY TEXT:
{context_text}
"""

    model_name = "gemini-2.5-flash-lite"

    try:
        with concurrent.futures.ThreadPoolExecutor(max_workers=1) as executor:
            future = executor.submit(
                client.models.generate_content,
                model=model_name,
                contents=prompt,
            )
            response = future.result(timeout=45)

        raw = _strip_code_fences((response.text or "").strip())
        parsed = json.loads(raw)

        if "risks" in parsed and "all_risks" not in parsed:
            parsed["all_risks"] = parsed.pop("risks")
        if "risky_clauses" in parsed and "all_risks" not in parsed:
            parsed["all_risks"] = parsed.pop("risky_clauses")

        policy_type = (parsed.get("policy_type") or policy_type_hint or "").strip().lower()
        # ── risk_level (from AI, used to drive UI colour) ──
        ai_risk_level = (parsed.get("risk_level") or "").strip().upper()
        if ai_risk_level not in {"HIGH", "MEDIUM", "LOW"}:
            ai_risk_level = ""
        short_summary = _truncate_text(parsed.get("short_summary") or parsed.get("simplified_text") or "", 180)
        conditions = _dedupe_strings(parsed.get("conditions", []), 140)
        exclusions = _dedupe_strings(parsed.get("exclusions", []), 140)
        safe_points = _dedupe_strings(parsed.get("safe_points", []), 100)
        # ── risk_summary (high/medium/low counts) ──
        rs_raw = parsed.get("risk_summary") or {}
        risk_summary = {
            "high": max(0, int(rs_raw.get("high", 0) or 0)),
            "medium": max(0, int(rs_raw.get("medium", 0) or 0)),
            "low": max(0, int(rs_raw.get("low", 0) or 0)),
        }
        # ── evidence array ──
        evidence_raw = parsed.get("evidence") or []
        evidence = [
            {
                "snippet": _truncate_text(str(e.get("snippet", "")), 200),
                "label": str(e.get("label", "risk")).lower(),
                "impact": str(e.get("impact", "MEDIUM")).upper(),
                "confidence": max(0.0, min(1.0, float(e.get("confidence", 0.5)))),
            }
            for e in evidence_raw
            if e.get("snippet")
        ][:15]

        all_risks = _normalize_risks(parsed.get("all_risks", []), retrieved_chunks)
        # patch legal_meaning / ambiguity from AI output onto normalized risks
        ai_all_risks_raw = {r.get("title", "").strip().lower(): r for r in (parsed.get("all_risks") or [])}
        for risk in all_risks:
            raw_r = ai_all_risks_raw.get(risk["title"].strip().lower(), {})
            risk["legal_meaning"] = _truncate_text(raw_r.get("legal_meaning", ""), 120)
            risk["ambiguity"] = _truncate_text(raw_r.get("ambiguity", ""), 120)
        # ── normalize top risks (new schema: level, impact, legal_meaning, ambiguity) ──
        top_risks_raw = parsed.get("top_risks") or []
        normalized_top_risks = []
        for risk in top_risks_raw[:3]:
            level = (risk.get("level") or risk.get("impact_level") or "").upper()
            if not level or level not in {"HIGH", "MEDIUM", "LOW"}:
                # backward-compat: old schema stored level in impact field
                if risk.get("impact") in {"HIGH", "MEDIUM", "LOW"}:
                    level = risk["impact"]
                    desc = risk.get("description") or risk.get("reason") or ""
                else:
                    level = "MEDIUM"
                    desc = risk.get("impact") or risk.get("description") or risk.get("reason") or ""
            else:
                desc = risk.get("impact") or risk.get("description") or risk.get("reason") or ""

            page = risk.get("page")
            normalized_top_risks.append(
                {
                    "title": _truncate_text(risk.get("title", "Policy Risk"), 40),
                    "impact": level,
                    "description": _truncate_text(desc, 90),
                    "source": risk.get("source") or (f"Page {page}" if page else "Page 1"),
                    "legal_meaning": _truncate_text(risk.get("legal_meaning", ""), 120),
                    "ambiguity": _truncate_text(risk.get("ambiguity", ""), 120),
                }
            )
        final_verdict = _truncate_text(parsed.get("final_verdict", ""), 300)
        tags = _dedupe_strings(parsed.get("decision_tags") or parsed.get("tags", []), 32)

        raw_scores = parsed.get("scores") or parsed.get("ai_scores") or {}
        normalized_ai_scores = {
            "ai_severity": max(0, min(10, float(raw_scores.get("severity", raw_scores.get("ai_severity", 0))))),
            "ai_complexity": max(0, min(10, float(raw_scores.get("whitespace", raw_scores.get("ai_complexity", 0))))),
            "ai_risk_density": max(0, min(10, float(raw_scores.get("frequency", raw_scores.get("ai_risk_density", 0))))),
            "ai_user_impact": max(0, min(10, float(raw_scores.get("tam", raw_scores.get("ai_user_impact", 0))))),
        }

        # ── confidence ──
        conf_raw = parsed.get("confidence") or {}
        confidence = {
            "score": max(0, min(10, int(float(conf_raw.get("score", 5))))),
            "reason": _truncate_text(str(conf_raw.get("reason", "")), 120),
        }

        if not short_summary:
            short_summary = _build_short_summary(policy_type, parsed.get("simplified_text", ""), all_risks)
        if not final_verdict:
            final_verdict = _derive_final_verdict(policy_type, short_summary, all_risks, safe_points)
        if not safe_points:
            safe_points = _dedupe_strings(parsed.get("key_benefits", []), 100)
        if not tags:
            tags = _derive_tags(policy_type, safe_points, all_risks)

        quick_insight = _truncate_text(parsed.get("quick_insight") or "", 150)
        
        wtm_raw = parsed.get("what_this_means")
        if isinstance(wtm_raw, list):
            what_this_means = [_truncate_text(str(item), 100) for item in wtm_raw[:3]]
        elif isinstance(wtm_raw, str) and wtm_raw.strip():
            what_this_means = [_truncate_text(wtm_raw, 150)]
        else:
            what_this_means = [_truncate_text(_build_what_this_means(all_risks, conditions, exclusions), 150)]

        return {
            "policy_type": policy_type or policy_type_hint,
            "risk_level": ai_risk_level,
            "risk_summary": risk_summary,
            "final_verdict": final_verdict,
            "quick_insight": quick_insight,
            "what_this_means": what_this_means,
            "tags": tags[:3],
            "safe_points": safe_points,
            "short_summary": short_summary,
            "simplified_text": short_summary,
            "conditions": conditions,
            "exclusions": exclusions,
            "evidence": evidence,
            "top_risks": normalized_top_risks,
            "all_risks": all_risks,
            "confidence": confidence,
            "ai_scores": normalized_ai_scores,
            "analysis_method": f"Gemini AI (RAG) - {model_name}",
        }
    except Exception as exc:
        import traceback
        print(f"AI Analysis Error with model {model_name}: {exc}")
        traceback.print_exc()
        try:
            print(f"RAW TEXT WAS: {raw[:500]}...")
        except:
            pass
        return _fallback_analysis(retrieved_chunks, full_text, policy_type_hint)
