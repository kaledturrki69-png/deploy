import mimetypes
import os
from pathlib import Path
from django.http import FileResponse, Http404
from django.conf import settings
from rest_framework import viewsets, status, filters
from rest_framework.decorators import action
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response

from .models import Document
from .serializers import DocumentSerializer
from .filters import DocumentFilter
from apps.documents.tasks import process_document  # Celery task

from drf_spectacular.utils import extend_schema_view, extend_schema, OpenApiParameter, OpenApiTypes


@extend_schema_view(
    list=extend_schema(description="List all documents for the current user's company."),
    create=extend_schema(description="Upload one or more documents."),
    retrieve=extend_schema(
        parameters=[OpenApiParameter("id", OpenApiTypes.INT, OpenApiParameter.PATH, description="Document ID")],
        description="Get a single document's metadata.",
    ),
    # update=extend_schema(
    #     parameters=[OpenApiParameter("id", OpenApiTypes.INT, OpenApiParameter.PATH, description="Document ID")],
    #     description="Update a document's metadata.",
    # ),
    # partial_update=extend_schema(
    #     parameters=[OpenApiParameter("id", OpenApiTypes.INT, OpenApiParameter.PATH, description="Document ID")],
    #     description="Partially update a document's metadata.",
    # ),
    # destroy=extend_schema(
    #     parameters=[OpenApiParameter("id", OpenApiTypes.INT, OpenApiParameter.PATH, description="Document ID")],
    #     description="Delete a document.",
    # ),
    download=extend_schema(
        parameters=[OpenApiParameter("id", OpenApiTypes.INT, OpenApiParameter.PATH, description="Document ID")],
        description="Download a specific document (binary stream).",
    ),
)
class DocumentViewSet(viewsets.ModelViewSet):
    """
    Secure company-specific document upload, listing, and retrieval.
    """
    lookup_field = "id"
    lookup_url_kwarg = "id"

    serializer_class = DocumentSerializer
    permission_classes = [IsAuthenticated]
    filterset_class = DocumentFilter
    filter_backends = [filters.OrderingFilter, filters.SearchFilter]
    ordering_fields = ["filename", "size", "mime_type", "uploaded_at"]
    search_fields = ["filename", "mime_type"]
    http_method_names = ["get", "post", "put", "patch", "delete"]
    
    def get_queryset(self):
        """
        Only documents belonging to the authenticated user's company.
        """
        if not hasattr(self, "request") or self.request is None:
            return Document.objects.none()
        return Document.objects.filter(company=self.request.user.company)

    def create(self, request, *args, **kwargs):
        """
        Upload one or more files, set metadata (source, doc_type, company, uploaded_by),
        and start background processing.
        """
        user = request.user
        files = request.FILES.getlist("files")

        if not files:
            return Response({"detail": "No files provided.s"}, status=400)

        # Optional: allow overriding the source field
        source = request.data.get("source", "upload")
        allowed_sources = [c[0] for c in Document.SOURCE_CHOICES]
        if source not in allowed_sources:
            source = "upload"

        company_slug = user.company.slug or user.company.name.lower().replace(" ", "_")
        company_folder = Path(settings.STORAGE_ROOT) / company_slug
        os.makedirs(company_folder, exist_ok=True)

        created = []
        for f in files:
            mime_type, _ = mimetypes.guess_type(f.name)
            if mime_type and "pdf" in mime_type:
                doc_type = "pdf"
            elif mime_type and any(x in mime_type for x in ["word", "doc"]):
                doc_type = "doc"
            else:
                doc_type = "other"

            doc = Document.objects.create(
                uploaded_by=user,
                company=user.company,
                file=f,
                filename=f.name,
                size=f.size,
                mime_type=mime_type or "application/octet-stream",
                doc_type=doc_type,
                source=source,
            )
            created.append(doc)

            # Optional: trigger async Celery processing
            try:
                process_document.delay(doc.id)
            except Exception:
                pass  # in case Celery is not running, upload still succeeds

        return Response(
            DocumentSerializer(created, many=True).data,
            status=status.HTTP_201_CREATED
        )

    @extend_schema(
        parameters=[
            OpenApiParameter(
                name="id",
                type=OpenApiTypes.INT,
                location=OpenApiParameter.PATH,
                description="Document ID",
            )
        ],
        responses={
            200: {"type": "file"},
            403: {"description": "Forbidden – document does not belong to the user's company"},
            404: {"description": "File not found"},
        },
        description="Download a specific document (binary stream).",
    )
    @action(detail=True, methods=["get"], url_path="download")
    def download(self, request, id: int = None):
        """
        Securely download a document belonging to the same company.
        """
        doc = self.get_object()
        if doc.company != request.user.company:
            return Response({"detail": "Forbidden"}, status=403)

        file_path = Path(settings.STORAGE_ROOT) / doc.file.name
        if not file_path.exists():
            raise Http404("File not found")

        return FileResponse(
            open(file_path, "rb"),
            as_attachment=True,
            filename=doc.filename,
            content_type=doc.mime_type or "application/octet-stream",
        )
