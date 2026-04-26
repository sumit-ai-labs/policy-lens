import spacy
import re

import logging

_log = logging.getLogger(__name__)

# Load spaCy model — auto-download on first run
try:
    nlp = spacy.load("en_core_web_sm")
except OSError:
    _log.warning("spaCy model 'en_core_web_sm' not found — downloading now...")
    import subprocess
    result = subprocess.run(
        ["python", "-m", "spacy", "download", "en_core_web_sm"],
        capture_output=True, text=True
    )
    if result.returncode != 0:
        _log.error("spaCy model download failed:\n%s", result.stderr)
        raise RuntimeError("spaCy model could not be loaded or downloaded. Run: python -m spacy download en_core_web_sm")
    nlp = spacy.load("en_core_web_sm")
    _log.info("spaCy model downloaded and loaded successfully.")


# -------------------------
# CLEANING
# -------------------------
def clean_text(text: str) -> str:
    text = re.sub(r'\s+', ' ', text)
    return text.strip()


def preprocess_text(text: str) -> str:
    return clean_text(text)


# -------------------------
# SMART CLASSIFICATION
# -------------------------

# Reference sentences for semantic similarity
REFS = {
    "exclusion": nlp("This clause excludes coverage and denies claims."),
    "condition": nlp("This clause defines requirements and obligations."),
    "coverage": nlp("This clause explains what is covered."),
    "risk": nlp("This clause creates risk or claim rejection.")
}


def semantic_classify(sentence: str):
    doc = nlp(sentence)

    scores = {
        key: doc.similarity(ref_doc)
        for key, ref_doc in REFS.items()
    }

    return max(scores, key=scores.get)


def keyword_classify(sentence: str):
    s = sentence.lower()

    if re.search(r'\b(not cover|excluded|shall not|exclusion)\b', s):
        return "exclusion"
    if re.search(r'\b(must|required|shall|condition|subject to|if)\b', s):
        return "condition"
    if re.search(r'\b(covers|includes)\b', s):
        return "coverage"

    return "general"


def detect_risk(sentence: str):
    s = sentence.lower()

    if any(k in s for k in ["reject", "deny", "cancel", "void"]):
        return "high"
    if any(k in s for k in ["limit", "conditions apply"]):
        return "medium"
    return "low"


def smart_classify(sentence: str):
    try:
        # If the model has no word vectors (e.g. en_core_web_sm), similarity is unreliable
        if not nlp.vocab.vectors.size:
            return keyword_classify(sentence)
        return semantic_classify(sentence)
    except:
        return keyword_classify(sentence)


# -------------------------
# CLAUSE EXTRACTION
# -------------------------
def extract_clauses(text: str):
    cleaned = clean_text(text)
    doc = nlp(cleaned)

    clauses = []

    for sent in doc.sents:
        sentence = sent.text.strip()

        if len(sentence) < 10:
            continue

        clause_type = smart_classify(sentence)
        risk = detect_risk(sentence)

        clauses.append({
            "text": sentence,
            "type": clause_type,
            "risk": risk
        })

    return clauses