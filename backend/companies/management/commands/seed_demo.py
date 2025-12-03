from django.core.management.base import BaseCommand
from django.contrib.auth.models import User
from companies.models import Company, UserProfile
from inventory.models import Product, StockMovement
import random

class Command(BaseCommand):
    help = 'Genera datos de prueba para defensa (1 Empresa, Admin, Seller, Productos, Movimientos)'

    def handle(self, *args, **kwargs):
        self.stdout.write("🧹 Limpiando base de datos...")
        # Borramos en orden para respetar claves foráneas
        StockMovement.objects.all().delete()
        Product.objects.all().delete()
        UserProfile.objects.all().delete()
        User.objects.all().delete()
        Company.objects.all().delete()

        self.stdout.write("🏭 Creando Empresa Demo...")
        company = Company.objects.create(name="Bodegas Salas Demo", rut="76.123.456-K")

        self.stdout.write("👥 Creando Usuarios...")
        # Crear Admin
        if not User.objects.filter(username='admin').exists():
            admin_user = User.objects.create_user('admin', 'admin@bodegas.cl', 'admin123')
            # El profile se crea por signal, lo actualizamos
            admin_user.profile.company = company
            admin_user.profile.role = 'ADMIN'
            admin_user.profile.save()
        else:
            admin_user = User.objects.get(username='admin')

        # Crear Vendedor
        if not User.objects.filter(username='vendedor').exists():
            seller_user = User.objects.create_user('vendedor', 'ven@bodegas.cl', 'seller123')
            seller_user.profile.company = company
            seller_user.profile.role = 'SELLER'
            seller_user.profile.save()
        else:
            seller_user = User.objects.get(username='vendedor')

        self.stdout.write("📦 Creando Productos...")
        p1 = Product.objects.create(company=company, name="Vino Cabernet Reserva", sku="VIN-001", price=15000, cost=8000)
        p2 = Product.objects.create(company=company, name="Pisco Premium 40", sku="PIS-002", price=22000, cost=12000)
        p3 = Product.objects.create(company=company, name="Caja Cerveza Artesanal", sku="CER-003", price=25000, cost=15000)

        self.stdout.write("🚚 Generando Movimientos de Stock...")
        # Entrada inicial (Admin)
        StockMovement.objects.create(company=company, product=p1, user=admin_user, type='IN', quantity=100, reason="Stock Inicial")
        StockMovement.objects.create(company=company, product=p2, user=admin_user, type='IN', quantity=50, reason="Stock Inicial")
        
        # Una venta (Vendedor)
        StockMovement.objects.create(company=company, product=p1, user=seller_user, type='OUT', quantity=5, reason="Venta #1001")
        
        # Un ajuste (Admin)
        StockMovement.objects.create(company=company, product=p3, user=admin_user, type='IN', quantity=20, reason="Compra proveedor")
        
        self.stdout.write(self.style.SUCCESS(f"✅ ¡Datos creados exitosamente!"))
        self.stdout.write(f"-----------------------------------")
        self.stdout.write(f"🔑 Credenciales:")
        self.stdout.write(f"   Admin:    admin / admin123")
        self.stdout.write(f"   Vendedor: vendedor / seller123")