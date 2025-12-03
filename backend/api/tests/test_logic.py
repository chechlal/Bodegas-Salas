from django.test import TestCase
from django.contrib.auth import get_user_model
from rest_framework.test import APIClient
from rest_framework import status
from api.models import Product, Brand, Category, Provider, StockMovement

User = get_user_model()

class StockMovementTests(TestCase):
    def setUp(self):
        self.admin = User.objects.create_superuser('admin', 'admin@test.com', 'pass')
        self.seller = User.objects.create_user('seller', 'seller@test.com', 'pass')

        self.brand = Brand.objects.create(name="Brand A")
        self.category = Category.objects.create(name="Cat A")
        self.provider = Provider.objects.create(name="Prov A")

        self.product = Product.objects.create(
            nombre_comercial="Test Product",
            brand=self.brand,
            category=self.category,
            provider=self.provider,
            sku="SKU-001",
            ean="123",
            costo_cg=100,
            precio_venta=200,
            stock=0
        )

        self.client = APIClient()

    def test_stock_calculation(self):
        # 1. IN 10
        StockMovement.objects.create(
            product=self.product,
            quantity=10,
            movement_type='IN',
            user=self.admin,
            reason="Initial"
        )
        self.product.refresh_from_db()
        self.assertEqual(self.product.stock, 10)

        # 2. OUT 3
        StockMovement.objects.create(
            product=self.product,
            quantity=3,
            movement_type='OUT',
            user=self.admin,
            reason="Sale"
        )
        self.product.refresh_from_db()
        self.assertEqual(self.product.stock, 7)

        # 3. Fail OUT > Stock
        with self.assertRaises(ValueError):
             StockMovement.objects.create(
                product=self.product,
                quantity=100,
                movement_type='OUT',
                user=self.admin,
                reason="Fail"
            )

    def test_permissions(self):
        self.client.force_authenticate(user=self.seller)

        # Seller cannot see cost
        response = self.client.get(f'/api/products/{self.product.id}/')
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertNotIn('costo_cg', response.data)

        # Admin can see cost
        self.client.force_authenticate(user=self.admin)
        response = self.client.get(f'/api/products/{self.product.id}/')
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertIn('costo_cg', response.data)

    def test_stock_api(self):
        self.client.force_authenticate(user=self.admin)
        payload = {
            "product": self.product.id,
            "quantity": 5,
            "movement_type": "IN",
            "reason": "API Test"
        }
        response = self.client.post('/api/stock-movements/', payload)
        self.assertEqual(response.status_code, status.HTTP_201_CREATED)
        self.product.refresh_from_db()
        self.assertEqual(self.product.stock, 5)
