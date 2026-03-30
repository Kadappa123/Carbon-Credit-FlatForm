from rest_framework import generics, status, permissions, viewsets
from rest_framework.decorators import action
from rest_framework.response import Response
from rest_framework.views import APIView
from django.utils import timezone
from django.db import transaction as db_transaction
import uuid
import logging

from .models import Transaction, CreditListing, RetiredCredit, PurchaseRestriction
from .serializers import (
    TransactionSerializer, CreditListingSerializer,
    PurchaseRequestSerializer, RetiredCreditSerializer, RetireCreditsSerializer,
)
from apps.companies.models import Company
from apps.blockchain_integration.service import BlockchainService

logger = logging.getLogger(__name__)


class MarketplaceView(generics.ListAPIView):
    """Public marketplace — all active credit listings"""
    serializer_class = CreditListingSerializer

    def get_queryset(self):
        return CreditListing.objects.filter(
            status=CreditListing.ACTIVE,
            company__status=Company.APPROVED,
            company__carbon_credit_score__gte=80,
        ).order_by('-company__carbon_credit_score')


class CreateListingView(generics.CreateAPIView):
    """High-score companies create listings"""
    serializer_class = CreditListingSerializer

    def create(self, request, *args, **kwargs):
        company = request.user.company
        if not company.can_sell:
            return Response(
                {'error': 'Your carbon credit score must be ≥80 to sell credits.'},
                status=status.HTTP_403_FORBIDDEN
            )
        credits_to_list = request.data.get('credits_available', 0)
        if int(credits_to_list) > company.credit_balance:
            return Response(
                {'error': f'Insufficient credits. Balance: {company.credit_balance}'},
                status=status.HTTP_400_BAD_REQUEST
            )
        return super().create(request, *args, **kwargs)


class CancelListingView(APIView):
    def delete(self, request, listing_id):
        try:
            listing = CreditListing.objects.get(id=listing_id, company=request.user.company)
        except CreditListing.DoesNotExist:
            return Response({'error': 'Listing not found'}, status=404)
        listing.status = CreditListing.CANCELLED
        listing.save()
        return Response({'message': 'Listing cancelled'})


class PurchaseCreditsView(APIView):
    """Execute a credit purchase with all business rule checks"""

    def post(self, request):
        serializer = PurchaseRequestSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)

        buyer_company = request.user.company
        listing_id = serializer.validated_data['listing_id']
        credits_requested = serializer.validated_data['credits_amount']

        # Validate buyer
        if not buyer_company.can_buy:
            return Response({'error': 'Your company is not eligible to buy credits.'}, status=403)

        # Get listing
        try:
            listing = CreditListing.objects.get(id=listing_id, status=CreditListing.ACTIVE)
        except CreditListing.DoesNotExist:
            return Response({'error': 'Listing not found or no longer active.'}, status=404)

        seller_company = listing.company

        # Cannot buy from yourself
        if seller_company == buyer_company:
            return Response({'error': 'Cannot purchase from yourself.'}, status=400)

        # One-time seller rule
        if PurchaseRestriction.objects.filter(buyer=buyer_company, seller=seller_company).exists():
            return Response(
                {'error': f'You have already purchased from {seller_company.name}. One-time purchase rule applies.'},
                status=400
            )

        # Daily trading limit
        self._reset_daily_limit_if_needed(buyer_company)
        remaining_limit = buyer_company.daily_trading_limit - buyer_company.credits_traded_today
        if credits_requested > remaining_limit:
            return Response(
                {'error': f'Daily trading limit exceeded. You can buy {remaining_limit} more credits today.'},
                status=400
            )

        # Sufficient credits in listing
        if credits_requested > listing.credits_available:
            return Response(
                {'error': f'Only {listing.credits_available} credits available in this listing.'},
                status=400
            )

        # Execute transaction atomically
        try:
            with db_transaction.atomic():
                total_price = credits_requested * float(listing.price_per_credit)

                tx = Transaction.objects.create(
                    seller=seller_company,
                    buyer=buyer_company,
                    credits_amount=credits_requested,
                    price_per_credit=listing.price_per_credit,
                    total_price=total_price,
                    status=Transaction.PROCESSING,
                    initiated_by=request.user,
                )

                # Blockchain execution
                blockchain_service = BlockchainService()
                tx_result = blockchain_service.transfer_credits(
                    from_address=seller_company.wallet_address,
                    to_address=buyer_company.wallet_address,
                    amount=credits_requested,
                    transaction_id=str(tx.id),
                )

                # Update transaction with blockchain data
                tx.blockchain_tx_hash = tx_result.get('tx_hash', '')
                tx.blockchain_block_number = tx_result.get('block_number')
                tx.status = Transaction.COMPLETED
                tx.completed_at = timezone.now()
                tx.save()

                # Update balances
                seller_company.credit_balance -= credits_requested
                seller_company.credits_traded_today += credits_requested
                seller_company.save(update_fields=['credit_balance', 'credits_traded_today'])

                buyer_company.credit_balance += credits_requested
                buyer_company.credits_traded_today += credits_requested
                buyer_company.save(update_fields=['credit_balance', 'credits_traded_today'])

                # Update listing
                listing.credits_available -= credits_requested
                if listing.credits_available == 0:
                    listing.status = CreditListing.SOLD
                listing.save()

                # Record purchase restriction
                PurchaseRestriction.objects.create(buyer=buyer_company, seller=seller_company)

                return Response({
                    'message': 'Purchase successful!',
                    'transaction': TransactionSerializer(tx).data,
                    'blockchain_tx_hash': tx.blockchain_tx_hash,
                }, status=status.HTTP_201_CREATED)

        except Exception as e:
            logger.error(f"Transaction failed: {e}")
            if 'tx' in locals():
                tx.status = Transaction.FAILED
                tx.failed_reason = str(e)
                tx.save()
            return Response({'error': f'Transaction failed: {str(e)}'}, status=500)

    def _reset_daily_limit_if_needed(self, company):
        today = timezone.now().date()
        if company.last_trading_reset != today:
            company.credits_traded_today = 0
            company.last_trading_reset = today
            company.save(update_fields=['credits_traded_today', 'last_trading_reset'])


class TransactionHistoryView(generics.ListAPIView):
    serializer_class = TransactionSerializer

    def get_queryset(self):
        company = self.request.user.company
        return Transaction.objects.filter(
            models_Q := None
        )

    def list(self, request, *args, **kwargs):
        from django.db.models import Q
        company = request.user.company
        txs = Transaction.objects.filter(
            Q(seller=company) | Q(buyer=company)
        ).order_by('-created_at')
        serializer = TransactionSerializer(txs, many=True)
        return Response(serializer.data)


class RetireCreditsView(APIView):
    """Permanently burn/retire credits and generate certificate"""

    def post(self, request):
        serializer = RetireCreditsSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        data = serializer.validated_data

        company = request.user.company
        amount = data['credits_amount']

        if amount > company.credit_balance:
            return Response(
                {'error': f'Insufficient credits. Balance: {company.credit_balance}'},
                status=400
            )

        # Blockchain burn
        blockchain_service = BlockchainService()
        tx_result = blockchain_service.retire_credits(
            address=company.wallet_address,
            amount=amount,
        )

        # Generate certificate
        cert_number = f"CERT-{timezone.now().strftime('%Y%m%d')}-{str(uuid.uuid4())[:8].upper()}"

        retired = RetiredCredit.objects.create(
            company=company,
            credits_retired=amount,
            retirement_reason=data['retirement_reason'],
            offset_description=data.get('offset_description', ''),
            certificate_number=cert_number,
            blockchain_tx_hash=tx_result.get('tx_hash', ''),
        )

        company.credit_balance -= amount
        company.save(update_fields=['credit_balance'])

        return Response({
            'message': f'{amount} credits retired successfully.',
            'certificate_number': cert_number,
            'retired_credit': RetiredCreditSerializer(retired).data,
        }, status=status.HTTP_201_CREATED)


class RetirementHistoryView(generics.ListAPIView):
    serializer_class = RetiredCreditSerializer

    def get_queryset(self):
        return RetiredCredit.objects.filter(
            company=self.request.user.company
        ).order_by('-retired_at')
