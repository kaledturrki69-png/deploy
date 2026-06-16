from django.db import models
from django.conf import settings
from django.utils.translation import gettext_lazy as _
from apps.accounts.models import Company
from pgvector.django import VectorField

def get_default_user():
    try:
        return settings.DEFAULT_USER_ID
    except AttributeError:
        return None


class PositionCategory(models.Model):
    """Publicly readable category, writable only by getajob users."""
    name = models.CharField(max_length=255, unique=True, verbose_name=_("Name"))
    description = models.TextField(blank=True, verbose_name=_("Description"))

    class Meta:
        verbose_name = _("Position Category")
        verbose_name_plural = _("Position Categories")
        ordering = ["name"]

    def __str__(self):
        return self.name


class Skill(models.Model):
    """Professional or behavioral skill (owned by company or from getajob library)."""

    class SkillType(models.TextChoices):
        HARD = "hard", _("Hard Skill")
        SOFT = "soft", _("Soft Skill")

    company = models.ForeignKey(Company, on_delete=models.CASCADE, related_name="skills")
    user = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.SET_NULL, null=True, blank=True, default=get_default_user)
    type = models.CharField(max_length=10, choices=SkillType.choices)
    name = models.CharField(max_length=255)
    description = models.TextField(blank=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        unique_together = ("company", "name", "type")
        ordering = ["name"]

    def __str__(self):
        return f"{self.name} ({self.get_type_display()})"


class Condition(models.Model):
    """Candidate requirement condition (owned by company or from getajob library)."""
    company = models.ForeignKey(Company, on_delete=models.CASCADE, related_name="conditions")
    user = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.SET_NULL, null=True, blank=True, default=get_default_user)
    name = models.CharField(max_length=255)
    description = models.TextField(blank=True)
    formula = models.CharField(max_length=255, help_text=_("Example: age > 20"))
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        unique_together = ("company", "name")
        ordering = ["name"]

    def __str__(self):
        return self.name


class Position(models.Model):
    """Job position owned by a company or provided by getajob as library."""

    class Status(models.TextChoices):
        OPEN = "open", _("Open")
        CLOSED = "closed", _("Closed")

    company = models.ForeignKey(Company, on_delete=models.CASCADE, related_name="positions")
    user = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.SET_NULL, null=True, blank=True, default=get_default_user)
    category = models.ForeignKey("PositionCategory", on_delete=models.SET_NULL, null=True, blank=True, related_name="positions")
    name = models.CharField(max_length=255)
    description = models.TextField(blank=True)
    expected_hiring_date = models.DateField(null=True, blank=True)
    number_to_hire = models.PositiveIntegerField(default=1)
    number_to_shortlist = models.PositiveIntegerField(default=0)
    status = models.CharField(max_length=10, choices=Status.choices, default=Status.OPEN)
    is_library = models.BooleanField(default=False, help_text=_("If true, this position is a reusable template (library)."))

    skills = models.ManyToManyField("Skill", through="PositionSkill", related_name="positions")
    conditions = models.ManyToManyField("Condition", through="PositionCondition", related_name="positions", blank=True)

    embedding = VectorField(dimensions=1536, null=True, blank=True)
    embedding_status = models.CharField(
        max_length=20,
        choices=[("pending", "Pending"), ("done", "Done"), ("idle", "Idle")],
        default="idle",
        help_text="Status of the embedding process."
    )
    last_embedding_at = models.DateTimeField(null=True, blank=True)

    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        unique_together = ("company", "name")
        ordering = ["-created_at"]

    def __str__(self):
        return f"{self.name}{' (Template)' if self.is_library else ''}"


class PositionSkill(models.Model):
    """Intermediate table linking Position ↔ Skill with a weight factor (1–5)."""
    position = models.ForeignKey(Position, on_delete=models.CASCADE, related_name="positionskill_set")
    skill = models.ForeignKey(Skill, on_delete=models.CASCADE)
    weight = models.PositiveSmallIntegerField(default=3)

    class Meta:
        unique_together = ("position", "skill")


class PositionCondition(models.Model):
    position = models.ForeignKey(Position, on_delete=models.CASCADE, related_name="positioncondition_set")
    condition = models.ForeignKey(Condition, on_delete=models.CASCADE)

    class Meta:
        unique_together = ("position", "condition")
