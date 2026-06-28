from rest_framework import serializers
from .models import Company, EmissionSubmission


# -------------------- COMPANY --------------------

class CompanySerializer(serializers.ModelSerializer):
    score_category = serializers.ReadOnlyField()
    can_sell = serializers.ReadOnlyField()
    can_buy = serializers.ReadOnlyField()
    user_email = serializers.EmailField(source='user.email', read_only=True)

    class Meta:
        model = Company
        fields = [
            'id', 'name', 'registration_number', 'industry', 'country', 'address',
            'website', 'description', 'status', 'wallet_address',
            'credit_balance', 'carbon_credit_score', 'permitted_emission_limit',
            'daily_trading_limit', 'credits_traded_today', 'esg_score',
            'score_category', 'can_sell', 'can_buy', 'user_email', 'created_at',
        ]
        read_only_fields = [
            'id', 'status', 'wallet_address', 'credit_balance',
            'carbon_credit_score', 'permitted_emission_limit',
            'daily_trading_limit', 'credits_traded_today',
            'esg_score', 'created_at',
        ]


class CompanyRegistrationSerializer(serializers.ModelSerializer):
    class Meta:
        model = Company
        fields = [
            'name', 'registration_number', 'industry', 'country',
            'address', 'website', 'description', 'sustainability_initiatives',
        ]

    def create(self, validated_data):
        user = self.context['request'].user
        return Company.objects.create(user=user, **validated_data)


# -------------------- EMISSION (READ) --------------------

class EmissionSubmissionSerializer(serializers.ModelSerializer):
    company_name = serializers.CharField(source='company.name', read_only=True)
    status_display = serializers.CharField(source='get_status_display', read_only=True)

    class Meta:
        model = EmissionSubmission
        fields = [
            'id', 'company_name',  # removed direct 'company' exposure
            'submission_year', 'submission_period',
            'total_co2_emissions', 'energy_consumption', 'fuel_consumption',
            'production_volume', 'renewable_energy_percentage',
            'waste_generated', 'water_usage', 'description', 'document',

            # AI fields
            'ai_verified_emissions', 'ai_confidence_score',
            'ai_fraud_flag', 'ai_notes', 'ai_verified_at',

            # Government review
            'government_notes', 'reviewed_by', 'reviewed_at',

            # Final scoring
            'assigned_credits', 'assigned_score',

            'status', 'status_display', 'created_at',
        ]

        read_only_fields = [
            'id',
            'ai_verified_emissions', 'ai_confidence_score',
            'ai_fraud_flag', 'ai_notes', 'ai_verified_at',
            'government_notes', 'reviewed_by', 'reviewed_at',
            'assigned_credits', 'assigned_score',
            'status', 'created_at',
        ]


# -------------------- EMISSION (CREATE) --------------------

class EmissionSubmissionCreateSerializer(serializers.ModelSerializer):
    class Meta:
        model = EmissionSubmission
        fields = [
            'submission_year', 'submission_period',
            'total_co2_emissions', 'energy_consumption',
            'fuel_consumption', 'production_volume',
            'renewable_energy_percentage', 'waste_generated',
            'water_usage', 'description', 'document',
        ]

    # ✅ VALIDATIONS (important for your domain)
    def validate_total_co2_emissions(self, value):
        if value < 0:
            raise serializers.ValidationError("Emissions cannot be negative.")
        return value

    def validate_renewable_energy_percentage(self, value):
        if not (0 <= value <= 100):
            raise serializers.ValidationError("Must be between 0 and 100.")
        return value

    def create(self, validated_data):
        user = self.context['request'].user

        try:
            company = user.company
        except Exception:
            raise serializers.ValidationError("User is not associated with any company.")

        submission = EmissionSubmission.objects.create(
            company=company,
            **validated_data
        )

        from django.conf import settings
        from apps.ai_engine.tasks import verify_emission_submission

        if getattr(settings, 'CELERY_TASK_ALWAYS_EAGER', False):
            verify_emission_submission(submission.id)
        else:
            verify_emission_submission.delay(submission.id)

        return submission