from django.db.models import Count, Avg
from django.db.models.functions import TruncWeek
from django.utils import timezone
from datetime import timedelta
from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework.permissions import IsAuthenticated

from apps.candidates.models import Candidate, Resume
from apps.positions.models import Position
from apps.accounts.models import Company


def get_getajob_company():
    return Company.objects.filter(slug="getajob").first()


def compute_trend_summary(company_filter):
    """Return {current_week, previous_week, percent_change, trend} for a given Q filter."""
    now = timezone.now()
    this_week_start = now - timedelta(days=7)
    last_week_start = now - timedelta(days=14)

    current_week = Candidate.objects.filter(
        company_filter, created_at__gte=this_week_start
    ).count()
    previous_week = Candidate.objects.filter(
        company_filter,
        created_at__gte=last_week_start,
        created_at__lt=this_week_start
    ).count()

    if previous_week > 0:
        percent_change = ((current_week - previous_week) / previous_week) * 100
    else:
        percent_change = 100.0 if current_week > 0 else 0.0

    return {
        "current_week": current_week,
        "previous_week": previous_week,
        "percent_change": round(percent_change, 1),
        "trend": "up" if current_week >= previous_week else "down",
    }

class TopMatchesView(APIView):
    """Return top candidate–position matches for the company (by resume score if available)."""
    permission_classes = [IsAuthenticated]

    def get(self, request):
        company = request.user.company
        positions = Position.objects.filter(company=company, status=Position.Status.OPEN).select_related('category')[:10]
        candidates = Candidate.objects.filter(company=company).order_by('-created_at')[:5]

        results = []
        for pos in positions:
            for cand in candidates:
                results.append({
                    "position_id": pos.id,
                    "position_name": pos.name,
                    "candidate_id": cand.id,
                    "candidate_name": f"{cand.first_name} {cand.last_name}".strip() or cand.email1,
                    "score": 0.0  # real score will come from matching engine
                })
                if len(results) >= 10:
                    break
            if len(results) >= 10:
                break

        return Response(results)


class PositionsMatchingView(APIView):
    """Return open positions with their candidate counts."""
    permission_classes = [IsAuthenticated]

    def get(self, request):
        company = request.user.company
        positions = (
            Position.objects
            .filter(company=company, status=Position.Status.OPEN)
            .select_related('category')
        )

        total_candidates = Candidate.objects.filter(company=company).count()

        results = []
        for pos in positions:
            results.append({
                "position_id": pos.id,
                "position_name": pos.name,
                "total_candidates": total_candidates,
                "matched_candidates": 0,  # will be populated by matching engine
                "avg_score": 0.0,
            })

        return Response(results)


class CandidatesTrendView(APIView):
    """Return this week vs last week candidate count for the company."""
    permission_classes = [IsAuthenticated]

    def get(self, request):
        from django.db.models import Q
        company = request.user.company
        return Response(compute_trend_summary(Q(company=company)))


class GetajobCandidatesTrendView(APIView):
    """Return this week vs last week candidate count for the getajob pool."""
    permission_classes = [IsAuthenticated]

    def get(self, request):
        from django.db.models import Q
        getajob = get_getajob_company()
        if not getajob:
            return Response({"current_week": 0, "previous_week": 0, "percent_change": 0.0, "trend": "up"})
        return Response(compute_trend_summary(Q(company=getajob)))


class ActiveCandidatesView(APIView):
    """Return active candidates stats: this week vs last week."""
    permission_classes = [IsAuthenticated]

    def get(self, request):
        company = request.user.company
        now = timezone.now()
        this_week_start = now - timedelta(days=7)
        last_week_start = now - timedelta(days=14)

        this_week = Candidate.objects.filter(
            company=company, created_at__gte=this_week_start
        ).count()
        last_week = Candidate.objects.filter(
            company=company,
            created_at__gte=last_week_start,
            created_at__lt=this_week_start
        ).count()
        total = Candidate.objects.filter(company=company).count()

        if last_week > 0:
            percent_change = ((this_week - last_week) / last_week) * 100
        else:
            percent_change = 100.0 if this_week > 0 else 0.0

        trend = "up" if this_week >= last_week else "down"

        return Response({
            "active_week": this_week,
            "previous_week": last_week,
            "total_users": total,
            "trend": trend,
            "percent_change": round(percent_change, 1),
        })
