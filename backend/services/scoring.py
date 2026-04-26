from __future__ import annotations

from typing import List


def _clamp(value: float, minimum: int = 0, maximum: int = 10) -> int:
    return max(minimum, min(maximum, round(value)))


def detect_policy_type(full_text: str) -> str:
    lower_text = full_text.lower()

    if "annuity" in lower_text or "pension" in lower_text or "jeevan shanti" in lower_text:
        return "life"
    if "hospital" in lower_text or "hospitalization" in lower_text:
        return "health"

    health_keywords = [
        "health insurance",
        "mediclaim",
        "critical illness",
        "day care",
        "pre-existing disease",
        "cashless",
    ]
    life_keywords = [
        "life insurance",
        "death benefit",
        "sum assured",
        "maturity",
        "nominee",
        "ulip",
        "policy term",
        "surrender value",
    ]
    general_keywords = [
        "motor",
        "vehicle",
        "travel insurance",
        "fire",
        "burglary",
        "property damage",
        "liability",
        "marine",
    ]

    if any(keyword in lower_text for keyword in life_keywords):
        return "life"
    if any(keyword in lower_text for keyword in health_keywords):
        return "health"
    if any(keyword in lower_text for keyword in general_keywords):
        return "general"
    return "general"


def _impact_score(risks: List[dict], target_level: str) -> int:
    return sum(1 for risk in risks if risk.get("impact_level", "").lower() == target_level)


def _tam_score(policy_type: str, ai_user_impact: float, risk_count: int) -> int:
    base_scores = {
        "health": 9,
        "life": 8,
        "general": 7,
    }
    base = base_scores.get(policy_type, 7)
    uplift = 1 if policy_type == "health" and ai_user_impact >= 8 and risk_count >= 8 else 0
    return _clamp(base + uplift, maximum=9)


def compute_hybrid_scores(ai_scores: dict, risks: list, full_text: str) -> dict:
    """
    Compute dynamic hybrid scores driven by AI signals, extracted risks,
    and detected policy type.
    """
    ai_severity = float(ai_scores.get("ai_severity", 0))
    ai_complexity = float(ai_scores.get("ai_complexity", 0))
    ai_density = float(ai_scores.get("ai_risk_density", 0))
    ai_user_impact = float(ai_scores.get("ai_user_impact", 0))

    risk_count = len(risks)
    high_risk_count = _impact_score(risks, "high")
    medium_risk_count = _impact_score(risks, "medium")
    policy_type = detect_policy_type(full_text)

    severity = _clamp(
        (ai_severity * 0.75) + (high_risk_count * 0.9) + (medium_risk_count * 0.25),
        maximum=9,
    )
    frequency = _clamp(
        (min(risk_count, 8) * 0.5) + (ai_density * 0.5),
        maximum=8,
    )
    tam = _tam_score(policy_type, ai_user_impact, risk_count)
    whitespace = _clamp((ai_complexity * 0.65) + (ai_density * 0.35) + 0.25, maximum=9)

    itch_raw = (
        (severity * 0.32)
        + (frequency * 0.23)
        + (tam * 0.20)
        + (whitespace * 0.25)
    )
    itch = max(0, min(100, round(itch_raw * 10)))

    score_explanation = {
        "severity": (
            f"Severity blends AI severity {ai_severity:.1f} with "
            f"{high_risk_count} high-risk and {medium_risk_count} medium-risk clause(s), "
            "while avoiding automatic max scores."
        ),
        "frequency": (
            f"Frequency blends {risk_count} detected risk clause(s) with "
            f"AI risk density {ai_density:.1f} to avoid overcounting noisy lists."
        ),
        "tam": (
            f"TAM is based on {policy_type} policy classification and "
            f"user-impact signal {ai_user_impact:.1f}, with conservative caps for non-health products."
        ),
        "whitespace": (
            f"Whitespace weights AI complexity {ai_complexity:.1f} more heavily than "
            f"risk density {ai_density:.1f}."
        ),
        "itch": (
            f"ITCH is the weighted blend of severity {severity}, frequency {frequency}, "
            f"TAM {tam}, and whitespace {whitespace}."
        ),
    }

    return {
        "severity": severity,
        "frequency": frequency,
        "tam": tam,
        "whitespace": whitespace,
        "itch": itch,
        "policy_type": policy_type,
        "high_risk_count": high_risk_count,
        "medium_risk_count": medium_risk_count,
        "score_explanation": score_explanation,
    }
