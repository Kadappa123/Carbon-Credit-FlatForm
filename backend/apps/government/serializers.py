from rest_framework import serializers


class GovernmentReviewSerializer(serializers.Serializer):
    action = serializers.ChoiceField(choices=['approve', 'reject'])
    assigned_credits = serializers.IntegerField(min_value=0, required=False)
    assigned_score = serializers.FloatField(min_value=0, max_value=100, required=False)
    notes = serializers.CharField(required=False, allow_blank=True)


class CompanyApprovalSerializer(serializers.Serializer):
    status = serializers.ChoiceField(choices=['approved', 'rejected', 'suspended'])
    emission_limit = serializers.FloatField(min_value=0, required=False)
    notes = serializers.CharField(required=False, allow_blank=True)


class EmissionLimitSerializer(serializers.Serializer):
    emission_limit = serializers.FloatField(min_value=0)
    daily_trading_limit = serializers.IntegerField(min_value=1, max_value=500, required=False)
