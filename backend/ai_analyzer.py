import os

from dotenv import load_dotenv

from nlp_utils import extract_clauses
from rag.chunker import chunk_text
from services.ai_service import analyze_with_ai
from services.scoring import compute_hybrid_scores


env_path = os.path.join(os.path.dirname(__file__), ".env")
load_dotenv(env_path)


def get_api_key():
    return os.getenv("GEMINI_API_KEY") or os.getenv("GOOGLE_API_KEY")


def _format_context(chunks: list[dict], limit: int = 4) -> str:
    selected = chunks[:limit]
    return "\n\n".join(
        f"--- Chunk {chunk.get('chunk_id')} (Page {chunk.get('page', 1)}) ---\n{chunk.get('text', '')}"
        for chunk in selected
    )


def _normalize_top_risks(all_risks: list[dict]) -> list[dict]:
    top_risks = []
    for risk in all_risks[:3]:
        top_risks.append(
            {
                "title": risk.get("title") or "Policy Risk",
                "impact": (risk.get("impact") or "MEDIUM").upper(),
                "description": risk.get("reason") or "Review this clause before deciding.",
                "source": risk.get("source") or "Page 1",
            }
        )
    return top_risks


def _assemble_response(result: dict, text: str) -> dict:
    all_risks = result.get("all_risks", result.get("risks", []))
    scores = compute_hybrid_scores(result.get("ai_scores", {}), all_risks, text)
    itch_score = scores["itch"]
    risk_level = "HIGH" if itch_score >= 70 else "MEDIUM" if itch_score >= 40 else "LOW"
    short_summary = result.get("short_summary") or result.get("simplified_text", "")
    final_verdict = (result.get("final_verdict") or "").strip()
    if not final_verdict:
        if risk_level == "HIGH":
            final_verdict = "High risk - suitable only if you accept strict conditions and limited flexibility."
        elif risk_level == "MEDIUM":
            final_verdict = "Medium risk - suitable if you can accept some restrictions and follow the rules closely."
        else:
            final_verdict = "Lower risk - suitable if the benefits match your needs and timelines."
    what_this_means = (result.get("what_this_means") or "").strip()
    if not what_this_means:
        risk_blob = " ".join(f"{risk.get('title', '')} {risk.get('reason', '')}".lower() for risk in all_risks[:3])
        if "surrender" in risk_blob or "lock-in" in risk_blob:
            what_this_means = "You may lose money if you exit early or need flexibility."
        elif "claim" in risk_blob or "document" in risk_blob or "deadline" in risk_blob:
            what_this_means = "Missing documents or deadlines may delay or weaken your claim."
        elif result.get("exclusions"):
            what_this_means = "Check the exclusions first because they can sharply reduce when this policy pays."
        else:
            what_this_means = "Use this policy only if its benefits fit how you actually plan to use it."
    risk_summary = {
        "high": sum(1 for risk in all_risks if (risk.get("impact") or "").upper() == "HIGH"),
        "medium": sum(1 for risk in all_risks if (risk.get("impact") or "").upper() == "MEDIUM"),
        "low": sum(1 for risk in all_risks if (risk.get("impact") or "").upper() == "LOW"),
    }
    return {
        "risk_level": risk_level,
        "itch_score": itch_score,
        "final_verdict": final_verdict,
        "what_this_means": what_this_means,
        "tags": result.get("tags", []),
        "short_summary": short_summary,
        "summary": short_summary,
        "simplified_text": short_summary,
        "policy_type": result.get("policy_type") or scores["policy_type"],
        "safe_points": result.get("safe_points", []),
        "exclusions": result.get("exclusions", []),
        "conditions": result.get("conditions", []),
        "top_risks": result.get("top_risks", []) or _normalize_top_risks(all_risks),
        "risk_summary": risk_summary,
        "all_risks": all_risks,
        "risks": all_risks,
        "scores": {
            "severity": scores["severity"],
            "frequency": scores["frequency"],
            "tam": scores["tam"],
            "whitespace": scores["whitespace"],
            "policy_type": scores["policy_type"],
        },
        "score_explanation": scores["score_explanation"],
        "analysis_method": result.get("analysis_method", "Legacy Analyzer Wrapper"),
    }


def analyze_policy(text: str):
    chunks = chunk_text(text)
    context = _format_context(chunks) or text[:8000]

    if get_api_key():
        try:
            return _assemble_response(analyze_with_ai(context, chunks[:4], text), text)
        except Exception as exc:
            print("Gemini failed:", exc)

    result = analyze_with_fallback(text)
    result["analysis_method"] = "Rule-based Fallback (No API Key or Error)"
    return result


def analyze_with_gemini(text: str, api_key: str | None = None):
    _ = api_key
    chunks = chunk_text(text)
    context = _format_context(chunks) or text[:8000]
    return _assemble_response(analyze_with_ai(context, chunks[:4], text), text)


def compute_final_scores(ai_scores, risks, text):
    return compute_hybrid_scores(ai_scores, risks, text)


def analyze_with_fallback(text: str):
    clauses = extract_clauses(text)

    exclusions = []
    conditions = []
    risky_clauses = []

    for clause in clauses:
        clause_text = clause.get("text", "")
        if clause.get("type") == "exclusion":
            exclusions.append(clause_text)
        if clause.get("type") == "condition":
            conditions.append(clause_text)
        if clause.get("risk") == "high":
            risky_clauses.append(
                {
                    "title": "Manual Review Needed",
                    "clause": clause_text,
                    "reason": "This clause may lead to claim rejection or financial disadvantage.",
                    "impact": "HIGH",
                    "impact_level": "high",
                    "source": "Page 1",
                    "source_page": 1,
                    "source_chunk_id": None,
                }
            )

    ai_scores_fallback = {
        "ai_severity": min(10, max(1, len(risky_clauses) * 2)),
        "ai_complexity": 4,
        "ai_risk_density": min(10, max(len(risky_clauses), len(exclusions))),
        "ai_user_impact": 5,
    }
    assembled = {
        "policy_type": "unknown",
        "final_verdict": "Manual review recommended before you rely on this policy decision.",
        "what_this_means": "Review the exclusions and conditions manually before you make a decision.",
        "tags": ["\u26A0\uFE0F Manual review needed", "\u23F1 Check detailed clauses"],
        "short_summary": (
            "This policy contains conditions and exclusions that should be reviewed carefully "
            "before purchase or claim submission."
        ),
        "simplified_text": (
            "This policy contains conditions and exclusions that should be reviewed carefully "
            "before purchase or claim submission."
        ),
        "safe_points": [],
        "exclusions": exclusions or ["No exclusions detected"],
        "conditions": conditions or ["No conditions detected"],
        "top_risks": _normalize_top_risks(risky_clauses),
        "all_risks": risky_clauses,
        "ai_scores": ai_scores_fallback,
        "analysis_method": "Rule-based Fallback",
    }
    return _assemble_response(assembled, text)
