import faiss
import numpy as np
from typing import List, Dict


class VectorStore:
    def __init__(self):
        self.index = None
        self.chunks: List[Dict] = []

    def build_index(self, chunks: List[Dict], embeddings: np.ndarray):
        """
        Build a FAISS in-memory inner-product index (cosine sim on normalized vecs).
        """
        self.chunks = chunks

        if embeddings is None or len(embeddings) == 0:
            print("[VectorStore] No embeddings to index.")
            return

        embeddings = embeddings.astype(np.float32)
        dimension = embeddings.shape[1]

        # IndexFlatIP = dot product; with normalized vectors this equals cosine similarity
        self.index = faiss.IndexFlatIP(dimension)
        self.index.add(embeddings)
        print(f"[VectorStore] Indexed {len(chunks)} chunks, dim={dimension}.")

    def search_with_scores(self, query_embedding: np.ndarray, k: int = 5) -> List[Dict]:
        """
        Return top-k most similar chunks with similarity scores.
        """
        if self.index is None or len(self.chunks) == 0:
            print("[VectorStore] Index is empty, returning all chunks.")
            return [
                {**chunk, "similarity_score": None}
                for chunk in self.chunks[:k]
            ]

        query_vec = np.array([query_embedding], dtype=np.float32)
        k = min(k, len(self.chunks))

        scores, indices = self.index.search(query_vec, k)
        print(f"[VectorStore] Top-{k} scores: {scores[0].tolist()}")

        ranked_pairs = sorted(
            zip(scores[0], indices[0]),
            key=lambda pair: (-float(pair[0]), int(pair[1])),
        )

        results = []
        for score, idx in ranked_pairs:
            if 0 <= idx < len(self.chunks):
                results.append({
                    **self.chunks[idx],
                    "similarity_score": float(score),
                })
        return results

    def search(self, query_embedding: np.ndarray, k: int = 5) -> List[Dict]:
        """
        Backward-compatible search that returns chunks only.
        """
        return [
            {key: value for key, value in chunk.items() if key != "similarity_score"}
            for chunk in self.search_with_scores(query_embedding, k=k)
        ]
