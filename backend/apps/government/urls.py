from django.urls import path
from . import views

urlpatterns = [
    path('dashboard/', views.GovernmentDashboardView.as_view(), name='gov-dashboard'),
    path('companies/', views.GovernmentCompaniesListView.as_view(), name='gov-companies'),
    path('submissions/', views.PendingSubmissionsView.as_view(), name='gov-submissions'),
    path('submissions/<uuid:submission_id>/review/', views.ReviewSubmissionView.as_view(), name='gov-review'),
    path('companies/<uuid:company_id>/kyb/', views.CompanyKYBReviewView.as_view(), name='gov-kyb'),
    path('companies/<uuid:company_id>/emission-limit/', views.SetEmissionLimitView.as_view(), name='gov-emission-limit'),
    path('fraud-alerts/', views.FraudAlertsView.as_view(), name='gov-fraud-alerts'),
]
