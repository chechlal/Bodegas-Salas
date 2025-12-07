from django.core.management.base import BaseCommand
from django.contrib.auth.models import User
from companies.models import Company, UserProfile
from api.models import Product, Brand, Category, Provider, ProductImage, StockMovement
import random
from django.core.files.base import ContentFile
import requests

class Command(BaseCommand):
    help = 'Genera datos de prueba completos con imágenes simuladas para la demo'

    def handle(self, *args, **kwargs):
        self.stdout.write(self.style.WARNING('🧹 Limpiando base de datos completa...'))
        
        # 1. Borrar datos antiguos en orden para respetar claves foráneas
        StockMovement.objects.all().delete()
        ProductImage.objects.all().delete()
        Product.objects.all().delete()
        Brand.objects.all().delete()
        Category.objects.all().delete()
        Provider.objects.all().delete()
        UserProfile.objects.all().delete()
        User.objects.exclude(is_superuser=True).delete() # Mantener superusuario si existe
        Company.objects.all().delete()

        # 2. Crear Empresa y Usuarios
        self.stdout.write('🏭 Creando Empresa y Actores...')
        company = Company.objects.create(name="Bodegas Salas Ltda", rut="76.123.456-K")

        # Admin
        admin_user = User.objects.create_user('admin', 'admin@bodegassalas.cl', 'admin123')
        admin_user.first_name = "Juan"
        admin_user.last_name = "Soto"
        admin_user.save()
        UserProfile.objects.filter(user=admin_user).update(company=company, role='ADMIN', phone='+56911111111')

        # Vendedor
        seller_user = User.objects.create_user('vendedor', 'vendedor@bodegassalas.cl', 'seller123')
        seller_user.first_name = "María"
        seller_user.last_name = "Pérez"
        seller_user.save()
        UserProfile.objects.filter(user=seller_user).update(company=company, role='SELLER', phone='+56922222222')

        # 3. Crear Maestros
        self.stdout.write('📦 Creando Marcas, Categorías y Proveedores...')
        
        brands_list = ['Samsung', 'LG', 'Sony', 'Bosch', 'Makita', 'Stanley', 'Lenovo', 'HP', 'Generico']
        brands_db = [Brand.objects.create(name=b) for b in brands_list]

        cats_list = [
            ('Electrónica', '300x300/000/fff?text=Electro'), 
            ('Herramientas', '300x300/550/fff?text=Tool'), 
            ('Hogar', '300x300/282/fff?text=Home'), 
            ('Computación', '300x300/007/fff?text=PC')
        ]
        cats_db = []
        for c_name, c_img in cats_list:
            cats_db.append(Category.objects.create(name=c_name))

        provs_list = ['TecnoGlobal', 'Intcomex', 'Sodimac Pro', 'Importadora Asia']
        provs_db = [Provider.objects.create(name=p) for p in provs_list]

        # 4. Crear Productos
        self.stdout.write('🚀 Generando 50 productos con imágenes...')
        
        adjetivos = ['Pro', 'Ultra', 'Plus', 'Básico', 'Industrial', 'Home']
        sustantivos = ['Taladro', 'Monitor', 'Notebook', 'Refrigerador', 'Lavadora', 'Sierra', 'Martillo', 'Televisor', 'Mouse', 'Teclado']

        for i in range(50):
            nombre = f"{random.choice(sustantivos)} {random.choice(brands_list)} {random.choice(adjetivos)}"
            cat_idx = random.randint(0, len(cats_db)-1)
            category = cats_db[cat_idx]
            
            # Generar URL de imagen dummy según categoría para dar color
            img_url = f"https://dummyimage.com/{cats_list[cat_idx][1]}"

            prod = Product.objects.create(
                user=admin_user,
                nombre_comercial=nombre,
                brand=random.choice(brands_db),
                ean=f"780{random.randint(100000000, 999999999)}",
                sku=f"SKU-{1000+i}",
                category=category,
                peso=random.randint(1, 50),
                dimensiones=f"{random.randint(10,100)}x{random.randint(10,100)}x{random.randint(10,100)}",
                descripcion=f"Producto de alta calidad {nombre}. Ideal para uso intensivo. Garantía 1 año.",
                costo_cg=random.randint(5000, 500000),
                lugar_bodega=f"Pasillo {random.choice(['A','B','C'])}-{random.randint(1,20)}",
                provider=random.choice(provs_db),
                stock=random.randint(0, 100),
                precio_venta=random.randint(10000, 900000),
                rating=round(random.uniform(3.0, 5.0), 1)
            )

            # Descargar y guardar imagen
            try:
                img_resp = requests.get(img_url)
                if img_resp.status_code == 200:
                    img_name = f"prod_{i}.jpg"
                    ProductImage.objects.create(
                        product=prod,
                        image=ContentFile(img_resp.content, name=img_name),
                        is_principal=True
                    )
            except Exception as e:
                self.stdout.write(self.style.ERROR(f'Error imagen prod {i}: {e}'))

        self.stdout.write(self.style.SUCCESS(f'✅ ¡ÉXITO! Se crearon 50 productos listos y coloridos.'))
        self.stdout.write(f'--------------------------------------------------')
        self.stdout.write(f'🔑 Admin:    admin / admin123')
        self.stdout.write(f'🔑 Vendedor: vendedor / seller123')