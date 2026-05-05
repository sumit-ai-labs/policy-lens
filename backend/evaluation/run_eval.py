import json
import requests
from evaluator import evaluate_policy

def call_analyze_api(text):
    try:
        response = requests.post(
            "http://localhost:8000/analyze",
            json={"text": text}
        )
        response.raise_for_status()
        return response.json()
    except Exception as e:
        print(f"Error calling API: {e}")
        return {"risks": []}

def run_evaluation():
    try:
        with open("ground_truth.json") as f:
            dataset = json.load(f)
    except FileNotFoundError:
        print("Error: ground_truth.json not found.")
        return

    results = []
    
    print("\n--- Starting Evaluation ---\n")

    for policy in dataset:
        api_output = call_analyze_api(policy["text"])
        metrics = evaluate_policy(api_output, policy)
        
        print(f"Policy {policy['policy_id']} -> Precision: {metrics['precision']:.2f} | Recall: {metrics['recall']:.2f} | F1: {metrics['f1']:.2f}")
        results.append({
            "policy_id": policy["policy_id"],
            "metrics": metrics
        })

    print("\n--- Evaluation Complete ---\n")
    return results

def run_consistency_test(policy_text, iterations=3):
    print(f"\n--- Running Consistency Test ({iterations} iterations) ---")
    outputs = []
    for i in range(iterations):
        outputs.append(call_analyze_api(policy_text))
    
    # Check consistency
    first_output_risks = [r.get("title", "").lower() for r in outputs[0].get("data", {}).get("risks", [])]
    is_consistent = True
    
    for i in range(1, iterations):
        current_risks = [r.get("title", "").lower() for r in outputs[i].get("data", {}).get("risks", [])]
        if set(first_output_risks) != set(current_risks):
            is_consistent = False
            print(f"Inconsistency detected on iteration {i+1}!")
            break
            
    if is_consistent:
        print("Consistency check passed. API outputs identical risks across iterations.")
    else:
        print("Consistency check failed.")
        
    print("-------------------------------------------\n")

if __name__ == "__main__":
    run_evaluation()
    
    # Run a consistency test on the first policy if available
    try:
        with open("ground_truth.json") as f:
            dataset = json.load(f)
            if dataset:
                run_consistency_test(dataset[0]["text"])
    except Exception:
        pass
