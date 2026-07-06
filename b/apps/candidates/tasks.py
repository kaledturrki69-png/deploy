# apps/candidates/tasks.py
from celery import shared_task
from apps.candidates.models import Resume
from apps.openaiapp.services.embedding_utils import get_embedding
import logging

logger = logging.getLogger(__name__)

@shared_task(name="candidates.embed_resume")
def embed_resume_task(resume_id: int):
    """
    Generate and store OpenAI embedding for a candidate resume.
    """
    try:
        resume = Resume.objects.select_related("candidate").get(pk=resume_id)
    except Resume.DoesNotExist:
        logger.error(f"❌ Resume {resume_id} not found.")
        return

    profile = resume.json_data or {}
    text_parts = []

    def flatten_json(obj):
        if isinstance(obj, dict):
            for v in obj.values(): flatten_json(v)
        elif isinstance(obj, list):
            for v in obj: flatten_json(v)
        elif obj:
            text_parts.append(str(obj))

    flatten_json(profile)
    text = " ".join(text_parts)[:12000]

    vector = get_embedding(text)
    if vector:
        resume.embedding = vector
        resume.save(update_fields=["embedding"])
        logger.info(f"✅ Embedded resume {resume.id} successfully ({len(vector)} dims).")
    else:
        logger.warning(f"Resume {resume.id} embedding failed.")
