export interface TopRisk {
  title: string;
  impact: "HIGH" | "MEDIUM" | "LOW";
  description: string;
  source?: string;
  legal_meaning?: string;
  ambiguity?: string;
}

export interface RiskyClause {
  title: string;
  clause: string;
  reason: string;
  impact: "HIGH" | "MEDIUM" | "LOW";
  impact_level?: "high" | "medium" | "low";
  source?: string;
  source_page?: number;
  source_chunk_id?: number | null;
  legal_meaning?: string;
  ambiguity?: string;
}

export interface Confidence {
  score: number;   // 0–10
  reason: string;
}

export interface Scores {
  severity: number;
  frequency: number;
  tam: number;
  whitespace: number;
  policy_type?: string;
}

export interface ScoreExplanation {
  severity: string;
  frequency: string;
  tam: string;
  whitespace: string;
  itch?: string;
}

export interface RiskSummary {
  high: number;
  medium: number;
  low: number;
}

export interface AnalysisResult {
  label?: string;
  policy_type?: string;
  risk_level: "LOW" | "MEDIUM" | "HIGH";
  itch_score: number;
  final_verdict: string;
  quick_insight?: string;
  what_this_means?: string | string[];
  tags: string[];
  short_summary: string;
  summary: string;
  simplified_text: string;
  safe_points: string[];
  conditions: string[];
  exclusions: string[];
  top_risks: TopRisk[];
  risk_summary: RiskSummary;
  all_risks: RiskyClause[];
  risks: RiskyClause[];
  scores: Scores;
  score_explanation: ScoreExplanation;
  confidence?: Confidence;
  analysis_method?: string;
}

export interface ComparisonSummary {
  winner?: "policy_a" | "policy_b" | "tie";
  reason?: string[];
  recommended_policy: "policy_a" | "policy_b" | "tie";
  recommendation_reason: string;
  comparison_points: string[];
  score_deltas: {
    severity: number;
    frequency: number;
    tam: number;
    whitespace: number;
    itch: number;
  };
  risk_count_delta: number;
  condition_count_delta: number;
  exclusion_count_delta: number;
}

export interface PolicyComparisonResult {
  policy_a: AnalysisResult;
  policy_b: AnalysisResult;
  comparison: ComparisonSummary;
}
