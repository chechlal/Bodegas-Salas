from rest_framework import viewsets, filters
from rest_framework.pagination import PageNumberPagination
from django_filters.rest_framework import DjangoFilterBackend # type: ignore
from .models import Product, Brand, Category, Provider, ProductImage, StockMovement
from .serializers import ProductSerializer, ProductSellerSerializer, BrandSerializer, CategorySerializer, ProviderSerializer, ProductImageSerializer, HistoricalProductSerializer, StockMovementSerializer
from rest_framework.permissions import IsAdminUser, IsAuthenticated
from rest_framework.exceptions import MethodNotAllowed
from rest_framework.decorators import action
from rest_framework.response import Response
from companies.permissions import IsAdminOrReadOnly, IsSellerUser, IsSellerUserOrAdmin
from datetime import datetime

class StockMovementViewSet(viewsets.ModelViewSet):
    queryset = StockMovement.objects.all()
    serializer_class = StockMovementSerializer

    permission_classes = [IsSellerUserOrAdmin]

    filterset_fields = ['product', 'movement_type']

    # Guardar automáticamente quién hizo el movimiento
    def perform_create(self, serializer):
        serializer.save(user=self.request.user)

    def destroy(self, request, *args, **kwargs):
        raise MethodNotAllowed("DELETE", detail="Por seguridad auditora, los movimientos de stock no pueden eliminarse. Realice un contra-movimiento de ajuste.")

class StandardResultSetPagination(PageNumberPagination):
    page_size = 1000
    page_size_query_param = 'page_size'
    max_page_size = 1000

class ProductViewSet(viewsets.ModelViewSet):
    queryset = Product.objects.all().select_related("brand", "category", "provider").prefetch_related("images")

    def perform_create(self, serializer):
        # Asigna el usuario autenticado como dueño del producto
        serializer.save(user=self.request.user)

    def get_serializer_class(self):
        # Si el usuario es Staff/Admin, ve todo completo
        if self.request.user.is_staff or (hasattr(self.request.user, 'profile') and self.request.user.profile.role == 'ADMIN'):
            return ProductSerializer
        # Para todos los demás (Vendedores), versión censurada
        return ProductSellerSerializer

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

@action(detail=True, methods=['get'], url_path='pim-sheet')
def pim_sheet(self, request, pk=None):
        product = self.get_object()
        ficha = (
            f"FICHA TÉCNICA DE PRODUCTO\n"
            f"========================================\n"
            f"Producto: {product.nombre_comercial}\n"
            f"Marca:    {product.brand.name}\n"
            f"SKU:      {product.sku}\n"
            f"----------------------------------------\n"
            f"ESPECIFICACIONES:\n"
            f"- Categoría:   {product.category.name}\n"
            f"- Dimensiones: {product.dimensiones}\n"
            f"- Peso:        {product.peso} kg\n"
            f"- Uso Sugerido: {product.edad_uso or 'N/A'}\n"
            f"----------------------------------------\n"
            f"PRECIO LISTA: ${product.precio_venta:,.0f} CLP\n"
            f"----------------------------------------\n"
            f"DESCRIPCIÓN:\n"
            f"{product.descripcion}\n"
            f"========================================\n"
            f"Generado por Bodegas Salas ERP - {datetime.now().strftime('%d/%m/%Y')}"
        )

        return Response({'text': ficha})

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
    permission_classes = [IsSellerUserOrAdmin]
    filter_backends = [filters.SearchFilter]
    search_fields = ['product__id']

class ProductHistoryViewSet(viewsets.ReadOnlyModelViewSet):
    queryset = Product.history.all().order_by('-history_date')
    serializer_class = HistoricalProductSerializer
    permission_classes = [IsAdminUser]