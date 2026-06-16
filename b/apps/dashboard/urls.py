from django.urls import path
from .views import (
    TopMatchesView, PositionsMatchingView,
    CandidatesTrendView, GetajobCandidatesTrendView, ActiveCandidatesView
)

urlpatterns = [
    path('top-matches/', TopMatchesView.as_view(), name='dashboard-top-matches'),
    path('positions-matching/', PositionsMatchingView.as_view(), name='dashboard-positions-matching'),
    path('candidates-trend/', CandidatesTrendView.as_view(), name='dashboard-candidates-trend'),
    path('getajob-candidates-trend/', GetajobCandidatesTrendView.as_view(), name='dashboard-getajob-candidates-trend'),
    path('active-candidates/', ActiveCandidatesView.as_view(), name='dashboard-active-candidates'),
]
