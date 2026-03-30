from django.contrib import admin
from django.urls import path, include
from django.conf import settings
from django.conf.urls.static import static
from rest_framework import permissions
from drf_yasg.views import get_schema_view
from drf_yasg import openapi

schema_view = get_schema_view(
    openapi.Info(
        title="Carbon Credit Platform API",
        default_version='v1',
        description="AI-Based Carbon Credit Trading Platform",
        contact=openapi.Contact(email="admin@carbonplatform.gov"),
        license=openapi.License(name="Government License"),
    ),
    public=True,
    permission_classes=(permissions.AllowAny,),
)

urlpatterns = [
    path('admin/', admin.site.urls),
    path('api/auth/', include('apps.authentication.urls')),
    path('api/companies/', include('apps.companies.urls')),
    path('api/credits/', include('apps.credits.urls')),
    path('api/trading/', include('apps.trading.urls')),
    path('api/ai/', include('apps.ai_engine.urls')),
    path('api/government/', include('apps.government.urls')),
    path('api/blockchain/', include('apps.blockchain_integration.urls')),
    # Swagger docs
    path('swagger/', schema_view.with_ui('swagger', cache_timeout=0), name='schema-swagger-ui'),
    path('redoc/', schema_view.with_ui('redoc', cache_timeout=0), name='schema-redoc'),
] + static(settings.MEDIA_URL, document_root=settings.MEDIA_ROOT)
