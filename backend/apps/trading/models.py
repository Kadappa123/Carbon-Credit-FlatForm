from django.db import models
from django.conf import settings
import uuid


class Transaction(models.Model):
    PENDING = 'pending'
    PROCESSING = 'processing'
    COMPLETED = 'completed'
    FAILED = 'failed'
    CANCELLED = 'cancelled'

    STATUS_CHOICES = [
        (PENDING, 'Pending'),
        (PROCESSING, 'Processing'),
        (COMPLETED, 'Completed'),
        (FAILED, 'Failed'),
        (CANCELLED, 'Cancelled'),
    ]

    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    seller = models.ForeignKey(
        'companies.Company', on_delete=models.PROTECT,
        related_name='sell_transactions'
    )
    buyer = models.ForeignKey(
        'companies.Company', on_delete=models.PROTECT,
        related_name='buy_transactions'
    )
    credits_amount = models.IntegerField()
    price_per_credit = models.DecimalField(max_digits=10, decimal_places=2, default=0)
    total_price = models.DecimalField(max_digits=14, decimal_places=2, default=0)
    status = models.CharField(max_length=20, choices=STATUS_CHOICES, default=PENDING)

    # Blockchain data
    blockchain_tx_hash = models.CharField(max_length=66, blank=True)
    blockchain_block_number = models.IntegerField(null=True, blank=True)
    token_id = models.CharField(max_length=100, blank=True)

    # Metadata
    notes = models.TextField(blank=True)
    failed_reason = models.TextField(blank=True)
    initiated_by = models.ForeignKey(
        settings.AUTH_USER_MODEL, on_delete=models.SET_NULL,
        null=True, related_name='initiated_transactions'
    )
    created_at = models.DateTimeField(auto_now_add=True)
    completed_at = models.DateTimeField(null=True, blank=True)

    class Meta:
        db_table = 'transactions'

    def __str__(self):
        return f"TX {str(self.id)[:8]} | {self.seller.name} → {self.buyer.name} | {self.credits_amount} credits"


class CreditListing(models.Model):
    ACTIVE = 'active'
    SOLD = 'sold'
    CANCELLED = 'cancelled'
    EXPIRED = 'expired'

    STATUS_CHOICES = [
        (ACTIVE, 'Active'),
        (SOLD, 'Sold'),
        (CANCELLED, 'Cancelled'),
        (EXPIRED, 'Expired'),
    ]

    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    company = models.ForeignKey(
        'companies.Company', on_delete=models.CASCADE,
        related_name='listings'
    )
    credits_available = models.IntegerField()
    price_per_credit = models.DecimalField(max_digits=10, decimal_places=2)
    status = models.CharField(max_length=20, choices=STATUS_CHOICES, default=ACTIVE)
    description = models.TextField(blank=True)
    expires_at = models.DateTimeField(null=True, blank=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        db_table = 'credit_listings'

    def __str__(self):
        return f"{self.company.name} - {self.credits_available} credits @ {self.price_per_credit}"


class RetiredCredit(models.Model):
    """Burned/retired credits — permanently removed from circulation"""
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    company = models.ForeignKey('companies.Company', on_delete=models.PROTECT, related_name='retired_credits')
    credits_retired = models.IntegerField()
    retirement_reason = models.TextField(blank=True)
    certificate_number = models.CharField(max_length=100, unique=True)
    blockchain_tx_hash = models.CharField(max_length=66, blank=True)
    offset_description = models.TextField(blank=True)
    retired_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        db_table = 'retired_credits'

    def __str__(self):
        return f"Certificate {self.certificate_number} — {self.company.name} retired {self.credits_retired}"


class PurchaseRestriction(models.Model):
    """Enforce one-time buyer-seller rule"""
    buyer = models.ForeignKey('companies.Company', on_delete=models.CASCADE, related_name='purchase_restrictions')
    seller = models.ForeignKey('companies.Company', on_delete=models.CASCADE, related_name='sale_restrictions')
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        db_table = 'purchase_restrictions'
        unique_together = ('buyer', 'seller')

    def __str__(self):
        return f"{self.buyer.name} already purchased from {self.seller.name}"
