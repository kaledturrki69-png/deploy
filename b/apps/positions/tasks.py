# apps/positions/tasks.py
from celery import shared_task
from django.conf import settings
from django.utils import timezone
from apps.positions.models import Position
from apps.openaiapp.services.embedding_utils import get_embedding
import logging

logger = logging.getLogger(__name__)

@shared_task(bind=True, autoretry_for=(Exception,), retry_backoff=True, max_retries=5)
def embed_position_task(self, position_id: int):
    """
    Actually performs the embedding of a Position (after debounce delay).
    """
    try:
        position = Position.objects.get(pk=position_id)
    except Position.DoesNotExist:
        logger.warning(f"Position {position_id} not found.")
        return

    # If already done or manually canceled
    if position.embedding_status == "done":
        logger.info(f"Position {position.id} already embedded.")
        return

    # Build embedding text
    parts = [position.name, position.description]
    # for h in position.skills:
    #     parts.append(h.get("name", ""))
    #     parts.append(h.get("description", ""))
    # # for s in position.soft_skills:
    # #     parts.append(s.get("name", ""))
    # #     parts.append(s.get("description", ""))
    # # for c in position.conditions:
    # #     parts.append(c.get("name", ""))
    # #     parts.append(str(c.get("value", "")))
    text = " ".join(filter(None, parts))[:12000]

    vector = get_embedding(text)
    if not vector:
        logger.error(f"Failed to embed position {position.id}")
        position.embedding_status = "idle"
        position.save(update_fields=["embedding_status"])
        return

    # Save embedding
    position.embedding = vector
    position.embedding_status = "done"
    position.last_embedding_at = timezone.now()
    position.save(update_fields=["embedding", "embedding_status", "last_embedding_at"])
    logger.info(f"Embedded position {position.id} successfully.")
