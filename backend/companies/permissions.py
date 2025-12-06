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
        if request.method in permissions.SAFE_METHODS:
            return bool(request.user and request.user.is_authenticated)
        
        return bool(request.user and request.user.is_authenticated and 
                    hasattr(request.user, 'profile') and 
                    request.user.profile.role == 'ADMIN')

class IsSellerUserOrAdmin(permissions.BasePermission):
    def has_permission(self, request, view):
        # 1. Si solo quiere leer, dejar pasar si está logueado
        if request.method in permissions.SAFE_METHODS:
            return bool(request.user and request.user.is_authenticated)
        
        # 2. Si quiere CREAR (Vender/Mover Stock), dejar pasar si está logueado
        if request.method == 'POST':
            return bool(request.user and request.user.is_authenticated)

        # 3. Si quiere BORRAR o EDITAR, solo el ADMIN puede
        return bool(request.user and request.user.is_authenticated and 
                    hasattr(request.user, 'profile') and 
                    request.user.profile.role == 'ADMIN')