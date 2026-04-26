import unittest
from unittest.mock import patch

import numpy as np
from fastapi.testclient import TestClient

import ai_analyzer
import main
from rag import retriever
from services.cache import clear_all_cache
from services.scoring import compute_hybrid_scores, detect_policy_type


def sample_result(
    label: str = "Policy",
    itch_score: int = 59,
    risk_level: str = "MEDIUM",
) -> dict:
    return {
        "label": label,
        "policy_type": "life",
        "risk_level": risk_level,
        "itch_score": itch_score,
        "final_verdict": "Medium risk - suitable if you can accept some restrictions and follow the rules closely.",
        "what_this_means": "You may lose money if you exit early or miss claim rules.",
        "tags": ["✅ Fixed income", "⚠️ Limited flexibility", "❗ Strict rules"],
        "short_summary": "Fixed income plan. Lock-in and surrender penalties reduce flexibility.",
        "summary": "Fixed income plan. Lock-in and surrender penalties reduce flexibility.",
        "simplified_text": "Fixed income plan. Lock-in and surrender penalties reduce flexibility.",
        "safe_points": ["Guaranteed income", "Death benefit"],
        "top_risks": [
            {
                "title": "Surrender Penalty",
                "impact": "HIGH",
                "description": "Early exit can reduce value.",
                "source": "Page 1",
            },
            {
                "title": "Claim Restrictions",
                "impact": "MEDIUM",
                "description": "Missing documents may delay payout.",
                "source": "Page 2",
            },
            {
                "title": "Strict Deadline",
                "impact": "MEDIUM",
                "description": "Claims need timely filing.",
                "source": "Page 3",
            },
        ],
        "risk_summary": {"high": 1, "medium": 2, "low": 0},
        "all_risks": [
            {
                "title": "Surrender Penalty",
                "clause": "Surrender value can be reduced on early exit.",
                "reason": "Early exit can reduce value.",
                "impact": "HIGH",
                "impact_level": "high",
                "source": "Page 1",
            },
            {
                "title": "Claim Restrictions",
                "clause": "Submit claim documents within 90 days.",
                "reason": "Missing documents may delay payout.",
                "impact": "MEDIUM",
                "impact_level": "medium",
                "source": "Page 2",
            },
            {
                "title": "Strict Deadline",
                "clause": "Claims must be filed within 90 days.",
                "reason": "Claims need timely filing.",
                "impact": "MEDIUM",
                "impact_level": "medium",
                "source": "Page 3",
            },
        ],
        "risks": [
            {
                "title": "Surrender Penalty",
                "clause": "Surrender value can be reduced on early exit.",
                "reason": "Early exit can reduce value.",
                "impact": "HIGH",
                "impact_level": "high",
                "source": "Page 1",
            }
        ],
        "conditions": ["Claim within 90 days", "Submit ID proof", "Keep premium current"],
        "exclusions": ["Suicide clause", "Policy lapse", "Fraud claims"],
        "scores": {
            "severity": 7,
            "frequency": 5,
            "tam": 8,
            "whitespace": 6,
            "policy_type": "life",
        },
        "score_explanation": {
            "severity": "Blends AI severity with high-risk count.",
            "frequency": "Blends risk count with AI density.",
            "tam": "Based on policy type.",
            "whitespace": "Based on complexity.",
            "itch": "Weighted blend of the four component scores.",
        },
        "analysis_method": "Mocked Pipeline",
    }


class ApiEndpointTests(unittest.TestCase):
    def setUp(self):
        clear_all_cache()
        self.client = TestClient(main.app)

    def test_health_endpoint(self):
        response = self.client.get("/health")
        self.assertEqual(response.status_code, 200)
        body = response.json()
        self.assertEqual(body["status"], "ok")
        self.assertIn("pipeline", body)

    def test_upload_text_file(self):
        response = self.client.post(
            "/upload",
            files={"file": ("policy.txt", b"Sample insurance policy text.", "text/plain")},
        )
        self.assertEqual(response.status_code, 200)
        body = response.json()
        self.assertEqual(body["pages"], 1)
        self.assertIn("Sample insurance policy text.", body["extracted_text"])

    def test_upload_rejects_invalid_type(self):
        response = self.client.post(
            "/upload",
            files={"file": ("policy.docx", b"binary", "application/vnd.openxmlformats-officedocument.wordprocessingml.document")},
        )
        self.assertEqual(response.status_code, 400)
        self.assertIn("Invalid file type", response.json()["detail"])

    def test_upload_rejects_empty_file(self):
        response = self.client.post(
            "/upload",
            files={"file": ("empty.txt", b"", "text/plain")},
        )
        self.assertEqual(response.status_code, 400)
        self.assertIn("empty", response.json()["detail"].lower())

    def test_upload_rejects_invalid_pdf(self):
        response = self.client.post(
            "/upload",
            files={"file": ("bad.pdf", b"not a real pdf", "application/pdf")},
        )
        self.assertEqual(response.status_code, 400)
        self.assertIn("Invalid PDF", response.json()["detail"])

    def test_analyze_rejects_empty_text(self):
        response = self.client.post("/analyze", json={"text": "   "})
        self.assertEqual(response.status_code, 400)
        self.assertIn("cannot be empty", response.json()["detail"])

    def test_analyze_success_contract(self):
        with patch.object(main, "_run_pipeline", return_value=sample_result()):
            response = self.client.post("/analyze", json={"text": "Annuity policy with surrender penalties."})

        self.assertEqual(response.status_code, 200)
        outer = response.json()
        self.assertIn("cached", outer)
        self.assertIn("data", outer)
        body = outer["data"]
        for key in [
            "policy_type",
            "risk_level",
            "itch_score",
            "final_verdict",
            "what_this_means",
            "tags",
            "top_risks",
            "risk_summary",
            "safe_points",
            "conditions",
            "exclusions",
            "all_risks",
            "scores",
        ]:
            self.assertIn(key, body)

    def test_compare_requires_both_policies(self):
        response = self.client.post(
            "/compare",
            json={"policy_a_text": "Policy A", "policy_b_text": "   "},
        )
        self.assertEqual(response.status_code, 400)
        self.assertIn("required", response.json()["detail"])

    def test_compare_success_contract(self):
        def fake_get_or_compute(text: str):
            if "A" in text:
                return sample_result("Policy A", 58), False
            return sample_result("Policy B", 72, "HIGH"), False

        with patch.object(main, "get_or_compute", side_effect=fake_get_or_compute):
            response = self.client.post(
                "/compare",
                json={
                    "policy_a_text": "Policy A text",
                    "policy_b_text": "Policy B text",
                    "policy_a_label": "Policy A",
                    "policy_b_label": "Policy B",
                },
            )

        self.assertEqual(response.status_code, 200)
        outer = response.json()
        self.assertEqual(outer["status"], "success")
        self.assertIn("data", outer)
        body = outer["data"]
        self.assertEqual(body["comparison"]["recommended_policy"], "policy_a")
        self.assertIn("policy_a", body)
        self.assertIn("policy_b", body)
        self.assertIn("comparison", body)


class PipelineUnitTests(unittest.TestCase):
    def test_detect_policy_type_cases(self):
        self.assertEqual(detect_policy_type("LIC New Jeevan Shanti annuity pension plan"), "life")
        self.assertEqual(detect_policy_type("Hospital cashless coverage for hospitalization"), "health")
        self.assertEqual(detect_policy_type("Vehicle damage and motor liability policy"), "general")

    def test_compute_hybrid_scores_bounds(self):
        scores = compute_hybrid_scores(
            {
                "ai_severity": 7,
                "ai_complexity": 6,
                "ai_risk_density": 5,
                "ai_user_impact": 6,
            },
            [
                {"impact_level": "high"},
                {"impact_level": "medium"},
                {"impact_level": "medium"},
            ],
            "Annuity policy with surrender clause",
        )
        self.assertGreaterEqual(scores["itch"], 0)
        self.assertLessEqual(scores["itch"], 100)
        self.assertEqual(scores["policy_type"], "life")

    def test_retrieve_context_dedupes_and_limits(self):
        class FakeVectorStore:
            def __init__(self):
                self.chunks = [
                    {"chunk_id": 1, "page": 1, "text": "Claim deadline applies"},
                    {"chunk_id": 2, "page": 2, "text": "Surrender penalty applies"},
                    {"chunk_id": 3, "page": 3, "text": "Claim deadline applies"},
                    {"chunk_id": 4, "page": 4, "text": "General clause"},
                ]

            def search_with_scores(self, query_embedding, k=5):
                return [
                    {"chunk_id": 1, "page": 1, "text": "Claim deadline applies", "similarity_score": 0.9},
                    {"chunk_id": 3, "page": 3, "text": "Claim deadline applies", "similarity_score": 0.88},
                    {"chunk_id": 2, "page": 2, "text": "Surrender penalty applies", "similarity_score": 0.87},
                ]

        with patch.object(retriever, "get_query_embedding", return_value=np.array([0.1, 0.2], dtype=np.float32)):
            with patch.object(retriever, "keyword_chunks", return_value=[]):
                result = retriever.retrieve_context(FakeVectorStore(), "Policy text", k=2)

        self.assertLessEqual(len(result["chunks"]), 10)
        self.assertEqual(len({chunk["chunk_id"] for chunk in result["chunks"]}), len(result["chunks"]))
        self.assertIn("Chunk", result["context_text"])

    def test_run_pipeline_assembles_response(self):
        with patch.object(main, "chunk_text", return_value=[{"chunk_id": 1, "page": 1, "text": "Clause A"}]):
            with patch.object(main, "create_embeddings", return_value=([{"chunk_id": 1, "page": 1, "text": "Clause A"}], np.array([[0.1, 0.2]], dtype=np.float32))):
                class DummyStore:
                    def build_index(self, chunks, embeddings):
                        self.chunks = chunks

                with patch.object(main, "VectorStore", return_value=DummyStore()):
                    with patch.object(main, "retrieve_context", return_value={"context_text": "Context", "chunks": [{"chunk_id": 1, "page": 1, "text": "Clause A"}]}):
                        with patch.object(
                            main,
                            "analyze_with_ai",
                            return_value={
                                "policy_type": "life",
                                "final_verdict": "",
                                "what_this_means": "",
                                "tags": ["✅ Fixed income"],
                                "short_summary": "Annuity plan with lock-in.",
                                "safe_points": ["Guaranteed income"],
                                "top_risks": sample_result()["top_risks"],
                                "all_risks": sample_result()["all_risks"],
                                "conditions": ["Claim within 90 days"],
                                "exclusions": ["Suicide clause"],
                                "ai_scores": {
                                    "ai_severity": 7,
                                    "ai_complexity": 6,
                                    "ai_risk_density": 5,
                                    "ai_user_impact": 6,
                                },
                                "analysis_method": "Mocked Gemini",
                            },
                        ):
                            result = main._run_pipeline("Sample policy text")

        self.assertEqual(result["policy_type"], "life")
        self.assertIn("what_this_means", result)
        self.assertIn("final_verdict", result)
        self.assertEqual(result["risk_summary"]["high"], 1)

    def test_legacy_analyzer_fallback_shape(self):
        result = ai_analyzer.analyze_with_fallback(
            "Claim must be submitted within 90 days. Suicide clause applies. Premium must remain current."
        )
        for key in ["risk_level", "itch_score", "final_verdict", "what_this_means", "scores", "conditions", "exclusions"]:
            self.assertIn(key, result)


if __name__ == "__main__":
    unittest.main(verbosity=2)
