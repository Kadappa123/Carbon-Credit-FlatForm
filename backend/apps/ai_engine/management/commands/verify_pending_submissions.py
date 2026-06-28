from django.core.management.base import BaseCommand

from apps.companies.models import EmissionSubmission
from apps.ai_engine.tasks import verify_emission_submission


class Command(BaseCommand):
    help = 'Run AI verification on all pending emission submissions'

    def handle(self, *args, **options):
        pending = EmissionSubmission.objects.filter(status=EmissionSubmission.PENDING)
        count = pending.count()
        if count == 0:
            self.stdout.write(self.style.SUCCESS('No pending submissions to verify.'))
            return

        verified = 0
        for submission in pending:
            try:
                verify_emission_submission(submission.id)
                verified += 1
                self.stdout.write(f'Verified: {submission.company.name} - {submission.submission_period}')
            except Exception as exc:
                self.stderr.write(f'Failed {submission.id}: {exc}')

        self.stdout.write(self.style.SUCCESS(f'Processed {verified}/{count} pending submissions.'))
