"""
post_processor.py
─────────────────
Safe, non-breaking post-scoring adjustment layer.
Wraps the final result dict to calibrate scores, fix generic insights,
and clean decision tags – WITHOUT touching the core scoring pipeline.
"""

from __future__ import annotations

import logging

log = logging.getLogger(__name__)

# Keywords that indicate a structured / tabular policy document (e.g. schedule of rates)
_STRUCTURED_KEYWORDS = ["%", "table", "schedule", "rate", "depreciation"]

# Generic "covers-everything" phrases that should never appear in quick_insight
_GENERIC_INSIGHT_PHRASES = ["covers", "provides coverage", "offers coverage", "includes coverage"]

# Tag substrings that add noise without adding value
_TAG_BLOCKLIST = ["protection"]


def adjust_scores(result: dict, raw_text: str) -> dict:
    """
    Apply post-scoring calibration adjustments.

    Rules (all safe / bounded):
    1. If the document is structured/tabular → lower whitespace (it's clearer than prose)
    2. If financial risks are detected → cap TAM at 8; else cap at 6
    3. Guard: clamp all adjusted scores to [0, 10]
    """
    scores = result.get("scores", {})
    top_risks = result.get("top_risks", [])
    text_lower = raw_text.lower() if raw_text else ""

    # --- 1. Structured policy detection ---
    is_structured = any(k in text_lower for k in _STRUCTURED_KEYWORDS)

    # --- 2. Whitespace adjustment ---
    if is_structured:
        current_ws = scores.get("whitespace", 6)
        new_ws = max(4, current_ws - 2)
        if new_ws != current_ws:
            log.info("[PostProcessor] Whitespace adjusted %s → %s (structured doc)", current_ws, new_ws)
        scores["whitespace"] = new_ws

    # --- 3. TAM adjustment ---
    has_financial_risk = any(
        "depreciation" in r.get("title", "").lower() or
        "financial" in r.get("title", "").lower()
        for r in top_risks
    )
    current_tam = scores.get("tam", 7)
    if has_financial_risk:
        scores["tam"] = min(current_tam, 8)
    else:
        scores["tam"] = min(current_tam, 6)

    # --- 4. Guard: clamp all scores to [0, 10] ---
    for key in ("severity", "frequency", "tam", "whitespace"):
        if key in scores:
            scores[key] = max(0, min(10, scores[key]))

    result["scores"] = scores
    return result


def fix_quick_insight(result: dict) -> dict:
    """
    Ensure quick_insight is user-impact focused, not a generic description.
    Replaces any insight that starts with a generic 'covers / provides' phrase.
    """
    insight = result.get("quick_insight", "")
    if not insight or any(phrase in insight.lower() for phrase in _GENERIC_INSIGHT_PHRASES):
        top_risks = result.get("top_risks", [])
        if top_risks:
            first_risk = top_risks[0]
            title = first_risk.get("title", "")
            level = first_risk.get("impact", "HIGH")
            result["quick_insight"] = f"{level.capitalize()} risk: {title} may reduce claim payout or approval."
        else:
            result["quick_insight"] = "Key risks may reduce claim payout or approval."
        log.info("[PostProcessor] Generic quick_insight replaced.")

    return result


def clean_decision_tags(result: dict) -> dict:
    """
    Remove noise tags that don't convey actionable information.
    """
    tags = result.get("tags", [])
    cleaned = [t for t in tags if not any(block in t.lower() for block in _TAG_BLOCKLIST)]
    result["tags"] = cleaned
    result["decision_tags"] = cleaned
    return result


def run(result: dict, raw_text: str) -> dict:
    """
    Master entry point — runs all post-processing steps in order.
    Safe to call even if result is partial/fallback.
    """
    try:
        result = adjust_scores(result, raw_text)
    except Exception as exc:
        log.warning("[PostProcessor] adjust_scores failed: %s", exc)

    try:
        result = fix_quick_insight(result)
    except Exception as exc:
        log.warning("[PostProcessor] fix_quick_insight failed: %s", exc)

    try:
        result = clean_decision_tags(result)
    except Exception as exc:
        log.warning("[PostProcessor] clean_decision_tags failed: %s", exc)

    return result
