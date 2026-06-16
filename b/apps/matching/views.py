from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework.permissions import IsAuthenticated
from pgvector.django import CosineDistance
from django.db.models import Q

from apps.candidates.models import Candidate, Resume
from apps.positions.models import Position
from apps.openaiapp.services.embedding_utils import get_embedding


class PositionMatchingView(APIView):
    """
    Return candidates ranked by semantic similarity to the given position.
    Uses pgvector cosine distance on resume embeddings vs position embedding.
    Falls back to listing candidates without scores if embeddings are unavailable.
    """
    permission_classes = [IsAuthenticated]

    def get(self, request, position_id):
        company = request.user.company

        # --- 1. Fetch position (must belong to the user's company) ---
        try:
            position = Position.objects.get(id=position_id, company=company)
        except Position.DoesNotExist:
            return Response({"detail": "Position not found."}, status=404)

        # --- 2. Build position query text from skills ---
        position_skills = list(
            position.skills.values_list("name", flat=True)
        )
        position_query_text = " ".join(
            [position.name, position.description or ""] + position_skills
        ).strip()

        # --- 3. Get or generate position embedding ---
        position_embedding = position.embedding
        if not position_embedding and position_query_text:
            position_embedding = get_embedding(position_query_text)
            if position_embedding:
                position.embedding = position_embedding
                position.embedding_status = "done"
                from django.utils import timezone
                position.last_embedding_at = timezone.now()
                position.save(update_fields=["embedding", "embedding_status", "last_embedding_at"])

        # --- 4. Query candidates with embeddings ---
        resume_qs = Resume.objects.filter(
            company=company,
            embedding__isnull=False
        ).select_related("candidate")

        if position_embedding and resume_qs.exists():
            # Use pgvector cosine distance to rank
            resume_qs = resume_qs.annotate(
                distance=CosineDistance("embedding", position_embedding)
            ).order_by("distance")[:20]

            results = []
            for resume in resume_qs:
                candidate = resume.candidate
                score = round(1.0 - float(resume.distance), 4)  # cosine similarity

                # Matched skills: check what skills appear in the resume JSON
                resume_skills = []
                json_data = resume.json_data or {}
                raw_skills = json_data.get("skills", [])
                if isinstance(raw_skills, list):
                    raw_lower = {s.lower() if isinstance(s, str) else "" for s in raw_skills}
                    resume_skills = [s for s in position_skills if s.lower() in raw_lower]

                results.append({
                    "candidate": {
                        "id": candidate.id,
                        "first_name": candidate.first_name,
                        "last_name": candidate.last_name,
                        "email": candidate.email1,
                    },
                    "score": max(0.0, score),
                    "matched_hard_skills": resume_skills,
                    "matched_soft_skills": [],
                    "resume_id": resume.id,
                })

            return Response(results)

        # --- 5. Fallback: return candidates without scores if no embeddings ---
        candidates = Candidate.objects.filter(company=company).order_by("-created_at")[:20]
        results = [
            {
                "candidate": {
                    "id": c.id,
                    "first_name": c.first_name,
                    "last_name": c.last_name,
                    "email": c.email1,
                },
                "score": 0.0,
                "matched_hard_skills": [],
                "matched_soft_skills": [],
                "resume_id": None,
            }
            for c in candidates
        ]
        return Response(results)
