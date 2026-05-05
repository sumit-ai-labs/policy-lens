from metrics import calculate_metrics

def extract_risk_labels(api_output):
    data = api_output.get("data", {})
    return [r.get("title", r.get("label", "")).lower() for r in data.get("risks", [])]

def extract_ground_truth_labels(gt):
    return [r.get("label", "").lower() for r in gt.get("risks", [])]

def evaluate_policy(api_output, ground_truth):
    predicted = extract_risk_labels(api_output)
    actual = extract_ground_truth_labels(ground_truth)

    precision, recall, f1 = calculate_metrics(predicted, actual)

    return {
        "precision": precision,
        "recall": recall,
        "f1": f1
    }
