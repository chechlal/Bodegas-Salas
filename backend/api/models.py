from django.db import models
from simple_history.models import HistoricalRecords # type: ignore
from django.utils.translation import gettext_lazy as _
from django.core.validators import MinValueValidator, MaxValueValidator

class Brand(models.Model):
    name = models.CharField(max_length=100, unique=True, verbose_name=_("Nombre de la Marca"))
    history = HistoricalRecords()

    def __str__(self):
        return self.name

    class Meta:
        verbose_name = _("Marca")
        verbose_name_plural = _("Marcas")
        ordering = ['name']

class Category(models.Model):
    name = models.CharField(max_length=100, unique=True, verbose_name=_("Nombre de la Categoría"))
    history = HistoricalRecords()

    def __str__(self):
        return self.name

    class Meta:
        verbose_name = _("Categoría")
        verbose_name_plural = _("Categorías")
        ordering = ['name']

class Provider(models.Model):
    name = models.CharField(max_length=200, unique=True, verbose_name=_("Nombre del Proveedor"))
    history = HistoricalRecords()

    def __str__(self):
        return self.name

    class Meta:
        verbose_name = _("Proveedor")
        verbose_name_plural = _("Proveedores")
        ordering = ['name']

class Product(models.Model):
    nombre_comercial = models.CharField(max_length=255, verbose_name=_("Nombre Comercial"))
    brand = models.ForeignKey(Brand, on_delete=models.PROTECT, verbose_name=_("Marca"))
    ean = models.CharField(max_length=13, unique=True, verbose_name=_("EAN"))
    sku = models.CharField(max_length=50, unique=True, verbose_name=_("SKU"))
    category = models.ForeignKey(Category, on_delete=models.PROTECT, verbose_name=_("Categoría"))
    peso = models.DecimalField(max_digits=10, decimal_places=2, verbose_name=_("Peso (kg)"), validators=[MinValueValidator(0.0)], default=0.0)
    dimensiones = models.CharField(max_length=100, verbose_name=_("Dimensiones (cm)"), help_text=_("Formato: alto x largo x ancho"))
    descripcion = models.TextField(verbose_name=_("Descripción"))
    costo_cg = models.DecimalField(max_digits=15, decimal_places=0, verbose_name=_("Costo CG (CLP)"), validators=[MinValueValidator(0)])
    lugar_bodega = models.CharField(max_length=50, verbose_name=_("Lugar en Bodega"))
    edad_uso = models.CharField(max_length=50, blank=True, null=True, verbose_name=_("Edad de Uso"), help_text=_("Ej: 12+ años"))
    provider = models.ForeignKey(Provider, on_delete=models.PROTECT, verbose_name=_("Proveedor"))
    stock = models.PositiveIntegerField(default=0, verbose_name=_("Stock"))
    precio_venta = models.DecimalField(max_digits=15, decimal_places=0, verbose_name=_("Precio de Venta (CLP)"), validators=[MinValueValidator(0)])
    rating = models.DecimalField(max_digits=3, decimal_places=1, default=0.0, verbose_name=_("Rating"), validators=[MinValueValidator(0), MaxValueValidator(5)])
    created_at = models.DateTimeField(auto_now_add=True, verbose_name=_("Creado en"))
    updated_at = models.DateTimeField(auto_now=True, verbose_name=_("Actualizado en"))

    history = HistoricalRecords()

    def __str__(self):
        return f"{self.nombre_comercial} ({self.sku})"

    def formatted_precio_venta(self):
        return f"{self.precio_venta:,} CLP".replace(",", ".")

    class Meta:
        verbose_name = _("Producto")
        verbose_name_plural = _("Productos")
        ordering = ['nombre_comercial']
        indexes = [
            models.Index(fields=['ean']),
            models.Index(fields=['sku']),
        ]

class ProductImage(models.Model):
    product = models.ForeignKey(Product, on_delete=models.CASCADE, related_name='images', verbose_name=_("Producto"))
    image = models.ImageField(upload_to='product_images/', verbose_name=_("Imagen"))
    is_principal = models.BooleanField(default=False, verbose_name=_("Es Principal"))

    history = HistoricalRecords()

    def __str__(self):
        return f"Imagen de {self.product.nombre_comercial} ({'Principal' if self.is_principal else 'Adicional'})"

    class Meta:
        verbose_name = _("Imagen de Producto")
        verbose_name_plural = _("Imágenes de Productos")