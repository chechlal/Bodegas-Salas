from django.contrib import admin
from .models import Brand, Category, Provider, Product, ProductImage,StockMovement
from simple_history.admin import SimpleHistoryAdmin

class ProductImageInline(admin.TabularInline):
    model = ProductImage
    extra = 1

@admin.register(Product)
class ProductAdmin(SimpleHistoryAdmin):
    # Qué columnas ver en la lista
    list_display = ('nombre_comercial', 'sku', 'brand', 'category', 'stock', 'precio_venta', 'user')
    # Por qué campos buscar
    search_fields = ('nombre_comercial', 'sku', 'ean')
    # Filtros laterales
    list_filter = ('brand', 'category', 'provider')
    # Editar imágenes dentro del mismo producto
    inlines = [ProductImageInline]

@admin.register(StockMovement)
class StockMovementAdmin(SimpleHistoryAdmin):
    list_display = ('product', 'movement_type', 'quantity', 'user', 'created_at')
    list_filter = ('movement_type', 'created_at', 'user')
    search_fields = ('product__nombre_comercial', 'reason')
    readonly_fields = ('user', 'created_at')

    def save_model(self, request, obj, form, change):
        if not obj.user_id:
            obj.user = request.user
        super().save_model(request, obj, form, change)

# Registro simple para las otras tablas
admin.site.register(Brand)
admin.site.register(Category)
admin.site.register(Provider)