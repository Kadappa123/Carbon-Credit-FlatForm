from celery import shared_task
from django.utils import timezone
import logging

logger = logging.getLogger(__name__)


@shared_task(bind=True, max_retries=3)
def verify_emission_submission(self, submission_id):
    """Async task to run AI verification on an emission submission"""
    try:
        from apps.companies.models import EmissionSubmission
        from .engine import CarbonAIVerifier

        submission = EmissionSubmission.objects.get(id=submission_id)
        logger.info(f"AI verification started for submission {submission_id}")

        verifier = CarbonAIVerifier()
        results = verifier.verify_submission(submission)

        # Update submission with AI results
        submission.ai_verified_emissions = results['verified_emissions']
        submission.ai_confidence_score = results['confidence_score']
        submission.ai_fraud_flag = results['fraud_flag']
        submission.ai_notes = '\n'.join(results['notes'])
        submission.ai_verified_at = timezone.now()
        submission.status = EmissionSubmission.AI_VERIFIED
        submission.save()

        logger.info(f"AI verification complete for {submission_id}: confidence={results['confidence_score']}")
        return {
            'submission_id': submission_id,
            'status': 'completed',
            'confidence': results['confidence_score'],
            'fraud_flag': results['fraud_flag'],
        }

    except Exception as exc:
        logger.error(f"AI verification failed for {submission_id}: {exc}")
        raise self.retry(exc=exc, countdown=60)


@shared_task
def reset_daily_trading_limits():
    """Reset daily trading counters — run via Celery Beat at midnight"""
    from apps.companies.models import Company
    from django.utils import timezone

    today = timezone.now().date()
    updated = Company.objects.exclude(last_trading_reset=today).update(
        credits_traded_today=0,
        last_trading_reset=today,
    )
    logger.info(f"Reset daily trading limits for {updated} companies")
    return updated


@shared_task
def recalculate_esg_scores():
    """Periodically recalculate ESG scores for all active companies"""
    from apps.companies.models import Company, EmissionSubmission

    companies = Company.objects.filter(status=Company.APPROVED)
    for company in companies:
        submissions = EmissionSubmission.objects.filter(
            company=company, status=EmissionSubmission.APPROVED
        ).order_by('-created_at')[:4]  # Last 4 approved

        if submissions.exists():
            avg_score = sum(s.assigned_score for s in submissions if s.assigned_score) / submissions.count()
            company.esg_score = round(avg_score, 2)
            company.save(update_fields=['esg_score'])

    logger.info(f"ESG scores recalculated for {companies.count()} companies")
