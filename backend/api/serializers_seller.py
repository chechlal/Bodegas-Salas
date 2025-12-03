from rest_framework import serializers
from .models import Product

class ProductSellerSerializer(serializers.ModelSerializer):
    """
    Serializer limited for Sellers:
    - Hides 'costo_cg'
    - Hides 'provider' details (only ID or Name, or completely hidden)
    - Read-only 'stock' (calculated)
    """
    brand_name = serializers.CharField(source='brand.name', read_only=True)
    category_name = serializers.CharField(source='category.name', read_only=True)
    images = serializers.StringRelatedField(many=True, read_only=True) # Or full image serializer

    class Meta:
        model = Product
        fields = [
            'id', 'nombre_comercial', 'ean', 'sku',
            'peso', 'dimensiones', 'descripcion',
            'lugar_bodega', 'edad_uso',
            'stock', 'precio_venta', 'rating',
            'brand_name', 'category_name',
            'images',
            # NO costo_cg
            # NO provider
            'updated_at'
        ]
        read_only_fields = fields # Sellers cannot edit anything via this serializer
