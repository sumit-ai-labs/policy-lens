import re
from .embeddings import get_query_embedding
from .keyword_retriever import keyword_chunks

def _normalize_chunk_text(text: str) -> str:
    return re.sub(r"\s+", " ", text.strip().lower())

def retrieve_context(vector_store, full_text: str, k: int = 8) -> dict:
    """
    Retrieve the top-k most relevant unique chunks from the vector store using a
    document-aware query and preserve similarity ranking.
    """
    if not vector_store.chunks:
        print("[Retriever] No chunks available.")
        return {"context_text": "", "chunks": []}

    query_text = full_text[:1000] + " summarize risks and conditions"
    query_embedding = get_query_embedding(query_text)

    ranked_chunks = vector_store.search_with_scores(query_embedding, k=max(k * 2, k))
    semantic_chunks = []
    seen_texts = set()

    for chunk in ranked_chunks:
        normalized = _normalize_chunk_text(chunk.get("text", ""))
        if not normalized or normalized in seen_texts:
            continue
        seen_texts.add(normalized)
        semantic_chunks.append(chunk)
        if len(semantic_chunks) >= k:
            break

    keyword_results = keyword_chunks(vector_store.chunks)

    tail_chunks = []
    if len(keyword_results) < 2:
        tail_chunks = vector_store.chunks[-3:]

    final_chunks = []
    final_chunks += semantic_chunks[:6]
    final_chunks += keyword_results[:3]
    final_chunks += tail_chunks[:2]

    seen = set()
    unique_chunks = []
    for c in final_chunks:
        chunk_id = c.get("chunk_id")
        if chunk_id not in seen:
            unique_chunks.append(c)
            seen.add(chunk_id)

    final_chunks = unique_chunks[:10]

    print("Semantic:", len(semantic_chunks))
    print("Keyword:", len(keyword_results))
    print("Tail:", len(tail_chunks))
    print("Final:", len(final_chunks))

    print(
        "[Retriever] Ranked chunks:",
        [
            {
                "chunk_id": chunk.get("chunk_id"),
                "page": chunk.get("page", 1),
            }
            for chunk in final_chunks
        ],
    )

    combined = "\n\n".join(
        f"--- Chunk {c.get('chunk_id')} (Page {c.get('page', 1)}) ---\n{c.get('text')}"
        for c in final_chunks
    )
    return {
        "context_text": combined,
        "chunks": final_chunks,
    }
