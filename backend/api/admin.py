from django.contrib import admin
from .models import Brand, Category, Provider, Product, ProductImage
# Si tienes simple_history instalado (lo vi en tus migraciones), esto habilita el historial en el admin
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

# Registro simple para las otras tablas
admin.site.register(Brand)
admin.site.register(Category)
admin.site.register(Provider)