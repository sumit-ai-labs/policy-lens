def generate_explanation(scores: dict, risk_summary: dict) -> dict:
    total_risks = sum(risk_summary.values())
    high = risk_summary.get("high", 0)

    # Base simple reasons
    severity_reason = f"{high} high-impact risks detected"
    frequency_reason = f"{total_risks} total risks identified"
    tam_reason = "Based on financial and coverage impact"
    whitespace_reason = "Based on ambiguity in policy terms"
    
    # Optional dynamic tuning
    if high == 0 and total_risks > 0:
        severity_reason = "No high-impact risks detected"
    elif high == 0 and total_risks == 0:
        severity_reason = "No risks detected"
        frequency_reason = "Zero risks identified"
        
    if scores.get("whitespace", 0) < 4:
        whitespace_reason = "Clear, standard policy language"
    elif scores.get("whitespace", 0) > 7:
        whitespace_reason = "High ambiguity and dense clauses"

    return {
        "severity": severity_reason,
        "frequency": frequency_reason,
        "tam": tam_reason,
        "whitespace": whitespace_reason
    }
