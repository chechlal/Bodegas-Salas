from rest_framework import serializers
from .models import Product, StockMovement
from companies.models import Company

class ProductWriteSerializer(serializers.ModelSerializer):
    class Meta:
        model = Product
        fields = '__all__'
        read_only_fields = ('company', 'current_stock', 'created_at')

class ProductAdminSerializer(serializers.ModelSerializer):
    class Meta:
        model = Product
        fields = '__all__' # Admin ve todo: costo, stock, etc.

class ProductSellerSerializer(serializers.ModelSerializer):
    class Meta:
        model = Product
        # EXCLUIMOS explícitamente el costo
        exclude = ('cost', ) 

class StockMovementSerializer(serializers.ModelSerializer):
    product_name = serializers.CharField(source='product.name', read_only=True)
    user_name = serializers.CharField(source='user.username', read_only=True)

    class Meta:
        model = StockMovement
        fields = '__all__'
        read_only_fields = ('company', 'user', 'timestamp', 'product_name', 'user_name')