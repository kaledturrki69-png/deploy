from celery import shared_task
from pathlib import Path
from django.conf import settings
from django.db import transaction
from django.core.exceptions import ValidationError
import fitz  # PyMuPDF

from .models import Document
from apps.candidates.models import Candidate, Resume
from apps.openaiapp.utils import extract_resume_json, DEFAULT_SCHEMA_VERSION
from apps.openaiapp.services.CandidateProfile import CandidateProfile
from apps.openaiapp.services.embedding_utils import get_embedding


def extract_text_from_file(file_path: Path) -> str:
    """Extract text from PDF or DOCX."""
    text_content = ""
    suffix = file_path.suffix.lower()

    if suffix == ".pdf":
        with fitz.open(file_path) as pdf_doc:
            text_content = "\n".join(page.get_text("text") for page in pdf_doc)
    elif suffix in [".docx", ".doc"]:
        try:
            import docx
            doc = docx.Document(file_path)
            text_content = "\n".join(p.text for p in doc.paragraphs)
        except Exception as e:
            raise ValueError(f"Cannot extract text from DOC/DOCX: {e}")
    else:
        raise ValueError(f"Unsupported file type: {suffix}")

    return text_content.strip()


@shared_task(bind=True)
def process_document(self, document_id: int):
    """Extract resume data via LLM and persist Candidate + Resume objects."""
    doc = Document.objects.get(id=document_id)
    try:
        doc.processing_status = "pending"
        doc.processing_progress = 5
        doc.save(update_fields=["processing_status", "processing_progress"])

        # -------------------- 1️⃣ Extract text --------------------
        file_path = Path(settings.STORAGE_ROOT) / doc.file.name
        resume_text = extract_text_from_file(file_path)
        if not resume_text:
            raise ValueError("No text could be extracted from the document.")

        doc.processing_progress = 25
        doc.save(update_fields=["processing_progress"])

        # -------------------- 2️⃣ LLM parse (structured JSON) --------------------
        result = extract_resume_json(resume_text, schema_version=DEFAULT_SCHEMA_VERSION)
        if "error" in result:
            raise ValueError(result["error"])

        # -------------------- 3️⃣ Parse with Pydantic model --------------------
        try:
            parsed = CandidateProfile.model_validate(result)
        except Exception as e:
            raise ValueError(f"Schema validation failed: {e}")

        doc.processing_progress = 50
        doc.save(update_fields=["processing_progress"])

        # -------------------- 4️⃣ Persist Candidate + Resume --------------------
        with transaction.atomic():
            # create candidate (email is unique per company)
            candidate, _ = Candidate.objects.get_or_create(
                company=doc.company,
                email1=parsed.email.lower(),
                defaults={
                    "first_name": parsed.name.split()[0] if parsed.name else "",
                    "last_name": " ".join(parsed.name.split()[1:]) if parsed.name else "",
                    "phone1": parsed.phone or "",
                },
            )

            resume = Resume.objects.create(
                candidate=candidate,
                company=doc.company,
                source=doc.source,
                document=doc,
                schema_version=DEFAULT_SCHEMA_VERSION,
                json_data=parsed.model_dump(mode="json"),
            )

            # -------------------- 5️⃣ Generate & store embedding --------------------
            try:
                resume_text_for_embedding = " ".join([
                    parsed.name or "",
                    " ".join(getattr(parsed, "skills", []) or []),
                    " ".join(
                        str(exp) for exp in (getattr(parsed, "experience", []) or [])
                    ),
                    getattr(parsed, "summary", "") or "",
                ]).strip()
                if resume_text_for_embedding:
                    embedding = get_embedding(resume_text_for_embedding)
                    if embedding:
                        resume.embedding = embedding
                        resume.save(update_fields=["embedding"])
            except Exception as embed_err:
                # Non-fatal: embedding failure doesn't block the upload
                import logging
                logging.getLogger(__name__).warning(f"Embedding failed for resume {resume.id}: {embed_err}")

            doc.candidate = candidate
            doc.processing_progress = 100
            doc.processing_status = "success"
            doc.processing_result = None
            doc.save(
                update_fields=[
                    "candidate",
                    "processing_progress",
                    "processing_status",
                    "processing_result",
                ]
            )

    except Exception as e:
        doc.processing_status = "error"
        doc.processing_result = str(e)
        doc.save(update_fields=["processing_status", "processing_result"])
        raise
