from rest_framework import viewsets, permissions, generics
from django.db.models import Q
from rest_framework.exceptions import PermissionDenied
from apps.accounts.models import Company
from .models import Skill, Condition, Position, PositionCategory, PositionSkill, PositionCondition
from .serializers import (
    SkillSimpleSerializer, ConditionSimpleSerializer,
    PositionSerializer, PositionLibraryShortSerializer,
    PositionCategorySerializer
)


def get_getajob_company():
    """Return the getajob library company."""
    return Company.objects.filter(slug="getajob").first()


class CompanyScopedViewSetMixin:
    """Filters by authenticated user's company + optionally includes getajob library."""

    def get_queryset(self):
        user = self.request.user
        if not user.is_authenticated:
            return self.queryset.none()
        company = getattr(user, "company", None)
        if not company:
            return self.queryset.none()
        getajob = get_getajob_company()
        filters = Q(company=company)
        if getattr(company, "view_library", False) and getajob:
            filters |= Q(company=getajob)
        return self.queryset.filter(filters).distinct()

    def perform_create(self, serializer):
        user = self.request.user
        serializer.save(user=user, company=user.company)


# --- PositionCategory (read for all, write for getajob only) ---

class PositionCategoryViewSet(viewsets.ModelViewSet):
    queryset = PositionCategory.objects.all()
    serializer_class = PositionCategorySerializer
    permission_classes = [permissions.IsAuthenticated]

    def check_permissions(self, request):
        super().check_permissions(request)
        if request.method in permissions.SAFE_METHODS:
            return
        getajob = get_getajob_company()
        if getattr(request.user, "company", None) != getajob:
            raise PermissionDenied("Only getajob users can modify categories.")


# --- CRUD ---

class SkillViewSet(CompanyScopedViewSetMixin, viewsets.ModelViewSet):
    queryset = Skill.objects.all()
    serializer_class = SkillSimpleSerializer
    permission_classes = [permissions.IsAuthenticated]


class ConditionViewSet(CompanyScopedViewSetMixin, viewsets.ModelViewSet):
    queryset = Condition.objects.all()
    serializer_class = ConditionSimpleSerializer
    permission_classes = [permissions.IsAuthenticated]


class PositionViewSet(CompanyScopedViewSetMixin, viewsets.ModelViewSet):
    queryset = Position.objects.select_related("company", "user", "category").prefetch_related(
        "skills", "conditions"
    )
    serializer_class = PositionSerializer
    permission_classes = [permissions.IsAuthenticated]

    def perform_create(self, serializer):
        user = self.request.user
        company = user.company
        base_template_id = self.request.data.get("template_id")
        position = serializer.save(user=user, company=company, is_library=False)
        if base_template_id:
            self.clone_from_template(position, base_template_id, company)
        return position

    def clone_from_template(self, position, template_id, company):
        getajob = get_getajob_company()
        base = Position.objects.filter(
            Q(id=template_id, is_library=True)
            & (Q(company=company) | (Q(company=getajob) if getattr(company, "view_library", False) else Q()))
        ).first()
        if not base:
            return
        for ps in base.positionskill_set.all():
            PositionSkill.objects.create(position=position, skill=ps.skill, weight=ps.weight)
        for pc in base.positioncondition_set.all():
            PositionCondition.objects.create(position=position, condition=pc.condition)

    def perform_update(self, serializer):
        instance = self.get_object()
        was_library = instance.is_library
        position = serializer.save()
        if not was_library and position.is_library:
            new_pos = Position.objects.create(
                company=instance.company,
                user=instance.user,
                category=instance.category,
                name=instance.name,
                description=instance.description,
                is_library=True,
                expected_hiring_date=None,
                number_to_hire=0,
                number_to_shortlist=0,
                status=Position.Status.OPEN,
            )
            for ps in instance.positionskill_set.all():
                PositionSkill.objects.create(position=new_pos, skill=ps.skill, weight=ps.weight)
            for pc in instance.positioncondition_set.all():
                PositionCondition.objects.create(position=new_pos, condition=pc.condition)
            return new_pos


# --- Libraries (GET-only) ---

class PositionLibraryView(generics.ListAPIView):
    serializer_class = PositionLibraryShortSerializer
    permission_classes = [permissions.IsAuthenticated]

    def get_queryset(self):
        user = self.request.user
        company = getattr(user, "company", None)
        if not company:
            return Position.objects.none()
        getajob = get_getajob_company()
        filters = Q(company=company, is_library=True)
        if getattr(company, "view_library", False) and getajob:
            filters |= Q(company=getajob, is_library=True)
        qs = Position.objects.filter(filters).select_related("category").only(
            "id", "name", "description", "company_id", "is_library", "category"
        )
        q = self.request.query_params.get("q")
        if q:
            qs = qs.filter(Q(name__icontains=q) | Q(description__icontains=q))
        return qs.order_by("name")
