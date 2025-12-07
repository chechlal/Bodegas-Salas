from django.core.management.base import BaseCommand
from django.contrib.auth.models import User
from companies.models import Company, UserProfile
from api.models import Product, Brand, Category, Provider, ProductImage, StockMovement
import random
import os
import shutil
from django.conf import settings
from django.core.files.base import ContentFile
import requests

class Command(BaseCommand):
    help = 'Genera datos de prueba completos con limpieza profunda e imágenes reales.'

    def handle(self, *args, **kwargs):
        self.stdout.write(self.style.WARNING('⚠️ INICIANDO REINICIO DE FÁBRICA...'))

        # 1. LIMPIEZA DE ARCHIVOS MEDIA
        media_root = settings.MEDIA_ROOT
        try:
            if os.path.exists(media_root):
                shutil.rmtree(media_root)
                self.stdout.write('🗑️  Carpeta Media eliminada.')
            os.makedirs(media_root, exist_ok=True)
            self.stdout.write('✨ Carpeta Media recreada limpia.')
        except Exception as e:
            self.stdout.write(self.style.ERROR(f'Error limpiando media: {e}'))

        # 2. LIMPIEZA DE BASE DE DATOS
        self.stdout.write('🧹 Limpiando tablas de BD...')
        
        # A. Borrar datos vivos (Orden estricto para evitar ProtectedError)
        StockMovement.objects.all().delete()
        ProductImage.objects.all().delete()
        
        # Importante: Borrado físico aunque tengamos soft-delete en las vistas
        Product.objects.all().delete() 
        
        Brand.objects.all().delete()
        Category.objects.all().delete()
        Provider.objects.all().delete()
        
        # B. LIMPIEZA NUCLEAR DE HISTORIAL (Aquí está la clave de tu error)
        self.stdout.write('🧹 Purgando historial forense...')
        from api.models import HistoricalProduct, HistoricalBrand, HistoricalCategory, HistoricalProvider, HistoricalProductImage
        
        HistoricalStockMovement.objects.all().delete() if hasattr(StockMovement, 'history') else None
        HistoricalProductImage.objects.all().delete()
        HistoricalProduct.objects.all().delete()
        HistoricalBrand.objects.all().delete()
        HistoricalCategory.objects.all().delete()
        HistoricalProvider.objects.all().delete()
        
        # Limpiar perfiles
        UserProfile.objects.all().delete()
        Company.objects.all().delete()
        
        self.stdout.write('✅ Base de datos tabula rasa (completamente vacía).')

        # 3. CREACIÓN / RECICLAJE DE ACTORES
        self.stdout.write('🏭 Creando Empresa y Usuarios...')
        company = Company.objects.create(name="Bodegas Salas Ltda", rut="76.123.456-K")

        # --- ADMIN (Reciclaje Inteligente) ---
        if User.objects.filter(username='admin').exists():
            admin = User.objects.get(username='admin')
            admin.set_password('admin123')
            admin.first_name = "Juan"
            admin.last_name = "Soto"
            # Aseguramos privilegios de Superusuario aunque ya exista
            admin.is_staff = True
            admin.is_superuser = True
            admin.save()
            self.stdout.write('♻️  Usuario admin existente reciclado (Elevado a Superuser).')
        else:
            # USAMOS create_superuser EN LUGAR DE create_user
            admin = User.objects.create_superuser('admin', 'admin@demo.cl', 'admin123')
            admin.first_name = "Juan"
            admin.last_name = "Soto"
            admin.save()
            self.stdout.write('👤 Superusuario admin creado.')

        # Usamos update_or_create para evitar errores si el perfil ya existe
        UserProfile.objects.update_or_create(
            user=admin,
            defaults={'company': company, 'role': 'ADMIN', 'phone': '+5699999999'}
        )

        # --- VENDEDOR (Reciclaje Inteligente) ---
        if User.objects.filter(username='vendedor').exists():
            seller = User.objects.get(username='vendedor')
            seller.set_password('seller123')
            seller.first_name = "María"
            seller.last_name = "Pérez"
            seller.save()
            self.stdout.write('♻️  Usuario vendedor existente reciclado.')
        else:
            seller = User.objects.create_user('vendedor', 'vendedor@demo.cl', 'seller123')
            seller.first_name = "María"
            seller.last_name = "Pérez"
            seller.save()
            self.stdout.write('👤 Usuario vendedor creado.')

        UserProfile.objects.update_or_create(
            user=seller,
            defaults={'company': company, 'role': 'SELLER', 'phone': '+5698888888'}
        )

        # 4. DATOS MAESTROS (MARCAS, CATS)
        brands = ['Makita', 'Bosch', 'Stanley', 'Samsung', 'LG', 'Lenovo', 'HP', 'Generico']
        brands_objs = [Brand.objects.get_or_create(name=b)[0] for b in brands]

        cats_data = [
            ('Herramientas', '7d4e57'), 
            ('Electrónica', '364f6b'), 
            ('Hogar', '3fc1c9'), 
            ('Computación', 'fc5185')
        ]
        cats_objs = []
        for name, color in cats_data:
            cat, _ = Category.objects.get_or_create(name=name)
            cats_objs.append(cat)

        providers = [Provider.objects.get_or_create(name=p)[0] for p in ['Sodimac Pro', 'Ingram Micro', 'AliExpress']]

        # 5. GENERACIÓN DE PRODUCTOS
        self.stdout.write('🚀 Generando 50 productos con imágenes...')
        
        products_data = [
            ('Taladro Percutor', 'Herramientas'), ('Sierra Circular', 'Herramientas'), ('Martillo', 'Herramientas'),
            ('Smart TV 55"', 'Electrónica'), ('Refrigerador', 'Hogar'), ('Notebook Gamer', 'Computación'),
            ('Mouse Inalámbrico', 'Computación'), ('Lavadora 10kg', 'Hogar'), ('Microondas', 'Hogar')
        ]

        for i in range(50):
            base_prod = random.choice(products_data)
            p_name = f"{base_prod[0]} {random.choice(['Pro', 'X', 'Ultra', 'Lite'])}"
            
            cat_obj = next((c for c in cats_objs if c.name == base_prod[1]), cats_objs[0])
            color_hex = next((c[1] for c in cats_data if c[0] == cat_obj.name), 'ccc')
            img_url = f"https://dummyimage.com/400x400/{color_hex}/fff&text={p_name.replace(' ', '+')}"

            prod = Product.objects.create(
                user=admin,
                nombre_comercial=p_name,
                brand=random.choice(brands_objs),
                ean=f"780{random.randint(100000000, 999999999)}",
                sku=f"SKU-{1000+i}",
                category=cat_obj,
                peso=random.randint(1, 20),
                dimensiones="30x20x10",
                descripcion=f"Descripción profesional del producto {p_name}. Ideal para uso intensivo.",
                costo_cg=random.randint(5000, 100000),
                provider=random.choice(providers),
                stock=random.randint(5, 100),
                precio_venta=random.randint(15000, 200000),
                lugar_bodega=f"Pasillo {random.choice(['A','B'])}"
            )

            try:
                response = requests.get(img_url, timeout=5)
                if response.status_code == 200:
                    ProductImage.objects.create(
                        product=prod,
                        image=ContentFile(response.content, name=f"prod_{i}.jpg"),
                        is_principal=True
                    )
            except Exception as e:
                self.stdout.write(self.style.WARNING(f"No se pudo descargar imagen para {p_name}: {e}"))

        self.stdout.write(self.style.SUCCESS('✅ ¡DEMO CARGADA! Historial limpio e imágenes generadas.'))
        self.stdout.write(f'--------------------------------------------------')