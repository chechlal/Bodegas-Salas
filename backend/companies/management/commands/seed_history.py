from django.core.management.base import BaseCommand
from api.models import Product, StockMovement
from django.contrib.auth import get_user_model
from django.utils import timezone
from datetime import timedelta
import random

class Command(BaseCommand):
    help = 'Genera un historial de ventas falso (Backfilling) para probar la Predicción IA'

    def handle(self, *args, **kwargs):
        # 1. Obtener recursos necesarios
        User = get_user_model()
        user = User.objects.filter(is_staff=True).first()
        
        if not user:
            self.stdout.write(self.style.ERROR("❌ Error: Crea un superusuario primero (python manage.py createsuperuser)"))
            return

        # Buscamos el primer producto disponible para usarlo de "Conejillo de Indias"
        product = Product.objects.first()
        if not product:
            self.stdout.write(self.style.ERROR("❌ Error: No hay productos. Crea uno en el admin primero."))
            return

        self.stdout.write(self.style.WARNING(f"🔮 Iniciando simulación de historia para: {product.nombre_comercial}..."))

        # 2. Limpieza (Opcional: borramos movimientos previos de este producto para empezar limpio)
        StockMovement.objects.filter(product=product).delete()

        # 3. La "Gran Compra" Inicial (Hace 30 días)
        # Necesitamos stock inicial para poder vender
        StockMovement.objects.create(
            product=product,
            quantity=200,
            movement_type='IN',
            reason="Inventario Inicial (Simulado)",
            user=user
        )
        # Hack para mover la fecha al pasado (Django pone 'now' por defecto)
        compra_inicial = StockMovement.objects.filter(product=product, movement_type='IN').first()
        compra_inicial.created_at = timezone.now() - timedelta(days=30)
        compra_inicial.save()

        # 4. Generar Ventas Diarias (Desde hace 14 días hasta ayer)
        # Simularemos una tendencia de venta constante (ej: 3 a 8 unidades diarias)
        total_dias = 14
        for i in range(total_dias, 0, -1):
            fecha_simulada = timezone.now() - timedelta(days=i)
            
            # Aleatoriedad controlada: Vendemos entre 3 y 8 unidades
            cantidad = random.randint(3, 8)
            
            mov = StockMovement.objects.create(
                product=product,
                quantity=cantidad,
                movement_type='OUT',
                reason=f"Venta simulada día -{i}",
                user=user
            )
            
            # --- EL TRUCO DE MAGIA ---
            # Forzamos la fecha en la base de datos usando .update()
            # (Porque .save() normal a veces no sobreescribe el auto_now_add)
            StockMovement.objects.filter(id=mov.id).update(created_at=fecha_simulada)
            
            self.stdout.write(f"   📅 {fecha_simulada.date()}: Se vendieron {cantidad} unidades")

        # 5. Recalcular el stock final real
        product.recalcular_stock()
        
        self.stdout.write(self.style.SUCCESS(f"✅ ¡Listo! El producto '{product.nombre_comercial}' ahora tiene historial."))
        self.stdout.write(self.style.SUCCESS(f"   Stock Actual: {product.stock}"))
        self.stdout.write(self.style.SUCCESS(f"   Ve al Frontend y abre este producto para ver el gráfico."))