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
from datetime import datetime, timedelta, date
from django.db.models.functions import TruncDate
from django.db.models import Sum
from sklearn.linear_model import LinearRegression
import pandas as pd
import numpy as np
import os
import google.generativeai as genai

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

    @action(detail=False, methods=['post'], url_path='generate-ai-description')
    def generate_ai_description(self, request):
        api_key = os.environ.get('GOOGLE_API_KEY')

        if not api_key:
            return Response({"error": "Falta configurar la API Key"}, status=503)
        
        try:
            genai.configure(api_key=api_key)
            model = genai.GenerativeModel('gemini-2.5-flash')

            data = request.data
            name = data.get('name', '')
            brand = data.get('brand_name', '')
            cat = data.get('category_name', '')

            prompt = (
                f"Actúa como un experto en ventas y marketing. Escribe una descripción atractiva "
                f"para un producto llamado '{name}' de la marca '{brand}' ({cat}). "
                f"Máximo 300 caracteres. Tono profesional."
            )

            response = model.generate_content(prompt)
            return Response({'description': response.text})
        
        except Exception as e:
            print(f"Error IA: {e}")
            return Response({"error": "Error al conectar con la IA"}, status=500)
        
    @action(detail=True, methods=['get'], url_path='forecast')
    def forecast(self, request, pk=None):
        product = self.get_object()

        movements = StockMovement.objects.filter(
            product=product,
            movement_type='OUT'
        ).annotate(date=TruncDate('created_at')).values('date').annotate(total=Sum('quantity')).order_by('date')

        if not movements or len(movements) < 2:
            return Response({
                "status": "insufficient_data",
                "message": "Necesito al menos 2 días de ventas para predecir el futuro."
            })
        
        df = pd.DataFrame(movements)
        df['days_ordinal'] = pd.to_datetime(df['date']).map(date.toordinal)

        X = df[['days_ordinal']]
        y = df['total']

        model = LinearRegression()
        model.fit(X, y)

        velocidad_venta = model.coef_[0]

        velocity = abs(velocidad_venta) if velocidad_venta != 0 else 0.1

        current_stock = product.stock
        dias_para_agotar = int(current_stock / velocity)
        fecha_estimada = date.today() + timedelta(days=dias_para_agotar)

        labels = [m['date'].strftime('%d/%m') for m in movements]
        data_points = [m['total'] for m in movements]

        return Response({
            "status": "success",
            "product": product.nombre_comercial,
            "current_stock": current_stock,
            "burn_rate": round(velocity, 2),
            "days_left": dias_para_agotar,
            "estimated_stockout": fecha_estimada.strftime('%d/%m/%Y'),
            "chart_data": {
                "labels": labels,
                "values": data_points
            }
        })

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