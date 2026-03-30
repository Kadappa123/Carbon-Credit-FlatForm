from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework import permissions
from .service import BlockchainService
from apps.companies.models import Company


class BlockchainStatusView(APIView):
    def get(self, request):
        service = BlockchainService()
        return Response({
            'connected': service.is_connected(),
            'ganache_url': __import__('django.conf', fromlist=['settings']).settings.GANACHE_URL,
            'contract_deployed': bool(__import__('django.conf', fromlist=['settings']).settings.CONTRACT_ADDRESS),
        })


class CreateWalletView(APIView):
    def post(self, request):
        company = request.user.company
        if company.wallet_address:
            return Response({'error': 'Wallet already exists', 'address': company.wallet_address})
        service = BlockchainService()
        wallet = service.create_wallet()
        company.wallet_address = wallet['address']
        company.save(update_fields=['wallet_address'])
        return Response({
            'message': 'Wallet created. SAVE your private key securely!',
            'address': wallet['address'],
            'private_key': wallet['private_key'],
        })


class OnChainBalanceView(APIView):
    def get(self, request):
        company = request.user.company
        service = BlockchainService()
        balance = service.get_balance(company.wallet_address)
        return Response({
            'wallet_address': company.wallet_address,
            'on_chain_balance': balance,
            'db_balance': company.credit_balance,
        })
