import os
import django
import sys

# Setup Django Environment
sys.path.append(os.path.join(os.path.dirname(__file__), 'backend'))
os.environ.setdefault("DJANGO_SETTINGS_MODULE", "backend.settings")
django.setup()

from django.contrib.auth import get_user_model
from api.models import Product, Brand, Category, Provider

User = get_user_model()

def create_users():
    print("--- Creating Users ---")

    # Admin
    admin_user, created = User.objects.get_or_create(username='admin')
    if created:
        admin_user.set_password('admin123')
        admin_user.is_staff = True
        admin_user.is_superuser = True
        admin_user.email = 'admin@bodegassalas.cl'
        admin_user.save()
        print("✅ Created Admin User: admin / admin123")
    else:
        print("ℹ️ Admin User already exists")

    # Seller
    seller_user, created = User.objects.get_or_create(username='vendedor')
    if created:
        seller_user.set_password('vendedor123')
        seller_user.is_staff = False # Not staff, just authenticated
        seller_user.save()
        print("✅ Created Seller User: vendedor / vendedor123")
    else:
        print("ℹ️ Seller User already exists")

def create_initial_data():
    print("\n--- Creating Initial Data ---")

    # Brands
    nike, _ = Brand.objects.get_or_create(name="Nike")
    samsung, _ = Brand.objects.get_or_create(name="Samsung")
    print("✅ Brands created")

    # Categories
    shoes, _ = Category.objects.get_or_create(name="Zapatillas")
    electronics, _ = Category.objects.get_or_create(name="Electrónica")
    print("✅ Categories created")

    # Providers
    prov1, _ = Provider.objects.get_or_create(name="Importadora Central")
    print("✅ Providers created")

    # Products
    if not Product.objects.exists():
        p1 = Product.objects.create(
            nombre_comercial="Zapatillas Air Max",
            brand=nike,
            category=shoes,
            provider=prov1,
            sku="NK-AIR-001",
            ean="1234567890123",
            descripcion="Zapatillas deportivas de alta gama",
            costo_cg=25000,
            precio_venta=45000,
            stock=0, # Initial stock 0
            peso=0.5,
            rating=4.5,
            lugar_bodega="A1"
        )
        print(f"✅ Created Product: {p1.nombre_comercial}")
    else:
        print("ℹ️ Products already exist")

if __name__ == '__main__':
    try:
        create_users()
        create_initial_data()
        print("\n🎉 Setup Completed Successfully!")
        print("Run 'python backend/manage.py runserver' to start.")
    except Exception as e:
        print(f"❌ Error: {e}")
