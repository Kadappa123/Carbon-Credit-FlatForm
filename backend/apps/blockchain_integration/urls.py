from django.urls import path
from . import views

urlpatterns = [
    path('status/', views.BlockchainStatusView.as_view(), name='blockchain-status'),
    path('wallet/create/', views.CreateWalletView.as_view(), name='create-wallet'),
    path('wallet/balance/', views.OnChainBalanceView.as_view(), name='wallet-balance'),
]
