from django.core.management.base import BaseCommand
from django.contrib.auth.models import User
from django.conf import settings
from django.core.files.base import ContentFile

from companies.models import Company, UserProfile
from api.models import (
    Product, Brand, Category, Provider, ProductImage, StockMovement
)

import os
import shutil
import random
import requests
import time


# ===============================
# CONFIGURACIÓN DEL SEED
# ===============================

TOTAL_PRODUCTS = 50
MIN_IMAGES = 2
MAX_IMAGES = 5
REQUEST_TIMEOUT = 6  # segundos
PAUSE_BETWEEN_IMAGES = 0.15  # segundos


# ===============================
# MODELOS HISTÓRICOS (SI EXISTEN)
# ===============================
def import_historical_models():
    """
    Importa de forma segura los modelos Historical.
    Si algún modelo no existe, se ignora.
    """
    historical_models = []
    try:
        from api.models import HistoricalProduct
        historical_models.append(HistoricalProduct)
    except:
        pass

    try:
        from api.models import HistoricalProductImage
        historical_models.append(HistoricalProductImage)
    except:
        pass

    try:
        from api.models import HistoricalBrand
        historical_models.append(HistoricalBrand)
    except:
        pass

    try:
        from api.models import HistoricalCategory
        historical_models.append(HistoricalCategory)
    except:
        pass

    try:
        from api.models import HistoricalProvider
        historical_models.append(HistoricalProvider)
    except:
        pass

    try:
        from api.models import HistoricalStockMovement
        historical_models.append(HistoricalStockMovement)
    except:
        pass

    return historical_models


# ===============================
# SEED PRINCIPAL
# ===============================

class Command(BaseCommand):
    help = "Genera datos demo estables con imágenes múltiples por producto."

    def handle(self, *args, **kwargs):

        self.stdout.write(self.style.WARNING("⚠️ INICIANDO SEED DEMO ESTABLE…"))

        # ===================================================
        # 1) LIMPIAR CARPETA MEDIA/product_images
        # ===================================================
        product_img_dir = os.path.join(settings.MEDIA_ROOT, "product_images")
        try:
            if os.path.exists(product_img_dir):
                shutil.rmtree(product_img_dir)
                self.stdout.write("🗑️  Eliminada carpeta product_images/")

            os.makedirs(product_img_dir, exist_ok=True)
            self.stdout.write("✨ product_images/ recreada")
        except Exception as e:
            self.stdout.write(self.style.ERROR(f"Error limpiando product_images: {e}"))

        # ===================================================
        # 2) LIMPIAR TABLAS + HISTORIAL
        # ===================================================
        self.stdout.write("🧹 Limpiando tablas principales…")

        StockMovement.objects.all().delete()
        ProductImage.objects.all().delete()
        Product.objects.all().delete()
        Brand.objects.all().delete()
        Category.objects.all().delete()
        Provider.objects.all().delete()

        # HISTORIALES
        self.stdout.write("🧹 Borrando historial…")
        for model in import_historical_models():
            try:
                model.objects.all().delete()
                self.stdout.write(f"  - Historial {model.__name__} borrado")
            except:
                pass

        # ===================================================
        # 3) COMPANY + USERS
        # ===================================================
        self.stdout.write("🏭 Creando company + usuarios…")

        company = Company.objects.create(name="Bodegas Salas Ltda", rut="76.123.456-K")

        # Admin
        admin, _ = User.objects.get_or_create(username="admin")
        admin.set_password("admin123")
        admin.is_superuser = True
        admin.is_staff = True
        admin.save()
        UserProfile.objects.update_or_create(
            user=admin,
            defaults={"company": company, "role": "ADMIN", "phone": "+5699999999"},
        )

        # Vendedor
        seller, _ = User.objects.get_or_create(username="vendedor")
        seller.set_password("seller123")
        seller.is_staff = False
        seller.save()
        UserProfile.objects.update_or_create(
            user=seller,
            defaults={"company": company, "role": "SELLER", "phone": "+5698888888"},
        )

        # ===================================================
        # 4) MARCAS - CATEGORÍAS - PROVIDERS
        # ===================================================
        brands = ["Makita", "Bosch", "Stanley", "Samsung", "Lenovo", "LG", "HP", "GenPro"]
        brand_objs = [Brand.objects.create(name=b) for b in brands]

        categories_data = ["Herramientas", "Electrónica", "Hogar", "Computación"]
        cat_objs = [Category.objects.create(name=c) for c in categories_data]

        providers = ["Sodimac Pro", "Ingram Micro", "AliExpress", "Distribuidora Chile"]
        provider_objs = [Provider.objects.create(name=p) for p in providers]

        # ===================================================
        # 5) NOMBRES BASE POR CATEGORÍA
        # ===================================================
        base_names = {
            "Herramientas": [
                "Taladro Percutor", "Sierra Circular", "Martillo Pro",
                "Atornillador Inalámbrico", "Esmeril Angular"
            ],
            "Electrónica": [
                "Smart TV 4K", "Barra de Sonido", "Parlante Bluetooth",
                "Monitor LED", "Audífonos Inalámbricos"
            ],
            "Hogar": [
                "Refrigerador", "Lavadora", "Aspiradora", "Microondas",
                "Calefactor Eléctrico"
            ],
            "Computación": [
                "Notebook", "Teclado Mecánico", "Mouse Gamer",
                "Router WiFi 6", "SSD NVMe"
            ],
        }

        # ===================================================
        # 6) SEMILLA DE PRODUCTOS
        # ===================================================

        self.stdout.write(f"🚀 Creando {TOTAL_PRODUCTS} productos con imágenes…")

        start_time = time.time()

        for i in range(TOTAL_PRODUCTS):
            # Elegir categoría
            cat = random.choice(cat_objs)
            bname = random.choice(base_names[cat.name])
            variant = random.choice(["Pro", "X", "Ultra", "Lite", "Max"])
            full_name = f"{bname} {variant}"

            # Crear producto
            product = Product.objects.create(
                user=admin,
                nombre_comercial=full_name,
                brand=random.choice(brand_objs),
                ean=f"780{random.randint(10000000, 99999999)}",
                sku=f"SKU-{1000+i}",
                category=cat,
                peso=random.randint(1, 25),
                dimensiones=f"{random.randint(10,60)}x{random.randint(10,60)}x{random.randint(5,40)}",
                descripcion=f"Producto de alta calidad ({full_name}).",
                costo_cg=random.randint(5000, 90000),
                provider=random.choice(provider_objs),
                stock=random.randint(5, 150),
                precio_venta=random.randint(20000, 300000),
                lugar_bodega=f"Pasillo {random.choice(['A','B','C'])}",
            )

            # -------------------------------
            # DESCARGAR 2 a 5 IMÁGENES
            # -------------------------------
            n_images = random.randint(MIN_IMAGES, MAX_IMAGES)
            created_images = 0

            for img_index in range(n_images):

                # Picsum → estable, siempre responde
                seed = f"{product.sku}-{img_index}"
                url = f"https://picsum.photos/seed/{seed}/800/800"

                try:
                    resp = requests.get(url, timeout=REQUEST_TIMEOUT)
                    if resp.status_code == 200:
                        fname = f"{product.sku}_{img_index}.jpg"
                        ProductImage.objects.create(
                            product=product,
                            image=ContentFile(resp.content, name=fname),
                            is_principal=(img_index == 0),
                        )
                        created_images += 1
                        time.sleep(PAUSE_BETWEEN_IMAGES)
                    else:
                        self.stdout.write(self.style.WARNING(f"Imagen no disponible: {resp.status_code}"))
                except Exception as e:
                    self.stdout.write(self.style.WARNING(f"Fallo descarga imagen: {e}"))
                    continue

            # Fallback: si algo raro pasó y no hay imágenes
            if created_images == 0:
                fallback = f"https://picsum.photos/seed/{product.sku}-fallback/800/800"
                resp = requests.get(fallback, timeout=REQUEST_TIMEOUT)
                if resp.status_code == 200:
                    ProductImage.objects.create(
                        product=product,
                        image=ContentFile(resp.content, name=f"{product.sku}_fallback.jpg"),
                        is_principal=True,
                    )

        # ===============================
        # FIN
        # ===============================

        elapsed = time.time() - start_time
        self.stdout.write(self.style.SUCCESS(f"✅ SEED COMPLETADO en {elapsed:.2f}s"))
        self.stdout.write("Cada producto tiene entre 2 y 5 imágenes descargadas de Picsum.")
        self.stdout.write("--------------------------------------------------------------")