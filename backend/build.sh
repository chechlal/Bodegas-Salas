#!/usr/bin/env bash
# exit on error
set -o errexit

pip install -r requirements.txt
python manage.py collectstatic --no-input
python manage.py migrate

if [[ "$EJECUTAR_SEED" == "DEMO" ]]; then
    # Solo resetea la fábrica (Datos limpios, sin historia)
    echo "🔴 ALERTA: Ejecutando SOLO Reset de Fábrica..."
    python manage.py seed_demo

elif [[ "$EJECUTAR_SEED" == "HISTORIA" ]]; then
    # Solo agrega historia (Asume que ya hay productos)
    echo "🔮 ALERTA: Inyectando SOLO Historial..."
    python manage.py seed_history

elif [[ "$EJECUTAR_SEED" == "COMPLETO" ]]; then
    # ¡LA OPCIÓN QUE QUIERES! Resetea Y agrega historia
    echo "🚀 ALERTA: Ejecutando REINICIO TOTAL CON HISTORIA..."
    python manage.py seed_demo      # Primero crea los productos
    python manage.py seed_history   # Luego les inventa ventas

else
    echo "✅ Despliegue normal (Datos intactos)"
fi