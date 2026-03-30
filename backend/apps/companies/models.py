from django.db import models
from django.conf import settings
import uuid


class Company(models.Model):
    PENDING = 'pending'
    APPROVED = 'approved'
    REJECTED = 'rejected'
    SUSPENDED = 'suspended'

    STATUS_CHOICES = [
        (PENDING, 'Pending KYB'),
        (APPROVED, 'Approved'),
        (REJECTED, 'Rejected'),
        (SUSPENDED, 'Suspended'),
    ]

    INDUSTRY_CHOICES = [
        ('manufacturing', 'Manufacturing'),
        ('energy', 'Energy'),
        ('transport', 'Transport'),
        ('agriculture', 'Agriculture'),
        ('construction', 'Construction'),
        ('chemical', 'Chemical'),
        ('mining', 'Mining'),
        ('tech', 'Technology'),
        ('other', 'Other'),
    ]

    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    user = models.OneToOneField(settings.AUTH_USER_MODEL, on_delete=models.CASCADE, related_name='company')
    name = models.CharField(max_length=255)
    registration_number = models.CharField(max_length=100, unique=True)
    industry = models.CharField(max_length=50, choices=INDUSTRY_CHOICES)
    country = models.CharField(max_length=100)
    address = models.TextField()
    website = models.URLField(blank=True)
    description = models.TextField(blank=True)
    status = models.CharField(max_length=20, choices=STATUS_CHOICES, default=PENDING)

    # Blockchain wallet
    wallet_address = models.CharField(max_length=42, blank=True)

    # Credit info
    credit_balance = models.IntegerField(default=0)
    carbon_credit_score = models.FloatField(default=0.0)
    permitted_emission_limit = models.FloatField(default=0.0)  # tons CO2/year
    daily_trading_limit = models.IntegerField(default=settings.MAX_DAILY_TRADING_LIMIT)
    credits_traded_today = models.IntegerField(default=0)
    last_trading_reset = models.DateField(null=True, blank=True)

    # ESG
    esg_score = models.FloatField(default=0.0)
    sustainability_initiatives = models.TextField(blank=True)

    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        db_table = 'companies'
        verbose_name_plural = 'Companies'

    def __str__(self):
        return self.name

    @property
    def score_category(self):
        score = self.carbon_credit_score
        if score >= 80:
            return 'excellent'
        elif score >= 50:
            return 'balanced'
        elif score >= 20:
            return 'needs_improvement'
        else:
            return 'critical'

    @property
    def can_sell(self):
        return self.carbon_credit_score >= 80 and self.status == self.APPROVED

    @property
    def can_buy(self):
        return self.status == self.APPROVED


class EmissionSubmission(models.Model):
    PENDING = 'pending'
    AI_VERIFIED = 'ai_verified'
    GOVERNMENT_REVIEWED = 'government_reviewed'
    APPROVED = 'approved'
    REJECTED = 'rejected'

    STATUS_CHOICES = [
        (PENDING, 'Pending'),
        (AI_VERIFIED, 'AI Verified'),
        (GOVERNMENT_REVIEWED, 'Government Reviewed'),
        (APPROVED, 'Approved'),
        (REJECTED, 'Rejected'),
    ]

    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    company = models.ForeignKey(Company, on_delete=models.CASCADE, related_name='emission_submissions')
    submission_year = models.IntegerField()
    submission_period = models.CharField(max_length=20)  # e.g., "Q1-2024", "Annual-2024"

    # Emission data
    total_co2_emissions = models.FloatField()  # tons
    energy_consumption = models.FloatField(default=0)  # MWh
    fuel_consumption = models.FloatField(default=0)  # liters
    production_volume = models.FloatField(default=0)
    renewable_energy_percentage = models.FloatField(default=0)
    waste_generated = models.FloatField(default=0)  # tons
    water_usage = models.FloatField(default=0)  # cubic meters
    description = models.TextField(blank=True)

    # AI verification
    ai_verified_emissions = models.FloatField(null=True, blank=True)
    ai_confidence_score = models.FloatField(null=True, blank=True)
    ai_fraud_flag = models.BooleanField(default=False)
    ai_notes = models.TextField(blank=True)
    ai_verified_at = models.DateTimeField(null=True, blank=True)

    # Government review
    government_notes = models.TextField(blank=True)
    reviewed_by = models.ForeignKey(
        settings.AUTH_USER_MODEL, on_delete=models.SET_NULL,
        null=True, blank=True, related_name='reviewed_submissions'
    )
    reviewed_at = models.DateTimeField(null=True, blank=True)
    assigned_credits = models.IntegerField(null=True, blank=True)
    assigned_score = models.FloatField(null=True, blank=True)

    status = models.CharField(max_length=25, choices=STATUS_CHOICES, default=PENDING)
    document = models.FileField(upload_to='documents/emissions/', null=True, blank=True)
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        db_table = 'emission_submissions'

    def __str__(self):
        return f"{self.company.name} - {self.submission_period}"
