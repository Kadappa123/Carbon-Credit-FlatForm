from rest_framework import generics, permissions, viewsets
from rest_framework.decorators import action
from rest_framework.response import Response
from django_filters.rest_framework import DjangoFilterBackend
from django.utils import timezone

from .models import Company, EmissionSubmission
from .serializers import (
    CompanySerializer,
    CompanyRegistrationSerializer,
    EmissionSubmissionSerializer,
    EmissionSubmissionCreateSerializer,
)
from .permissions import IsCompanyUser


# -------------------- COMPANY PROFILE --------------------

class CompanyProfileView(generics.RetrieveUpdateAPIView):
    serializer_class = CompanySerializer
    permission_classes = [permissions.IsAuthenticated, IsCompanyUser]

    def get_object(self):
        return self.request.user.company


# -------------------- COMPANY REGISTRATION --------------------

class CompanyRegistrationView(generics.CreateAPIView):
    serializer_class = CompanyRegistrationSerializer
    permission_classes = [permissions.IsAuthenticated]

    def perform_create(self, serializer):
        company = serializer.save(user=self.request.user)

        # Auto approve (you can change later)
        company.status = 'approved'
        company.permitted_emission_limit = 1000000
        company.daily_trading_limit = 10000
        company.credit_balance = 100
        company.save()


# -------------------- EMISSION SUBMISSION --------------------

class EmissionSubmissionViewSet(viewsets.ModelViewSet):
    permission_classes = [permissions.IsAuthenticated, IsCompanyUser]

    def get_serializer_class(self):
        if self.action == 'create':
            return EmissionSubmissionCreateSerializer
        return EmissionSubmissionSerializer

    def get_queryset(self):
        return EmissionSubmission.objects.filter(
            company=self.request.user.company
        ).order_by('-created_at')

    def perform_create(self, serializer):
        company = self.request.user.company

        submission = serializer.save(company=company)

        # Trigger AI verification (async)
        try:
            from apps.ai_engine.tasks import verify_emission_submission
            verify_emission_submission.delay(submission.id)
        except Exception as e:
            print("AI task error:", e)

    # -------------------- STATS --------------------

    @action(detail=False, methods=['get'])
    def stats(self, request):
        company = request.user.company
        subs = self.get_queryset()

        approved = subs.filter(status='approved')

        return Response({
            "company": company.name,
            "total_submissions": subs.count(),
            "approved_count": approved.count(),
            "total_credits": sum(s.assigned_credits or 0 for s in approved),
            "balance": company.credit_balance,
            "recent": EmissionSubmissionSerializer(subs[:3], many=True).data
        })


# -------------------- PUBLIC COMPANIES --------------------

class PublicCompanyListView(generics.ListAPIView):
    serializer_class = CompanySerializer
    filter_backends = [DjangoFilterBackend]
    filterset_fields = ['industry', 'country']
    permission_classes = [permissions.IsAuthenticated]

    def get_queryset(self):
        return Company.objects.filter(status='approved').order_by('-id')