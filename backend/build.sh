#!/usr/bin/env bash
# exit on error
set -o errexit

pip install -r requirements.txt
python manage.py collectstatic --no-input
python manage.py migrate

if [[ "$EJECUTAR_SEED" == "DEMO" ]]; then
    echo "🔴 ALERTA: Ejecutando Reset de Fábrica (seed_demo)..."
    python manage.py seed_demo
elif [[ "$EJECUTAR_SEED" == "HISTORIA" ]]; then
    echo "🔮 ALERTA: Inyectando Historial Falso (seed_history)..."
    python manage.py seed_history
else
    echo "✅ Despliegue normal (Datos intactos)"
fi