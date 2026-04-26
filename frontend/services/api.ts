const BASE_URL = process.env.NEXT_PUBLIC_API_URL || "http://127.0.0.1:8000";

export const uploadFile = async (file: File) => {
  const formData = new FormData();
  formData.append("file", file);

  const response = await fetch(`${BASE_URL}/upload`, {
    method: "POST",
    body: formData,
  });

  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}));
    throw new Error(errorData.detail || "Upload failed");
  }

  return response.json();
};

export const analyzePolicy = async (text: string) => {
  const response = await fetch(`${BASE_URL}/analyze`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ text }),
  });

  if (!response.ok) {
    if (response.status === 429) {
      const errorData = await response.json().catch(() => ({}));
      throw new Error(errorData.error || "Too many requests. Please wait and try again.");
    }
    const errorData = await response.json().catch(() => ({}));
    throw new Error(errorData.error || errorData.detail || "Analysis failed");
  }

  const json = await response.json();
  
  if (json && typeof json === "object" && "cached" in json) {
    const data = json.data;
    if (json.cached) {
      if (!data.decision_tags) data.decision_tags = [];
      if (!data.decision_tags.includes("⚡ Instant result (cached)")) {
        data.decision_tags.push("⚡ Instant result (cached)");
      }
    }
    return data;
  }

  return json;
};

export const comparePolicies = async (
  policyAText: string,
  policyBText: string,
  policyALabel = "Policy A",
  policyBLabel = "Policy B",
) => {
  const response = await fetch(`${BASE_URL}/compare`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      policy_a_text: policyAText,
      policy_b_text: policyBText,
      policy_a_label: policyALabel,
      policy_b_label: policyBLabel,
    }),
  });

  if (!response.ok) {
    if (response.status === 429) {
      const errorData = await response.json().catch(() => ({}));
      throw new Error(errorData.error || "Too many requests. Please wait and try again.");
    }
    const errorData = await response.json().catch(() => ({}));
    throw new Error(errorData.error || errorData.detail || "Comparison failed");
  }

  const json = await response.json();
  
  if (json && typeof json === "object" && "cached" in json) {
    const data = json.data;
    if (json.cached) {
      if (data.policy_a) {
        if (!data.policy_a.decision_tags) data.policy_a.decision_tags = [];
        if (!data.policy_a.decision_tags.includes("⚡ Instant result (cached)")) {
          data.policy_a.decision_tags.push("⚡ Instant result (cached)");
        }
      }
      if (data.policy_b) {
        if (!data.policy_b.decision_tags) data.policy_b.decision_tags = [];
        if (!data.policy_b.decision_tags.includes("⚡ Instant result (cached)")) {
          data.policy_b.decision_tags.push("⚡ Instant result (cached)");
        }
      }
    }
    return data;
  }

  return json;
};

