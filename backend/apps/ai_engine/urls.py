from django.urls import path
from . import views

urlpatterns = [
    path('verify/<uuid:submission_id>/', views.RerunAIVerificationView.as_view(), name='rerun-verification'),
    path('stats/', views.AIEngineStatsView.as_view(), name='ai-stats'),
]
