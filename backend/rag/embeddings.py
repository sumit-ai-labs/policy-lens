import numpy as np
from typing import List, Dict
from sentence_transformers import SentenceTransformer
from cachetools import LRUCache
from services.cache import stable_key

# Lazy-load the model to avoid slow startup times
_model = None
embedding_cache = LRUCache(maxsize=2000)

def _get_model() -> SentenceTransformer:
    global _model
    if _model is None:
        print("[Embeddings] Loading SentenceTransformer model...")
        _model = SentenceTransformer('all-MiniLM-L6-v2')
        print("[Embeddings] Model loaded.")
    return _model


def create_embeddings(chunks: List[Dict]):
    """
    Generate normalized float32 embeddings for a list of chunk dictionaries.
    Returns the original chunks and a numpy array of embeddings.
    """
    if not chunks:
        return chunks, np.array([])

    model = _get_model()
    texts_to_encode = []
    text_indices = []
    
    embeddings = np.zeros((len(chunks), 384), dtype=np.float32) # MiniLM is 384 dim
    
    for i, chunk in enumerate(chunks):
        text = chunk["text"]
        key = stable_key(text)
        if key in embedding_cache:
            embeddings[i] = embedding_cache[key]
        else:
            texts_to_encode.append(text)
            text_indices.append(i)

    if texts_to_encode:
        new_embeddings = model.encode(
            texts_to_encode,
            convert_to_numpy=True,
            show_progress_bar=False,
            normalize_embeddings=True,
        )
        for text, idx, emb in zip(texts_to_encode, text_indices, new_embeddings):
            result_emb = emb.astype(np.float32)
            embedding_cache[stable_key(text)] = result_emb
            embeddings[idx] = result_emb

    return chunks, embeddings


def get_query_embedding(query: str) -> np.ndarray:
    """
    Generate a normalized float32 embedding for a search query.
    """
    key = stable_key(query)
    if key in embedding_cache:
        return embedding_cache[key]
        
    model = _get_model()
    embedding = model.encode(
        [query],
        convert_to_numpy=True,
        show_progress_bar=False,
        normalize_embeddings=True,
    )
    result = embedding[0].astype(np.float32)
    embedding_cache[key] = result
    return result
