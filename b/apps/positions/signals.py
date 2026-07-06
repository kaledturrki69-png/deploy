from django.db.models.signals import post_save
from django.dispatch import receiver
from django.conf import settings
from apps.positions.models import Position
from apps.positions.tasks import embed_position_task
import logging
import os

logger = logging.getLogger(__name__)

# Delay (seconds) between last update and embedding
EMBEDDING_DELAY = int(os.getenv("POSITION_EMBEDDING_DELAY", 60))


@receiver(post_save, sender=Position)
def trigger_delayed_embedding(sender, instance, created, **kwargs):
    """
    Debounce-style trigger for Position embedding.

    Embedding runs only if:
      - The position is newly created, OR
      - Its 'name' or 'description' field has changed.

    Skips:
      - Already embedded positions (embedding_status='done')
      - Pending embeddings
      - Positions with no meaningful text
      - Updates that only change embedding fields
    """
    if kwargs.get('update_fields'):
        fields = set(kwargs['update_fields'])
        # If we are only updating embedding fields, skip to prevent infinite loops
        if fields.issubset({'embedding_status', 'embedding', 'last_embedding_at'}):
            return

    # Skip if currently embedding
    if instance.embedding_status == "pending":
        logger.debug(f"⏳ Position {instance.id} already pending embedding, skip scheduling.")
        return

    # Skip if already embedded and nothing changed
    if not created and instance.embedding_status == "done" and instance.embedding is not None:
        # Fetch the version in DB before save to compare
        try:
            old = Position.objects.get(pk=instance.pk)
        except Position.DoesNotExist:
            old = None

        if old:
            # Only trigger if name or description changed
            same_name = old.name == instance.name
            same_description = old.description == instance.description
            if same_name and same_description:
                logger.debug(f"🟢 Position {instance.id}: unchanged fields, skip embedding.")
                return

    # Skip if no text to embed
    if not instance.name and not instance.description:
        logger.debug(f"⚠️ Position {instance.id} missing name/description, skip embedding.")
        return

    # Mark as pending and schedule delayed embedding
    Position.objects.filter(pk=instance.pk).update(embedding_status="pending")

    logger.info(f"Scheduling embedding for Position {instance.id} in {EMBEDDING_DELAY}s...")
    try:
        embed_position_task.apply_async((instance.id,), countdown=EMBEDDING_DELAY)
    except Exception as e:
        logger.error(f"Failed to schedule embedding for Position {instance.id}: {e}")
        # Reset status if scheduling failed
        Position.objects.filter(pk=instance.pk).update(embedding_status="idle")
