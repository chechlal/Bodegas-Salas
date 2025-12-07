from django.contrib import admin
from django.urls import path, include, re_path
from django.conf import settings
from django.conf.urls.static import static
from rest_framework_simplejwt.views import (
    TokenObtainPairView,
    TokenRefreshView,
)
from django.views.static import serve
from companies.views import MyTokenObtainPairView

urlpatterns = [
    # 1. Panel de Admin de Django
    path('admin/', admin.site.urls),

    # 2. Rutas de tu API original (Productos, Marcas, Categorias)
    path('api/', include('api.urls')),

    # 3. Rutas del Login Nuevo (Seguridad JWT)
    path('api/token/', MyTokenObtainPairView.as_view(), name='token_obtain_pair'),
    path('api/token/refresh/', TokenRefreshView.as_view(), name='token_refresh'),

    re_path(r'^media/(?P<path>.*)$', serve, {
        'document_root': settings.MEDIA_ROOT,
    }),

] + static(settings.MEDIA_URL, document_root=settings.MEDIA_ROOT)