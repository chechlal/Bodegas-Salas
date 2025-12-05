from rest_framework import permissions

class IsAdminUser(permissions.BasePermission):
    """
    Permite acceso total solo a usuarios con rol ADMIN.
    """
    def has_permission(self, request, view):
        return bool(request.user and request.user.is_authenticated and 
                    hasattr(request.user, 'profile') and 
                    request.user.profile.role == 'ADMIN')

class IsSellerUser(permissions.BasePermission):
    """
    Permite acceso a usuarios con rol SELLER.
    """
    def has_permission(self, request, view):
        return bool(request.user and request.user.is_authenticated and 
                    hasattr(request.user, 'profile') and 
                    request.user.profile.role == 'SELLER')

class IsAdminOrReadOnly(permissions.BasePermission):
    """
    Permite leer a todos los autenticados, pero editar solo al ADMIN.
    """
    def has_permission(self, request, view):
        # Lectura (GET, HEAD, OPTIONS) permitida para cualquier usuario autenticado
        if request.method in permissions.SAFE_METHODS:
            return bool(request.user and request.user.is_authenticated)
        
        # Escritura (POST, PUT, DELETE) solo para ADMIN
        return bool(request.user and request.user.is_authenticated and 
                    hasattr(request.user, 'profile') and 
                    request.user.profile.role == 'ADMIN')