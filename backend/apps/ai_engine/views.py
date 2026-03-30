from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework import permissions
from apps.companies.models import EmissionSubmission
from apps.authentication.models import User
from .engine import CarbonAIVerifier


class IsGovernmentUser(permissions.BasePermission):
    def has_permission(self, request, view):
        return request.user.role == User.GOVERNMENT


class RerunAIVerificationView(APIView):
    permission_classes = [permissions.IsAuthenticated, IsGovernmentUser]

    def post(self, request, submission_id):
        try:
            submission = EmissionSubmission.objects.get(id=submission_id)
        except EmissionSubmission.DoesNotExist:
            return Response({'error': 'Submission not found'}, status=404)

        from .tasks import verify_emission_submission
        verify_emission_submission.delay(str(submission_id))

        return Response({'message': 'AI verification re-triggered', 'submission_id': submission_id})


class AIEngineStatsView(APIView):
    permission_classes = [permissions.IsAuthenticated, IsGovernmentUser]

    def get(self, request):
        total = EmissionSubmission.objects.count()
        verified = EmissionSubmission.objects.exclude(ai_verified_at=None).count()
        flagged = EmissionSubmission.objects.filter(ai_fraud_flag=True).count()
        avg_confidence = EmissionSubmission.objects.exclude(
            ai_confidence_score=None
        ).values_list('ai_confidence_score', flat=True)

        return Response({
            'total_submissions': total,
            'ai_verified': verified,
            'fraud_flagged': flagged,
            'avg_confidence_score': round(sum(avg_confidence) / max(len(avg_confidence), 1), 4),
        })
