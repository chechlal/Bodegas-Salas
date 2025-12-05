from rest_framework_simplejwt.serializers import TokenObtainPairSerializer

class MyTokenObtainPairSerializer(TokenObtainPairSerializer):
    @classmethod
    def get_token(cls, user):
        token = super().get_token(user)

        # Agregar datos extra al token (Username)
        token['username'] = user.username

        # Intentar obtener el rol de forma segura
        try:
            if hasattr(user, 'profile'):
                token['role'] = user.profile.role
            else:
                token['role'] = 'SELLER' # Valor por defecto si no hay perfil
        except Exception:
            token['role'] = 'SELLER' # Valor por defecto si algo falla
            
        return token