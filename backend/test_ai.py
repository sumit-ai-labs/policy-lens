import asyncio
from services.ai_service import analyze_with_ai

text = "This policy covers water damage. Exclusions: Fire damage. Charge: $100 penalty for early exit."
try:
    result = analyze_with_ai(text, [{"text": text, "page": 1, "chunk_id": 1}], text)
    print("Success")
except Exception as e:
    import traceback
    traceback.print_exc()
