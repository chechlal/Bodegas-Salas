from rest_framework.routers import DefaultRouter
from django.urls import path
from .views import ProductViewSet, BrandViewSet, CategoryViewSet, ProviderViewSet, ProductImageViewSet, ProductHistoryViewSet, StockMovementViewSet, ContactEmailView

router = DefaultRouter()
router.register(r'products', ProductViewSet)
router.register(r'brands', BrandViewSet)
router.register(r'categories', CategoryViewSet)
router.register(r'providers', ProviderViewSet)
router.register(r'product-images', ProductImageViewSet)
router.register(r'product-history', ProductHistoryViewSet, basename='product-history')
router.register(r'stock-movements', StockMovementViewSet)

urlpatterns = router.urls + [
    path('mensajeria-general/', ContactEmailView.as_view(), name='mensajeria-general'),
]