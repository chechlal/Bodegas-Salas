from rest_framework.routers import DefaultRouter
from .views import ProductViewSet, BrandViewSet, CategoryViewSet, ProviderViewSet, ProductImageViewSet, ProductHistoryViewSet, StockMovementViewSet

router = DefaultRouter()
router.register(r'products', ProductViewSet)
router.register(r'brands', BrandViewSet)
router.register(r'categories', CategoryViewSet)
router.register(r'providers', ProviderViewSet)
router.register(r'product-images', ProductImageViewSet)
router.register(r'product-history', ProductHistoryViewSet, basename='product-history')
router.register(r'stock-movements', StockMovementViewSet)

urlpatterns = router.urls