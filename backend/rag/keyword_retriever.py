import re

PATTERNS = [
    r"\bexclusion\b",
    r"\bvoid\b",
    r"\bpenalty\b",
    r"\bdeductible\b",
    r"\bdepreciation\b",
    r"\bclaim.*denied\b"
]

def keyword_chunks(chunks):
    results = []

    for chunk in chunks:
        text = chunk.get("text", "").lower()

        if any(re.search(p, text) for p in PATTERNS):
            results.append(chunk)

    return results[:5]
