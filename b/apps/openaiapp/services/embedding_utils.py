# apps/openaiapp/embedding_utils.py
from openai import OpenAI
from django.conf import settings
import logging
import os

logger = logging.getLogger(__name__)

def get_openai_client():
    return OpenAI(api_key=getattr(settings, "OPENAI_API_KEY", None))

def get_embedding(text: str, model: str = "text-embedding-3-small") -> list[float]:
    """
    Create a multilingual embedding vector for a given text.
    Supports Arabic, French, English, etc.
    """
    text = (text or "").strip()
    if not text:
        return []

    client = get_openai_client()
    try:
        model = os.getenv("OPENAI_EMBEDDING_MODEL", "text-embedding-3-small")
        response = client.embeddings.create(model=model, input=text)
        return response.data[0].embedding
    except Exception as e:
        logger.exception(f"Failed to embed text ({len(text)} chars): {e}")
        return []
