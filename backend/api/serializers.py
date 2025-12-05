from rest_framework import serializers
from .models import Product, Brand, Category, Provider, ProductImage
from simple_history.models import HistoricalRecords
from .models import StockMovement

class StockMovementSerializer(serializers.ModelSerializer):
    class Meta:
        model = StockMovement
        fields = ['id', 'product', 'quantity', 'movement_type', 'reason', 'user', 'created_at']
        read_only_fields = ['user', 'created_at'] # El usuario y fecha se ponen solos
    
    def validate(self, data):
        if data['movement_type'] == 'OUT':
            product = data['product']
            if product.stock < data['quantity']:
                raise serializers.ValidationError({
                    "quantity": f"No hay suficiente stock. Disponible: {product.stock}, Intentado sacar: {data['quantity']}"
                })
        return data

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
        read_only_fields = ['stock']

class ProductSellerSerializer(serializers.ModelSerializer):
    # Reutilizamos los campos anidados para que se vea bonito (Marca, Categoría)
    brand = BrandSerializer(read_only=True)
    category = CategorySerializer(read_only=True)
    images = ProductImageSerializer(many=True, read_only=True)

    class Meta:
        model = Product
        # EXCLUIMOS: costo_cg, provider, created_at, updated_at
        fields = [
            'id', 'nombre_comercial', 'ean', 'sku', 
            'peso', 'dimensiones', 'descripcion', 
            'lugar_bodega', 'edad_uso', 
            'stock', 'precio_venta', 'rating', 
            'brand', 'category', 'images'
        ]

class HistoricalProductSerializer(serializers.ModelSerializer):
    history_user = serializers.StringRelatedField()
    history_type = serializers.CharField()

    class Meta:
        model = Product.history.model # Accede al modelo de historial
        fields = '__all__'