from rest_framework import serializers
from .models import Transaction, CreditListing, RetiredCredit


class CreditListingSerializer(serializers.ModelSerializer):
    company_name = serializers.CharField(source='company.name', read_only=True)
    company_score = serializers.FloatField(source='company.carbon_credit_score', read_only=True)
    company_industry = serializers.CharField(source='company.industry', read_only=True)
    company_country = serializers.CharField(source='company.country', read_only=True)

    class Meta:
        model = CreditListing
        fields = [
            'id', 'company', 'company_name', 'company_score',
            'company_industry', 'company_country',
            'credits_available', 'price_per_credit', 'status',
            'description', 'expires_at', 'created_at',
        ]
        read_only_fields = ['id', 'company', 'status', 'created_at']

    def create(self, validated_data):
        company = self.context['request'].user.company
        return CreditListing.objects.create(company=company, **validated_data)


class TransactionSerializer(serializers.ModelSerializer):
    seller_name = serializers.CharField(source='seller.name', read_only=True)
    buyer_name = serializers.CharField(source='buyer.name', read_only=True)
    status_display = serializers.CharField(source='get_status_display', read_only=True)

    class Meta:
        model = Transaction
        fields = [
            'id', 'seller', 'seller_name', 'buyer', 'buyer_name',
            'credits_amount', 'price_per_credit', 'total_price',
            'status', 'status_display',
            'blockchain_tx_hash', 'blockchain_block_number',
            'notes', 'created_at', 'completed_at',
        ]
        read_only_fields = [
            'id', 'seller', 'buyer', 'status',
            'blockchain_tx_hash', 'blockchain_block_number',
            'total_price', 'created_at', 'completed_at',
        ]


class PurchaseRequestSerializer(serializers.Serializer):
    listing_id = serializers.UUIDField()
    credits_amount = serializers.IntegerField(min_value=1)


class RetiredCreditSerializer(serializers.ModelSerializer):
    company_name = serializers.CharField(source='company.name', read_only=True)

    class Meta:
        model = RetiredCredit
        fields = [
            'id', 'company', 'company_name', 'credits_retired',
            'retirement_reason', 'certificate_number',
            'blockchain_tx_hash', 'offset_description', 'retired_at',
        ]
        read_only_fields = ['id', 'company', 'certificate_number', 'blockchain_tx_hash', 'retired_at']


class RetireCreditsSerializer(serializers.Serializer):
    credits_amount = serializers.IntegerField(min_value=1)
    retirement_reason = serializers.CharField()
    offset_description = serializers.CharField(required=False, allow_blank=True)
