from django.db import models

# Create your models here.
from django.db import models, transaction
from django.core.exceptions import ValidationError
from django.contrib.auth.models import User
from companies.models import Company

class Product(models.Model):
    company = models.ForeignKey(Company, on_delete=models.CASCADE, related_name='products')
    name = models.CharField(max_length=200)
    sku = models.CharField(max_length=50)
    description = models.TextField(blank=True)
    
    # Precios y Costos
    price = models.DecimalField(max_digits=10, decimal_places=2, default=0)
    cost = models.DecimalField(max_digits=10, decimal_places=2, default=0) # Sensible
    
    # Stock (Lectura rápida, controlado por movimientos)
    current_stock = models.IntegerField(default=0)
    
    # Metadata opcional
    image_url = models.URLField(blank=True, null=True)
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        unique_together = ('company', 'sku') # SKU único por empresa, no global

    def __str__(self):
        return f"{self.sku} - {self.name}"

    def recalculate_stock(self):
        """Recorre todo el historial para sanear el stock."""
        total = 0
        movements = self.stock_movements.all()
        for mov in movements:
            if mov.type == 'IN':
                total += mov.quantity
            elif mov.type == 'OUT':
                total -= mov.quantity
            elif mov.type == 'ADJ':
                # Asumimos que ADJ es un ajuste directo (+/-) o seteo.
                # Para simplificar en este SaaS, lo trataremos como delta.
                # Si quisieras "Resetear a X", la lógica cambia.
                # Aquí lo usaremos como ajuste relativo (ej: se rompieron 2 -> -2)
                total += mov.quantity 
        
        self.current_stock = total
        self.save(update_fields=['current_stock'])


class StockMovement(models.Model):
    TYPE_CHOICES = (
        ('IN', 'Entrada'),
        ('OUT', 'Salida'),
        ('ADJ', 'Ajuste'),
    )

    company = models.ForeignKey(Company, on_delete=models.CASCADE)
    product = models.ForeignKey(Product, on_delete=models.CASCADE, related_name='stock_movements')
    user = models.ForeignKey(User, on_delete=models.SET_NULL, null=True)
    
    type = models.CharField(max_length=3, choices=TYPE_CHOICES)
    quantity = models.PositiveIntegerField() # Siempre positivo, el tipo define signo
    reason = models.CharField(max_length=255)
    timestamp = models.DateTimeField(auto_now_add=True)

    def save(self, *args, **kwargs):
        # Lógica Transaccional
        if not self.pk: # Solo al crear
            with transaction.atomic():
                # 1. Validar Stock Negativo
                if self.type == 'OUT':
                    # Refrescamos producto de la BD para tener stock real
                    self.product.refresh_from_db()
                    if self.product.current_stock < self.quantity:
                        raise ValidationError(f"Stock insuficiente. Disponible: {self.product.current_stock}")
                
                # 2. Guardar Movimiento
                super().save(*args, **kwargs)
                
                # 3. Actualizar Producto (Atómicamente)
                if self.type == 'IN':
                    self.product.current_stock += self.quantity
                elif self.type == 'OUT':
                    self.product.current_stock -= self.quantity
                elif self.type == 'ADJ':
                    # ADJ positivo suma, ADJ negativo (lógica requeriría campo signed)
                    # Por simplicidad del modelo user: quantity siempre es int positivo.
                    # Asumiremos ADJ como IN para este ejemplo básico o habría que agregar campo signo.
                    # Mantenemos simple: IN/OUT son los principales. ADJ funciona como IN aquí.
                    self.product.current_stock += self.quantity 
                
                self.product.save(update_fields=['current_stock'])
        else:
            # No permitimos editar movimientos existentes para proteger integridad
            raise ValidationError("Los movimientos de stock son inmutables.")

    def delete(self, *args, **kwargs):
        raise ValidationError("No está permitido borrar movimientos de stock. Crea un contra-movimiento.")

    def __str__(self):
        return f"{self.type} {self.quantity} - {self.product.name}"