from django.db import models
from django.conf import settings
from django.utils import timezone
from pgvector.django import VectorField

class Candidate(models.Model):
    """
    Candidate basic identity and contact info.
    """
    company = models.ForeignKey(
        "accounts.Company",
        on_delete=models.CASCADE,
        related_name="candidates",
        help_text="Owning company (multi-tenant isolation)."
    )

    first_name = models.CharField(max_length=150, blank=True)
    last_name = models.CharField(max_length=150, blank=True)
    phone1 = models.CharField(max_length=50, blank=True)
    phone2 = models.CharField(max_length=50, blank=True)
    email1 = models.EmailField(blank=True)
    email2 = models.EmailField(blank=True)

    created_at = models.DateTimeField(default=timezone.now)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        ordering = ["last_name", "first_name"]
        unique_together = ("company", "email1")

    def __str__(self):
        full_name = f"{self.first_name} {self.last_name}".strip()
        return full_name or self.email1 or f"Candidate {self.id}"


class Resume(models.Model):
    """
    Represents one parsed résumé (structured JSON) for a candidate.
    May be sourced from upload, LinkedIn, or other systems.
    """
    SOURCE_CHOICES = [
        ("getajob", "getajob"),
        ("upload", "Upload"),
        ("linkedin", "LinkedIn"),
        ("other", "Other"),
    ]

    candidate = models.ForeignKey(
        Candidate,
        on_delete=models.CASCADE,
        related_name="resumes"
    )

    json_data = models.JSONField(default=dict, blank=True)
    embedding = VectorField(dimensions=1536, null=True, blank=True, help_text="OpenAI text-embedding-3-small vector")

    source = models.CharField(max_length=50, choices=SOURCE_CHOICES, default="getajob")

    # company that sourced it (recruiter or ATS)
    company = models.ForeignKey(
        "accounts.Company",
        on_delete=models.CASCADE,
        related_name="resumes",
        help_text="Company that sourced the resume."
    )

    # optional link to document file (if uploaded)
    document = models.ForeignKey(
        "documents.Document",
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name="resumes",
        help_text="Source file if this résumé was uploaded."
    )
    schema_version = models.CharField(max_length=20, default="1")  # 👈 added
    created_at = models.DateTimeField(default=timezone.now)

    class Meta:
        ordering = ["-created_at"]

    def __str__(self):
        return f"Resume {self.id} for {self.candidate}"
