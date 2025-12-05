from django.core.management.base import BaseCommand
from django.contrib.auth import get_user_model
from companies.models import Company, UserProfile
from api.models import Product, Brand, Category, Provider
import random
import string

User = get_user_model()

class Command(BaseCommand):
    help = 'Genera DATOS MASIVOS para la presentación de título'

    def handle(self, *args, **kwargs):
        # ==========================================
        # 1. LIMPIEZA TOTAL (WIPE)
        # ==========================================
        self.stdout.write(self.style.WARNING("🧹 Limpiando base de datos completa..."))
        # Borramos en orden inverso para evitar conflictos
        Product.objects.all().delete()
        Brand.objects.all().delete()
        Category.objects.all().delete()
        Provider.objects.all().delete()
        UserProfile.objects.all().delete()
        User.objects.all().delete()
        Company.objects.all().delete()

        # ==========================================
        # 2. CREACIÓN DE EMPRESA Y USUARIOS
        # ==========================================
        self.stdout.write("🏭 Creando Empresa y Actores...")
        company = Company.objects.create(name="Bodegas Salas Demo", rut="76.123.456-K")

        # Admin
        admin_user = User.objects.create_superuser('admin', 'admin@bodegas.cl', 'admin123')
        profile_admin = UserProfile.objects.get(user=admin_user)
        profile_admin.company = company
        profile_admin.role = 'ADMIN'
        profile_admin.save()

        # Vendedor
        seller_user = User.objects.create_user('vendedor', 'ven@bodegas.cl', 'seller123')
        profile_seller = UserProfile.objects.get(user=seller_user)
        profile_seller.company = company
        profile_seller.role = 'SELLER'
        profile_seller.save()

        # ==========================================
        # 3. CREACIÓN DE DATOS MAESTROS
        # ==========================================
        self.stdout.write("📦 Creando Marcas, Categorías y Proveedores...")

        # Listas de datos base
        nombres_marcas = ["Samsung", "LG", "Sony", "Bosch", "Makita", "Stanley", "Philips", "Logitech", "Nintendo", "Apple", "Generico"]
        nombres_categorias = ["Electrónica", "Herramientas", "Hogar", "Audio", "Iluminación", "Juguetería", "Computación"]
        nombres_proveedores = ["TecnoChile", "Importadora Global", "Distribuidora Santiago", "AliExpress Suppliers", "Bodega Central"]

        # Crear objetos en BD
        marcas_objs = [Brand.objects.create(name=m) for m in nombres_marcas]
        cats_objs = [Category.objects.create(name=c) for c in nombres_categorias]
        provs_objs = [Provider.objects.create(name=p) for p in nombres_proveedores]

        # ==========================================
        # 4. GENERADOR MASIVO DE PRODUCTOS
        # ==========================================
        CANTIDAD_A_GENERAR = 50 
        self.stdout.write(f"🚀 Generando {CANTIDAD_A_GENERAR} productos aleatorios...")

        adjetivos = ["Pro", "Ultra", "Max", "Lite", "Basic", "Premium", "v2.0", "Wireless", "Industrial", "Hogar"]
        sustantivos = {
            "Electrónica": ["Televisor", "Monitor", "Cargador", "Cable HDMI"],
            "Herramientas": ["Taladro", "Martillo", "Sierra", "Destornillador"],
            "Hogar": ["Lámpara", "Cortina", "Mesa", "Silla Gamer"],
            "Audio": ["Parlante", "Audífonos", "Barra de Sonido", "Micrófono"],
            "Iluminación": ["Foco LED", "Tira LED", "Ampolleta Smart"],
            "Juguetería": ["Figura Acción", "Puzzle", "Auto Control Remoto"],
            "Computación": ["Mouse", "Teclado Mecánico", "Webcam", "Disco SSD"]
        }

        for i in range(CANTIDAD_A_GENERAR):
            # Seleccionar datos al azar
            cat_obj = random.choice(cats_objs)
            brand_obj = random.choice(marcas_objs)
            prov_obj = random.choice(provs_objs)

            # Generar nombre
            base_name = random.choice(sustantivos.get(cat_obj.name, ["Producto Genérico"]))
            adj = random.choice(adjetivos)
            nombre_final = f"{base_name} {brand_obj.name} {adj}"

            # Precios
            costo = random.randint(5, 500) * 1000
            margen = random.uniform(1.2, 1.6)
            precio = int(costo * margen)
            precio = round(precio / 10) * 10

            # Identificadores
            sku_suffix = ''.join(random.choices(string.ascii_uppercase + string.digits, k=4))
            sku = f"{cat_obj.name[:3].upper()}-{brand_obj.name[:3].upper()}-{sku_suffix}-{i}"
            ean = ''.join(random.choices(string.digits, k=13))

            # Crear producto (¡AHORA CON DUEÑO!)
            Product.objects.create(
                user=admin_user,  # <--- AQUÍ ESTÁ EL FIX
                nombre_comercial=nombre_final,
                brand=brand_obj,
                category=cat_obj,
                provider=prov_obj,
                ean=ean,
                sku=sku,
                peso=round(random.uniform(0.1, 25.0), 2),
                dimensiones=f"{random.randint(10,100)}x{random.randint(10,100)}x{random.randint(5,50)}",
                descripcion=f"Descripción generada automáticamente para {nombre_final}. Ideal para uso {adj.lower()}.",
                costo_cg=costo,
                precio_venta=precio,
                stock=random.randint(0, 150),
                lugar_bodega=f"Pasillo {random.choice(['A','B','C'])}-{random.randint(1,20)}",
                rating=round(random.uniform(1.0, 5.0), 1),
                edad_uso=f"{random.randint(3,18)}+ años"
            )

        self.stdout.write(self.style.SUCCESS(f"✅ ¡ÉXITO! Se crearon {CANTIDAD_A_GENERAR} productos listos para la demo."))
        self.stdout.write("--------------------------------------------------")
        self.stdout.write("🔑 Admin:    admin / admin123")
        self.stdout.write("🔑 Vendedor: vendedor / seller123")