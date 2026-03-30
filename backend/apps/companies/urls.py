from django.urls import path, include
from rest_framework.routers import DefaultRouter
from . import views

router = DefaultRouter()
router.register(r'emissions', views.EmissionSubmissionViewSet, basename='emissions')

urlpatterns = [
    path('', include(router.urls)),
    path('profile/', views.CompanyProfileView.as_view(), name='company-profile'),
    path('register/', views.CompanyRegistrationView.as_view(), name='company-register'),
    path('marketplace/', views.PublicCompanyListView.as_view(), name='company-marketplace'),
]
