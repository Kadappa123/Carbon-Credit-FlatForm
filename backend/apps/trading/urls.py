from django.urls import path
from . import views

urlpatterns = [
    path('marketplace/', views.MarketplaceView.as_view(), name='marketplace'),
    path('listings/create/', views.CreateListingView.as_view(), name='create-listing'),
    path('listings/<uuid:listing_id>/cancel/', views.CancelListingView.as_view(), name='cancel-listing'),
    path('purchase/', views.PurchaseCreditsView.as_view(), name='purchase-credits'),
    path('history/', views.TransactionHistoryView.as_view(), name='transaction-history'),
    path('retire/', views.RetireCreditsView.as_view(), name='retire-credits'),
    path('retirements/', views.RetirementHistoryView.as_view(), name='retirement-history'),
]
