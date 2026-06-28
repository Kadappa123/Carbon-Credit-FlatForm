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
        serializer.save()


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
        serializer.save()

    @action(detail=False, methods=['get'], url_path='dashboard')
    def dashboard(self, request):
        company = request.user.company
        subs = self.get_queryset()
        approved = subs.filter(status='approved')

        return Response({
            'company': CompanySerializer(company).data,
            'total_submissions': subs.count(),
            'approved_submissions': approved.count(),
            'recent_submissions': EmissionSubmissionSerializer(subs[:5], many=True).data,
        })


# -------------------- PUBLIC COMPANIES --------------------

class PublicCompanyListView(generics.ListAPIView):
    serializer_class = CompanySerializer
    filter_backends = [DjangoFilterBackend]
    filterset_fields = ['industry', 'country']
    permission_classes = [permissions.IsAuthenticated]

    def get_queryset(self):
        return Company.objects.filter(status='approved').order_by('-id')