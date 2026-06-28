from rest_framework import generics, status, permissions
from rest_framework.response import Response
from rest_framework.views import APIView
from django.utils import timezone
from django.db.models import Sum
from apps.companies.models import Company, EmissionSubmission
from apps.companies.serializers import CompanySerializer, EmissionSubmissionSerializer
from apps.trading.models import Transaction
from apps.authentication.models import User
from .serializers import GovernmentReviewSerializer, CompanyApprovalSerializer, EmissionLimitSerializer


class IsGovernmentUser(permissions.BasePermission):
    def has_permission(self, request, view):
        return request.user.role == User.GOVERNMENT


class GovernmentDashboardView(APIView):
    permission_classes = [permissions.IsAuthenticated, IsGovernmentUser]

    def get(self, request):
        total_emissions = EmissionSubmission.objects.filter(
            status='approved'
        ).aggregate(total=Sum('ai_verified_emissions'))['total'] or 0
        return Response({
            'summary': {
                'total_companies': Company.objects.count(),
                'pending_kyb': Company.objects.filter(status=Company.PENDING).count(),
                'approved_companies': Company.objects.filter(status=Company.APPROVED).count(),
                'total_submissions': EmissionSubmission.objects.count(),
                'pending_review': EmissionSubmission.objects.filter(status=EmissionSubmission.AI_VERIFIED).count(),
                'fraud_alerts': EmissionSubmission.objects.filter(ai_fraud_flag=True).count(),
                'total_transactions': Transaction.objects.count(),
                'total_emissions_tracked': round(total_emissions, 2),
            },
            'recent_submissions': EmissionSubmissionSerializer(
                EmissionSubmission.objects.filter(
                    status=EmissionSubmission.AI_VERIFIED
                ).order_by('-created_at')[:10], many=True).data,
            'pending_companies': CompanySerializer(
                Company.objects.filter(status=Company.PENDING).order_by('-created_at')[:10],
                many=True).data,
        })


class GovernmentCompaniesListView(generics.ListAPIView):
    permission_classes = [permissions.IsAuthenticated, IsGovernmentUser]
    serializer_class = CompanySerializer

    def get_queryset(self):
        qs = Company.objects.all().order_by('-created_at')
        status = self.request.query_params.get('status')
        search = self.request.query_params.get('search', '').strip()
        if status:
            qs = qs.filter(status=status)
        if search:
            qs = qs.filter(name__icontains=search)
        return qs


class PendingSubmissionsView(generics.ListAPIView):
    permission_classes = [permissions.IsAuthenticated, IsGovernmentUser]
    serializer_class = EmissionSubmissionSerializer

    def get_queryset(self):
        status_filter = self.request.query_params.get('status', EmissionSubmission.AI_VERIFIED)
        return EmissionSubmission.objects.filter(status=status_filter).order_by('-created_at')


class ReviewSubmissionView(APIView):
    permission_classes = [permissions.IsAuthenticated, IsGovernmentUser]

    def post(self, request, submission_id):
        try:
            submission = EmissionSubmission.objects.get(id=submission_id)
        except EmissionSubmission.DoesNotExist:
            return Response({'error': 'Submission not found'}, status=404)
        serializer = GovernmentReviewSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        data = serializer.validated_data
        if data['action'] == 'approve':
            credits = data.get('assigned_credits', 0)
            score = data.get('assigned_score', 50)
            submission.status = EmissionSubmission.APPROVED
            submission.assigned_credits = credits
            submission.assigned_score = score
            submission.government_notes = data.get('notes', '')
            submission.reviewed_by = request.user
            submission.reviewed_at = timezone.now()
            submission.save()
            company = submission.company
            company.credit_balance += credits
            company.carbon_credit_score = score
            company.save(update_fields=['credit_balance', 'carbon_credit_score'])
            try:
                from apps.blockchain_integration.service import BlockchainService
                service = BlockchainService()
                deployer = service.w3.eth.accounts[0]
                if company.wallet_address:
                    try:
                        service.contract.functions.approveCompany(
                            service.w3.to_checksum_address(company.wallet_address)
                        ).transact({'from': deployer})
                    except Exception:
                        pass
                    if credits > 0:
                        service.mint_credits(company.wallet_address, credits, str(submission.id))
            except Exception:
                pass
            return Response({'message': f'Approved. {credits} credits assigned.', 'submission_id': str(submission_id)})
        elif data['action'] == 'reject':
            submission.status = EmissionSubmission.REJECTED
            submission.government_notes = data.get('notes', 'Rejected.')
            submission.reviewed_by = request.user
            submission.reviewed_at = timezone.now()
            submission.save()
            return Response({'message': 'Submission rejected.', 'submission_id': str(submission_id)})
        return Response({'error': 'Invalid action'}, status=400)


class CompanyKYBReviewView(APIView):
    permission_classes = [permissions.IsAuthenticated, IsGovernmentUser]

    def post(self, request, company_id):
        try:
            company = Company.objects.get(id=company_id)
        except Company.DoesNotExist:
            return Response({'error': 'Company not found'}, status=404)
        
        serializer = CompanyApprovalSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        data = serializer.validated_data
        
        company.status = data['status']
        if data['status'] == Company.APPROVED:
            company.permitted_emission_limit = data.get('emission_limit', 1000)
            company.daily_trading_limit = data.get('daily_trading_limit', 50)
            company.user.is_kyc_verified = True
            company.user.save()
            
            # 🚀 COMPLETE MARKETPLACE SETUP (Wallet + Blockchain + Credits)
            try:
                from apps.blockchain_integration.service import BlockchainService
                service = BlockchainService()
                
                # 1. Create wallet if missing
                if not company.wallet_address:
                    wallet = service.create_wallet()
                    company.wallet_address = wallet['address']
                    company.save(update_fields=['wallet_address'])
                    print(f"💼 Created wallet for {company.name}: {company.wallet_address}")
                
                # 2. Approve company on blockchain
                deployer = service.w3.eth.accounts[0]
                service.contract.functions.approveCompany(
                    service.w3.to_checksum_address(company.wallet_address)
                ).transact({'from': deployer})
                
                # 3. 🎁 Mint 50 starter credits
                service.mint_credits(company.wallet_address, 50, f"welcome-{company.id}")
                
                # 4. Update company balances
                company.credit_balance = 50
                company.carbon_credit_score = 85
                company.save()
                
                print(f"✅ FULL MARKETPLACE CREATED: {company.name}")
                
            except Exception as e:
                print(f"⚠️  Marketplace partial fail (company still approved): {e}")
                # Company approved even if blockchain has issues
        
        company.save()
        return Response({
            'message': f'Company {data["status"]}! Marketplace: {"✅ ACTIVE (50 credits)" if company.wallet_address else "⚠️ PENDING"}',
            'company_id': str(company_id),
            'wallet_address': company.wallet_address,
            'credit_balance': getattr(company, 'credit_balance', 0),
            'status': company.status
        })


class SetEmissionLimitView(APIView):
    permission_classes = [permissions.IsAuthenticated, IsGovernmentUser]

    def post(self, request, company_id):
        try:
            company = Company.objects.get(id=company_id)
        except Company.DoesNotExist:
            return Response({'error': 'Company not found'}, status=404)
        serializer = EmissionLimitSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        company.permitted_emission_limit = serializer.validated_data['emission_limit']
        company.daily_trading_limit = serializer.validated_data.get('daily_trading_limit', 50)
        company.save()
        return Response({'message': 'Emission limit updated successfully'})


class FraudAlertsView(generics.ListAPIView):
    permission_classes = [permissions.IsAuthenticated, IsGovernmentUser]
    serializer_class = EmissionSubmissionSerializer

    def get_queryset(self):
        return EmissionSubmission.objects.filter(ai_fraud_flag=True).order_by('-created_at')


# 🚀 NEW: Bulk marketplace fixer for existing companies
class FixMarketplacesView(APIView):
    permission_classes = [permissions.IsAuthenticated, IsGovernmentUser]

    def post(self, request):
        """Fix all approved companies without wallets"""
        from apps.blockchain_integration.service import BlockchainService
        service = BlockchainService()
        deployer = service.w3.eth.accounts[0]
        fixed = 0
        
        for company in Company.objects.filter(status='approved', wallet_address__isnull=True):
            try:
                wallet = service.create_wallet()
                company.wallet_address = wallet['address']
                company.credit_balance = 50
                company.save()
                
                service.contract.functions.approveCompany(
                    service.w3.to_checksum_address(company.wallet_address)
                ).transact({'from': deployer})
                
                service.mint_credits(company.wallet_address, 50, f"fix-{company.id}")
                fixed += 1
                print(f"✅ Fixed: {company.name}")
            except Exception as e:
                print(f"❌ Failed: {company.name} - {e}")
        
        return Response({'fixed': fixed, 'message': f'Fixed {fixed} companies!'})