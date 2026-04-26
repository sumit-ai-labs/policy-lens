import re
import spacy
from typing import List, Dict
from cachetools import LRUCache
from services.cache import stable_key

chunk_cache = LRUCache(maxsize=1000)

# Load spaCy model (downloads automatically if missing)
try:
    nlp = spacy.load("en_core_web_sm")
except OSError:
    import subprocess, sys
    subprocess.run([sys.executable, "-m", "spacy", "download", "en_core_web_sm"], check=True)
    nlp = spacy.load("en_core_web_sm")


def _clean(text: str) -> str:
    """Remove excessive whitespace."""
    text = re.sub(r'\s+', ' ', text)
    return text.strip()


def chunk_text(text: str, page_map: Dict[int, str] = None, max_words: int = 200, overlap: int = 50) -> List[Dict]:
    """
    Split text into chunks of ~max_words with overlap.
    """
    cache_input = text if not page_map else str(page_map)
    key = stable_key(cache_input) + f":{max_words}:{overlap}"
    if key in chunk_cache:
        return chunk_cache[key]
        
    chunks: List[Dict] = []
    chunk_id = 0
    
    if page_map:
        for page_num, page_text in page_map.items():
            cleaned = _clean(page_text)
            if not cleaned: continue
            words = cleaned.split()
            i = 0
            while i < len(words):
                chunk_words = words[i:i+max_words]
                chunk_text_str = " ".join(chunk_words)
                chunks.append({
                    "chunk_id": chunk_id,
                    "text": chunk_text_str,
                    "page": page_num
                })
                chunk_id += 1
                i += max(1, max_words - overlap)
    else:
        cleaned = _clean(text)
        if cleaned:
            words = cleaned.split()
            i = 0
            while i < len(words):
                chunk_words = words[i:i+max_words]
                chunk_text_str = " ".join(chunk_words)
                chunks.append({
                    "chunk_id": chunk_id,
                    "text": chunk_text_str,
                    "page": 1
                })
                chunk_id += 1
                i += max(1, max_words - overlap)

    print(f"[Chunker] Produced {len(chunks)} chunks from {'page_map' if page_map else 'raw text'}.")
    chunk_cache[key] = chunks
    return chunks
