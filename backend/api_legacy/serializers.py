from rest_framework import serializers
from .models import Product, Brand, Category, Provider, ProductImage
from simple_history.models import HistoricalRecords

class BrandSerializer(serializers.ModelSerializer):
    class Meta:
        model = Brand
        fields = ['id', 'name']

class CategorySerializer(serializers.ModelSerializer):
    class Meta:
        model = Category
        fields = ['id', 'name']

class ProviderSerializer(serializers.ModelSerializer):
    class Meta:
        model = Provider
        fields = ['id', 'name']

class ProductImageSerializer(serializers.ModelSerializer):
    def validate_image(self, value):
        from PIL import Image
        try:
            img = Image.open(value)
            img.verify()  # Verify image integrity
        except Exception as e:
            print(f"Image validation error for file '{value.name}': {str(e)}")  # Log to console
            raise serializers.ValidationError(f"Invalid image: {str(e)}")
        return value
    
    class Meta:
        model = ProductImage
        fields = ['id', 'image', 'is_principal', 'product']

class ProductSerializer(serializers.ModelSerializer):
    brand = BrandSerializer(read_only=True)
    category = CategorySerializer(read_only=True)
    provider = ProviderSerializer(read_only=True)
    images = ProductImageSerializer(many=True, read_only=True)

    brand_id = serializers.PrimaryKeyRelatedField(
        queryset=Brand.objects.all(), source="brand", write_only=True
    )
    category_id = serializers.PrimaryKeyRelatedField(
        queryset=Category.objects.all(), source="category", write_only=True
    )
    provider_id = serializers.PrimaryKeyRelatedField(
        queryset=Provider.objects.all(), source="provider", write_only=True
    )

    class Meta:
        model = Product
        fields = [
            'id', 'nombre_comercial', 'ean', 'sku', 'peso', 'dimensiones', 'descripcion',
            'costo_cg', 'lugar_bodega', 'edad_uso', 'stock', 'precio_venta', 'rating',
            'brand', 'category', 'provider', 'images',
            'brand_id', 'category_id', 'provider_id',
            'created_at', 'updated_at'
        ]

class HistoricalProductSerializer(serializers.ModelSerializer):
    history_user = serializers.StringRelatedField()
    history_type = serializers.CharField()

    class Meta:
        model = Product.history.model # Accede al modelo de historial
        fields = '__all__'