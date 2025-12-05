from rest_framework import viewsets, filters
from rest_framework.pagination import PageNumberPagination
from django_filters.rest_framework import DjangoFilterBackend # type: ignore
from .models import Product, Brand, Category, Provider, ProductImage
from .serializers import ProductSerializer, BrandSerializer, CategorySerializer, ProviderSerializer, ProductImageSerializer, HistoricalProductSerializer
from rest_framework.permissions import IsAdminUser
from rest_framework.permissions import IsAuthenticated
from companies.permissions import IsAdminOrReadOnly, IsSellerUser

class StandardResultSetPagination(PageNumberPagination):
    page_size = 20
    page_size_query_param = 'page_size'
    max_page_size = 1000

class ProductViewSet(viewsets.ModelViewSet):
    queryset = Product.objects.all().select_related("brand", "category", "provider").prefetch_related("images")
    serializer_class = ProductSerializer

    permission_classes = [IsAuthenticated, IsAdminOrReadOnly]

    filter_backends = [
        DjangoFilterBackend,
        filters.SearchFilter,
        filters.OrderingFilter
    ]
    filterset_fields = ['brand', 'category', 'provider']
    seatch_fields = ['nombre_comercial', 'ean', 'sku', 'descripcion']
    ordering_fields = ['nombre_comercial', 'precio_venta', 'stock', 'rating', 'marca', 'categoria']
    pagination_class = StandardResultSetPagination

class BrandViewSet(viewsets.ModelViewSet):
    queryset = Brand.objects.all()
    serializer_class = BrandSerializer

class CategoryViewSet(viewsets.ModelViewSet):
    queryset = Category.objects.all()
    serializer_class = CategorySerializer

class ProviderViewSet(viewsets.ModelViewSet):
    queryset = Provider.objects.all()
    serializer_class = ProviderSerializer

class ProductImageViewSet(viewsets.ModelViewSet):
    queryset = ProductImage.objects.all()
    serializer_class = ProductImageSerializer
    filter_backends = [filters.SearchFilter]
    search_fields = ['product__id']

class ProductHistoryViewSet(viewsets.ReadOnlyModelViewSet):
    queryset = Product.history.all().order_by('-history_date')
    serializer_class = HistoricalProductSerializer
    permission_classes = [IsAdminUser]