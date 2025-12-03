# Guía de Despliegue y Funcionalidad - Bodegas Salas PIM v4.0

Este documento detalla los pasos para desplegar el proyecto y explica las nuevas funcionalidades implementadas.

## 1. Requisitos Previos

*   Python 3.8+
*   Node.js 14+
*   Cuenta AWS S3 (Opcional, para almacenamiento en nube)

## 2. Instalación Local

### Backend

1.  Crear entorno virtual:
    ```bash
    python -m venv venv
    source venv/bin/activate  # Mac/Linux
    venv\Scripts\activate     # Windows
    ```
2.  Instalar dependencias:
    ```bash
    pip install -r requirements.txt
    ```
3.  Configurar Base de Datos:
    ```bash
    python backend/manage.py migrate
    ```
4.  Crear Usuarios de Prueba (Admin y Vendedor):
    ```bash
    python setup_users.py
    ```
    *   **Admin**: `admin` / `admin123`
    *   **Vendedor**: `vendedor` / `vendedor123`

### Frontend

1.  Navegar a la carpeta frontend:
    ```bash
    cd frontend
    ```
2.  Instalar dependencias:
    ```bash
    npm install
    ```

## 3. Ejecución

1.  **Backend**:
    ```bash
    python backend/manage.py runserver
    ```
2.  **Frontend**:
    ```bash
    npm start
    ```

## 4. Configuración S3 (Nube) - Para la Defensa

Para activar la subida de imágenes a Amazon S3 y demostrar el borrado automático:

1.  Crea un archivo `.env` en la raíz del proyecto (junto a `requirements.txt`).
2.  Agrega las siguientes variables con tus credenciales reales:

```env
AWS_ACCESS_KEY_ID=tu_access_key
AWS_SECRET_ACCESS_KEY=tu_secret_key
AWS_STORAGE_BUCKET_NAME=nombre_de_tu_bucket
AWS_S3_REGION_NAME=us-east-1
```

*Si este archivo existe y tiene valores, el sistema usará automáticamente S3. Si no, usará la carpeta local `media/`.*

**Demo de Borrado en S3:**
El sistema usa `django-cleanup`. Al borrar un producto desde el panel de Admin, la imagen asociada se elimina automáticamente del bucket S3.

## 5. Nuevas Funcionalidades

### A. Trazabilidad de Stock (Backend)
*   **Modelo `StockMovement`**: Registra Entradas, Salidas y Ajustes.
*   **Recálculo Automático**: El stock del producto no se edita directamente; se calcula sumando entradas y restando salidas.
*   **Validación**: No permite salidas si no hay suficiente stock.

### B. Roles y Seguridad
*   **Admin (`admin`)**:
    *   Acceso total al Dashboard (`/admin-productos`).
    *   Ve Costos, Proveedores y puede Editar/Eliminar.
    *   Puede registrar movimientos de stock.
*   **Vendedor (`vendedor`)**:
    *   Acceso restringido al Catálogo (`/catalogo`).
    *   **NO** ve costos ni proveedores.
    *   **NO** puede editar ni eliminar productos.
    *   Botón para copiar ficha técnica al portapapeles.

### C. Infraestructura
*   **Respaldo BD**: Comando `python backend/manage.py backup_db` crea un dump de la base de datos y (si está configurado) lo sube a la carpeta `backups/` en S3.

---
**Desarrollado para Bodegas Salas - Sprint Final**
