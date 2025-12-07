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

    def perform_update(self, serializer):
        # 1. Obtenemos el producto antes del cambio
        instance = self.get_object()
        
        # 2. Detectamos si hubo cambios reales
        has_changes = False
        for field, value in serializer.validated_data.items():
            old_value = getattr(instance, field)
            if old_value != value:
                has_changes = True
                break
        
        # 3. Solo guardamos si hay cambios
        if has_changes:
            serializer.save(user=self.request.user)
        else:
            # Si no hay cambios, no hacemos nada (el historial no se ensucia)
            pass

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
            f"FICHA TECNICA DE PRODUCTO\n"
            f"========================================\n"
            f"PRODUCTO: {product.nombre_comercial}\n"
            f"SKU:      {product.sku}\n"
            f"MARCA:    {product.brand.name if product.brand else 'N/A'}\n"
            f"----------------------------------------\n"
            f"DETALLES TÉCNICOS:\n"
            f"- Categoría:   {product.category.name if product.category else 'N/A'}\n"
            f"- Dimensiones: {product.dimensiones or 'N/A'}\n"
            f"- Peso:        {product.peso or 'N/A'} kg\n"
            f"- Uso:         {product.edad_uso or 'N/A'}\n"
            f"----------------------------------------\n"
            f"PRECIO LISTA: ${product.precio_venta:,.0f} CLP\n"
            f"----------------------------------------\n"
            f"DESCRIPCIÓN:\n"
            f"{product.descripcion or 'N/A'}\n"
            f"========================================\n"
            f"Bodegas Salas ERP - {datetime.now().strftime('%d/%m/%Y')}"
        )
        return Response({'text': ficha})
    
    def get_queryset(self):
        return Product.objects.filter(is_active=True).select_related("brand", "category", "provider").prefetch_related("images")

    def perform_destroy(self, instance):
        instance.is_active = False
        instance.save()

class BrandViewSet(viewsets.ModelViewSet):
    queryset = Brand.objects.all()
    serializer_class = BrandSerializer

    def perform_destroy(self, instance):
        # LÓGICA DE CASCADA SEGURA:
        # A. Apagar la Marca
        instance.is_active = False
        instance.save()
        
        # B. Apagar automáticamente todos sus productos (Bulk Update)
        # Esto es mucho más rápido que borrarlos uno por uno
        products_count = instance.product_set.update(is_active=False)
        
        print(f"📉 Marca '{instance.name}' descontinuada. {products_count} productos ocultados.")

class CategoryViewSet(viewsets.ModelViewSet):
    queryset = Category.objects.all()
    serializer_class = CategorySerializer

    def perform_destroy(self, instance):
        # LÓGICA DE CASCADA SEGURA:
        # A. Apagar la Marca
        instance.is_active = False
        instance.save()
        
        # B. Apagar automáticamente todos sus productos (Bulk Update)
        # Esto es mucho más rápido que borrarlos uno por uno
        products_count = instance.product_set.update(is_active=False)
        
        print(f"📉 Categoría '{instance.name}' descontinuada. {products_count} productos ocultados.")

class ProviderViewSet(viewsets.ModelViewSet):
    queryset = Provider.objects.all()
    serializer_class = ProviderSerializer

    def perform_destroy(self, instance):
        # LÓGICA DE CASCADA SEGURA:
        # A. Apagar la Marca
        instance.is_active = False
        instance.save()
        
        # B. Apagar automáticamente todos sus productos (Bulk Update)
        # Esto es mucho más rápido que borrarlos uno por uno
        products_count = instance.product_set.update(is_active=False)
        
        print(f"📉 Proveedor '{instance.name}' descontinuado. {products_count} productos ocultados.")

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