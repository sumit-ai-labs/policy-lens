def calculate_metrics(predicted, actual):
    pred_set = set(predicted)
    actual_set = set(actual)

    tp = len(pred_set & actual_set)
    fp = len(pred_set - actual_set)
    fn = len(actual_set - pred_set)

    precision = tp / (tp + fp) if (tp + fp) else 0.0
    recall = tp / (tp + fn) if (tp + fn) else 0.0

    f1 = (2 * precision * recall) / (precision + recall) if (precision + recall) else 0.0

    return precision, recall, f1
