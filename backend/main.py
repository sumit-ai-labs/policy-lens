import asyncio
import logging
import os

import fitz
from fastapi import FastAPI, File, HTTPException, UploadFile, Request
from fastapi.responses import JSONResponse
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel

from nlp_utils import preprocess_text
from rag.chunker import chunk_text
from rag.embeddings import create_embeddings
from rag.retriever import retrieve_context
from rag.vector_store import VectorStore
from services.ai_service import analyze_with_ai
from services.cache import stable_key, get_cached_result, store_result, clear_all_cache
from services.scoring import compute_hybrid_scores
from services.explanation import generate_explanation
from services import post_processor


logging.basicConfig(level=logging.INFO, format="%(asctime)s [%(levelname)s] %(message)s")
log = logging.getLogger(__name__)

app = FastAPI(title="AI Insurance Policy Analyzer", version="2.1.0")

metrics = {
    "cache_hits": 0,
    "cache_misses": 0,
    "total_requests": 0,
    "fallback_used": 0
}

origins = [
    "http://localhost:3000",
    "http://127.0.0.1:3000",
]

# When deploying, add FRONTEND_URL to your environment variables (e.g. in Render dashboard)
frontend_url = os.getenv("FRONTEND_URL")
if frontend_url:
    origins.append(frontend_url)

app.add_middleware(
    CORSMiddleware,
    allow_origins=origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

MAX_FILE_SIZE = 5 * 1024 * 1024


@app.get("/")
def root():
    return {
        "message": "AI Insurance Policy Analyzer API is running",
        "version": "2.1.0",
        "docs": "/docs",
    }


from collections import defaultdict
import time

requests_log = defaultdict(list)
RATE_LIMIT = 10
RATE_WINDOW = 60

def is_allowed(ip: str) -> bool:
    if ip == "127.0.0.1": # local testing bypass
        return True
    
    now = time.time()
    requests_log[ip] = [t for t in requests_log[ip] if now - t < RATE_WINDOW]
    
    if len(requests_log[ip]) >= RATE_LIMIT:
        return False
        
    requests_log[ip].append(now)
    # Memory cleanup guard: clear IPs with no requests recently to prevent leak
    if len(requests_log) > 1000:
        stale_ips = [k for k, v in requests_log.items() if not v or (now - v[-1] >= RATE_WINDOW)]
        for k in stale_ips:
            if k in requests_log:
                del requests_log[k]
                
    return True

@app.get("/health")
def health():
    return {"status": "ok", "pipeline": "RAG + Hybrid Scoring + Explainability"}


@app.get("/metrics")
def get_metrics():
    return metrics


@app.delete("/clear-cache")
def clear_cache_endpoint():
    """Wipe all SQLite cache rows. Works even while the server is running."""
    deleted = clear_all_cache()
    metrics["cache_hits"] = 0
    metrics["cache_misses"] = 0
    metrics["total_requests"] = 0
    metrics["fallback_used"] = 0
    return {"status": "ok", "rows_deleted": deleted, "message": f"Cache cleared. {deleted} entries removed."}


@app.post("/upload")
async def upload(file: UploadFile = File(...)):
    allowed_types = ["application/pdf", "text/plain"]
    if file.content_type not in allowed_types:
        raise HTTPException(status_code=400, detail="Invalid file type. Only PDF and TXT are accepted.")

    content = await file.read()
    if len(content) == 0:
        raise HTTPException(status_code=400, detail="Uploaded file is empty.")
    if len(content) > MAX_FILE_SIZE:
        raise HTTPException(status_code=400, detail="File too large. Maximum size is 5 MB.")

    try:
        pages = 1
        if file.content_type == "application/pdf":
            try:
                doc = fitz.open(stream=content, filetype="pdf")
            except Exception as exc:
                raise HTTPException(status_code=400, detail=f"Invalid PDF file: {exc}") from exc

            pages = len(doc)
            text = "".join(page.get_text() for page in doc)
            doc.close()
        else:
            text = content.decode("utf-8")
    except HTTPException:
        raise
    except Exception as exc:
        log.exception("Text extraction failed")
        raise HTTPException(status_code=500, detail=f"Failed to extract text: {exc}")

    text = text.strip()
    if not text:
        raise HTTPException(status_code=422, detail="Could not extract any text from the file.")

    log.info("Uploaded '%s' with %s page(s) and %s chars extracted.", file.filename, pages, len(text))
    return {"extracted_text": text, "pages": pages}


class AnalyzeRequest(BaseModel):
    text: str


class CompareRequest(BaseModel):
    policy_a_text: str
    policy_b_text: str
    policy_a_label: str = "Policy A"
    policy_b_label: str = "Policy B"


@app.post("/analyze")
async def analyze(req: AnalyzeRequest, request: Request):
    ip = request.client.host if request.client else "unknown"
    if not is_allowed(ip):
        return JSONResponse(
            status_code=429,
            content={"error": "Too many requests. Please try again in 1 minute."}
        )

    if not req.text.strip():
        raise HTTPException(status_code=400, detail="Text cannot be empty.")

    cleaned = preprocess_text(req.text)
    if not cleaned:
        raise HTTPException(status_code=422, detail="No usable text remained after preprocessing.")

    log.info("Starting RAG pipeline on %s chars.", len(cleaned))

    try:
        result, cached = await asyncio.to_thread(get_or_compute, cleaned)
    except HTTPException:
        raise
    except Exception as exc:
        log.exception("Pipeline failed")
        raise HTTPException(status_code=500, detail=f"Analysis pipeline failed: {exc}")

    return {
        "cached": cached,
        "data": result
    }


@app.post("/compare")
async def compare(req: CompareRequest, request: Request):
    ip = request.client.host if request.client else "unknown"
    if not is_allowed(ip):
        return JSONResponse(
            status_code=429,
            content={"error": "Too many requests. Please try again in 1 minute."}
        )

    if not req.policy_a_text.strip() or not req.policy_b_text.strip():
        raise HTTPException(status_code=400, detail="Both policy texts are required for comparison.")

    cleaned_a = preprocess_text(req.policy_a_text)
    cleaned_b = preprocess_text(req.policy_b_text)
    if not cleaned_a or not cleaned_b:
        raise HTTPException(status_code=422, detail="One or both policies do not contain usable text after preprocessing.")

    log.info("Starting comparison pipeline on %s and %s chars.", len(cleaned_a), len(cleaned_b))

    try:
        (result_a, cached_a), (result_b, cached_b) = await asyncio.gather(
            asyncio.to_thread(get_or_compute, cleaned_a),
            asyncio.to_thread(get_or_compute, cleaned_b),
        )
    except HTTPException:
        raise
    except Exception as exc:
        log.exception("Comparison pipeline failed")
        raise HTTPException(status_code=500, detail=f"Comparison pipeline failed: {exc}")

    def is_valid(result):
        return (
            isinstance(result.get("itch_score"), (int, float))
            and isinstance(result.get("scores"), dict)
            and len(result.get("top_risks", [])) > 0
        )

    if not is_valid(result_a) or not is_valid(result_b):
        return {
            "status": "partial",
            "message": "Low confidence analysis, cannot reliably compare",
            "cached": cached_a and cached_b,
            "data": { "policy_a": result_a, "policy_b": result_b }
        }

    result_a["label"] = req.policy_a_label.strip() or "Policy A"
    result_b["label"] = req.policy_b_label.strip() or "Policy B"

    return {
        "status": "success",
        "cached": cached_a and cached_b,
        "data": {
            "policy_a": result_a,
            "policy_b": result_b,
            "comparison": _build_comparison_summary(result_a, result_b),
        }
    }


def _choose_recommended_policy(result_a: dict, result_b: dict) -> str:
    score_a = result_a["scores"]
    score_b = result_b["scores"]

    comparison_tuple_a = (result_a["itch_score"], score_a["severity"], score_a["frequency"], -len(result_a.get("safe_points", [])))
    comparison_tuple_b = (result_b["itch_score"], score_b["severity"], score_b["frequency"], -len(result_b.get("safe_points", [])))

    if comparison_tuple_a < comparison_tuple_b:
        return "policy_a"
    if comparison_tuple_b < comparison_tuple_a:
        return "policy_b"
    return "tie"


def _build_comparison_summary(result_a: dict, result_b: dict) -> dict:
    reasons = []

    if result_a["scores"]["whitespace"] < result_b["scores"]["whitespace"]:
        reasons.append("Lower ambiguity")
    elif result_b["scores"]["whitespace"] < result_a["scores"]["whitespace"]:
        pass # The frontend code just looks at the single response anyway, wait, it compares A vs B so the reasons are typically "Why A is better". Wait, the logic the user provided assumes we're building reasons for the winner. Let me check the user snippet.
        
    # User's snippet:
    # if A["scores"]["whitespace"] < B["scores"]["whitespace"]: reasons.append("Lower ambiguity")
    # if A["risk_summary"]["high"] < B["risk_summary"]["high"]: reasons.append("Fewer high risks")
    # if A["scores"]["severity"] < B["scores"]["severity"]: reasons.append("Lower severity")
    
    # Let's adjust this so it builds reasons for the WINNER.
    
    if result_a["itch_score"] < result_b["itch_score"]:
        winner = "policy_a"
        winner_res = result_a
        loser_res = result_b
    elif result_a["itch_score"] > result_b["itch_score"]:
        winner = "policy_b"
        winner_res = result_b
        loser_res = result_a
    else:
        winner = "tie"
        winner_res = result_a
        loser_res = result_b

    if winner != "tie":
        if winner_res["scores"]["whitespace"] < loser_res["scores"]["whitespace"]:
            reasons.append("Lower ambiguity")
        if winner_res.get("risk_summary", {}).get("high", 0) < loser_res.get("risk_summary", {}).get("high", 0):
            reasons.append("Fewer high risks")
        if winner_res["scores"]["severity"] < loser_res["scores"]["severity"]:
            reasons.append("Lower severity")
        if winner_res.get("risk_summary", {}).get("medium", 0) < loser_res.get("risk_summary", {}).get("medium", 0):
            reasons.append("Fewer medium risks")
            
    if not reasons and winner != "tie":
        reasons.append("Better overall balance of risk metrics")

    # Maintain old fields for backwards compatibility with UI
    label_a = result_a.get("label", "Policy A")
    label_b = result_b.get("label", "Policy B")
    scores_a = result_a["scores"]
    scores_b = result_b["scores"]

    comparison_points = [
        f"{label_a} ITCH score: {result_a['itch_score']} vs {label_b}: {result_b['itch_score']}.",
        f"{label_a} risk count: {len(result_a.get('all_risks', []))} vs {label_b}: {len(result_b.get('all_risks', []))}.",
        f"{label_a} conditions: {len(result_a.get('conditions', []))} vs {label_b}: {len(result_b.get('conditions', []))}.",
        f"{label_a} exclusions: {len(result_a.get('exclusions', []))} vs {label_b}: {len(result_b.get('exclusions', []))}.",
    ]
    
    recommendation_reason = " ".join(reasons) if reasons else "It's a dead heat."

    return {
        "winner": winner,
        "reason": reasons,
        "recommended_policy": winner,
        "recommendation_reason": recommendation_reason,
        "comparison_points": comparison_points,
        "score_deltas": {
            "severity": scores_a["severity"] - scores_b["severity"],
            "frequency": scores_a["frequency"] - scores_b["frequency"],
            "tam": scores_a["tam"] - scores_b["tam"],
            "whitespace": scores_a["whitespace"] - scores_b["whitespace"],
            "itch": result_a["itch_score"] - result_b["itch_score"],
        },
        "risk_count_delta": len(result_a.get("all_risks", [])) - len(result_b.get("all_risks", [])),
        "condition_count_delta": len(result_a.get("conditions", [])) - len(result_b.get("conditions", [])),

        "exclusion_count_delta": len(result_a.get("exclusions", [])) - len(result_b.get("exclusions", [])),
    }


def _derive_risk_level(itch_score: int) -> str:
    if itch_score <= 40:
        return "LOW"
    elif itch_score <= 70:
        return "MEDIUM"
    else:
        return "HIGH"


def _build_risk_summary(all_risks: list[dict]) -> dict:
    return {
        "high": sum(1 for risk in all_risks if (risk.get("impact") or "").upper() == "HIGH"),
        "medium": sum(1 for risk in all_risks if (risk.get("impact") or "").upper() == "MEDIUM"),
        "low": sum(1 for risk in all_risks if (risk.get("impact") or "").upper() == "LOW"),
    }


def _normalize_final_verdict(risk_level: str, final_verdict: str, short_summary: str) -> str:
    verdict = (final_verdict or "").strip()
    if verdict:
        return verdict

    if risk_level == "HIGH":
        return "High risk - suitable only if you accept strict conditions and limited flexibility."
    if risk_level == "MEDIUM":
        return "Medium risk - suitable if you can accept some restrictions and follow the rules closely."
    return "Lower risk - suitable if the benefits match your needs and timelines."


def _resolve_what_this_means(ai_result: dict, all_risks: list[dict], conditions: list[str], exclusions: list[str]) -> list[str]:
    """Always returns a list of short user-impact bullets."""
    raw = ai_result.get("what_this_means")

    # Already a list from the AI service
    if isinstance(raw, list) and raw:
        return [str(item) for item in raw[:3]]

    # Legacy string fallback
    if isinstance(raw, str) and raw.strip():
        return [raw.strip()]

    # Derive from risk content
    risk_blob = " ".join(
        f"{risk.get('title', '')} {risk.get('reason', '')}".lower()
        for risk in all_risks[:3]
    )
    if "surrender" in risk_blob or "lock-in" in risk_blob:
        return ["You may lose money if you exit early or need flexibility."]
    if "claim" in risk_blob or "document" in risk_blob or "deadline" in risk_blob:
        return ["Missing documents or deadlines may delay or weaken your claim."]
    if exclusions:
        return ["Check the exclusions — they can sharply reduce when this policy pays."]
    if conditions:
        return ["This policy works best if you follow all timelines and document rules."]
    return ["Use this policy only if its benefits fit how you actually plan to use it."]


def get_or_compute(text: str) -> tuple[dict, bool]:
    metrics["total_requests"] += 1
    doc_hash = stable_key(text)
    
    cached = get_cached_result(doc_hash)
    if cached:
        metrics["cache_hits"] += 1
        return cached, True
        
    metrics["cache_misses"] += 1
    result = _run_pipeline(text)
    
    if result.get("analysis_method") == "Rule-Based Fallback":
        metrics["fallback_used"] += 1
        
    store_result(doc_hash, result)
    
    return result, False


def _run_pipeline(text: str) -> dict:
    chunks = chunk_text(text)
    if not chunks:
        raise ValueError("Chunker produced zero chunks. Text may be too short.")
    log.info("Step 1/6 - Chunking done: %s chunks", len(chunks))

    chunks, embeddings = create_embeddings(chunks)
    if embeddings is None or len(embeddings) == 0:
        raise ValueError("Embedding generation returned no vectors.")
    log.info("Step 2/6 - Embeddings done: shape=%s", embeddings.shape)

    store = VectorStore()
    store.build_index(chunks, embeddings)
    log.info("Step 3/6 - Vector index built")

    retrieval = retrieve_context(store, text, k=4)
    context = retrieval.get("context_text", "")
    retrieved_chunks = retrieval.get("chunks", [])
    if not context:
        context = text[:8000]
        retrieved_chunks = chunk_text(context)
        log.warning("Step 4/6 - Retriever returned nothing; using raw text fallback")
    else:
        log.info("Step 4/6 - Retrieved context: %s chars from %s chunks", len(context), len(retrieved_chunks))

    ai_result = analyze_with_ai(context, retrieved_chunks, text)
    log.info("Step 5/6 - AI analysis complete")

    all_risks = ai_result.get("all_risks", [])
    scoring = compute_hybrid_scores(ai_result.get("ai_scores", {}), all_risks, text)
    log.info("Step 6/6 - Scoring done: ITCH=%s", scoring["itch"])
    itch_score = scoring["itch"]
    
    # 3.1 Risk Level Mapping (OVERRIDE AI)
    risk_level = _derive_risk_level(itch_score)

    # 3.2 TAM CLAMP
    def has_financial_risk(risks):
        keywords = ["charge", "penalty", "deduction", "fee", "cost", "loss"]
        return any(any(k in r.get("title", "").lower() or k in r.get("reason", "").lower() or k in r.get("clause", "").lower() for k in keywords) for r in risks)

    if not has_financial_risk(all_risks):
        scoring["tam"] = min(scoring["tam"], 6)

    # 3.3 CONFIDENCE CLAMP
    if "confidence" in ai_result and "score" in ai_result["confidence"]:
        ai_result["confidence"]["score"] = min(ai_result["confidence"]["score"], 9)

    # 3.4 FREQUENCY ADJUSTMENT
    total_risks = len(ai_result.get("top_risks", [])) + len(all_risks)
    if total_risks >= 4:
        scoring["frequency"] = max(scoring["frequency"], 6)
    # Prefer AI's risk_summary (Step 8) if it contains actual counts
    ai_rs = ai_result.get("risk_summary") or {}
    ai_rs_total = (ai_rs.get("high") or 0) + (ai_rs.get("medium") or 0) + (ai_rs.get("low") or 0)
    risk_summary = ai_rs if ai_rs_total > 0 else _build_risk_summary(all_risks)
    short_summary = ai_result.get("short_summary") or ai_result.get("simplified_text", "")
    final_verdict = _normalize_final_verdict(risk_level, ai_result.get("final_verdict", ""), short_summary)
    what_this_means = _resolve_what_this_means(
        ai_result,
        all_risks,
        ai_result.get("conditions", []),
        ai_result.get("exclusions", []),
    )

    # decision_tags is the new schema field; fall back to tags
    tags = ai_result.get("decision_tags") or ai_result.get("tags", [])

    return {
        "label": "Policy",
        "policy_type": ai_result.get("policy_type") or scoring["policy_type"],
        "risk_level": risk_level,
        "itch_score": itch_score,
        "final_verdict": final_verdict,
        "what_this_means": what_this_means,
        "quick_insight": ai_result.get("quick_insight", ""),
        "tags": tags,
        "decision_tags": tags,
        "short_summary": short_summary,
        "summary": short_summary,
        "simplified_text": short_summary,
        "safe_points": ai_result.get("safe_points", []),
        "top_risks": ai_result.get("top_risks", []),
        "risk_summary": risk_summary,
        "all_risks": all_risks,
        "risks": all_risks,
        "conditions": ai_result.get("conditions", []),
        "exclusions": ai_result.get("exclusions", []),
        "evidence": ai_result.get("evidence", []),
        "scores": {
            "severity": scoring["severity"],
            "frequency": scoring["frequency"],
            "tam": scoring["tam"],
            "whitespace": scoring["whitespace"],
            "policy_type": scoring["policy_type"],
        },
        "score_explanation": generate_explanation(scoring, risk_summary),
        "confidence": ai_result.get("confidence", {"score": 5, "reason": ""}),
        "analysis_method": ai_result.get("analysis_method", "RAG + Hybrid Scoring"),
    }

    result = post_processor.run(result, text)
    return result
