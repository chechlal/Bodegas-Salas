from django.shortcuts import render

# Create your views here.
from rest_framework import viewsets, permissions, status
from rest_framework.response import Response
from rest_framework.decorators import action
from .models import Product, StockMovement
from .serializers import (
    ProductAdminSerializer, 
    ProductSellerSerializer, 
    ProductWriteSerializer,
    StockMovementSerializer
)

class IsAdminUserOrReadOnly(permissions.BasePermission):
    """
    Admin: CRUD completo.
    Seller: Solo lectura (GET).
    """
    def has_permission(self, request, view):
        if request.method in permissions.SAFE_METHODS:
            return True
        return hasattr(request.user, 'profile') and request.user.profile.role == 'ADMIN'

class ProductViewSet(viewsets.ModelViewSet):
    permission_classes = [permissions.IsAuthenticated, IsAdminUserOrReadOnly]

    def get_queryset(self):
        # FILTRO MANDATORIO: Solo productos de mi empresa
        return Product.objects.filter(company=self.request.user.profile.company)

    def get_serializer_class(self):
        # Si vamos a escribir (POST/PUT), usamos el serializer de escritura
        if self.action in ['create', 'update', 'partial_update']:
            return ProductWriteSerializer
        
        # Lectura: Depende del rol
        user_role = getattr(self.request.user.profile, 'role', 'SELLER')
        if user_role == 'ADMIN':
            return ProductAdminSerializer
        return ProductSellerSerializer

    def perform_create(self, serializer):
        # Asignar automáticamente la empresa del usuario
        serializer.save(company=self.request.user.profile.company)

class StockMovementViewSet(viewsets.GenericViewSet, viewsets.mixins.ListModelMixin, viewsets.mixins.CreateModelMixin):
    # No permitimos Update ni Destroy
    queryset = StockMovement.objects.all()
    serializer_class = StockMovementSerializer
    permission_classes = [permissions.IsAuthenticated]

    def get_queryset(self):
        return StockMovement.objects.filter(company=self.request.user.profile.company).order_by('-timestamp')

    def perform_create(self, serializer):
        # Asignar usuario y empresa automáticamente
        serializer.save(
            user=self.request.user,
            company=self.request.user.profile.company
        )