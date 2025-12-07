from django.core.management.base import BaseCommand
from django.conf import settings
import os
import shutil
import time
from datetime import datetime

class Command(BaseCommand):
    help = 'Respalda BD y Media (Detecta automáticamente si usar S3 Real o Simulación Local)'

    def handle(self, *args, **options):
        # 1. Configuración
        timestamp = datetime.now().strftime('%Y-%m-%d_%H-%M-%S')
        
        # Intentamos obtener credenciales
        AWS_ACCESS_KEY = os.environ.get('AWS_ACCESS_KEY_ID')
        AWS_SECRET_KEY = os.environ.get('AWS_SECRET_ACCESS_KEY')
        AWS_BUCKET_NAME = os.environ.get('AWS_STORAGE_BUCKET_NAME')
        
        # 2. Decisión de Modo
        USE_S3 = all([AWS_ACCESS_KEY, AWS_SECRET_KEY, AWS_BUCKET_NAME])
        
        mode_msg = "☁️  MODO CLOUD (AWS S3)" if USE_S3 else "💻 MODO SIMULACIÓN (Local Storage)"
        self.stdout.write(f"Iniciando Protocolo de Contingencia... [{mode_msg}]")
        time.sleep(1) # Efecto dramático para la demo

        # Directorios temporales
        temp_dir = os.path.join(settings.BASE_DIR, 'temp_backup')
        os.makedirs(temp_dir, exist_ok=True)
        
        # Directorio de simulación (Donde quedarán los archivos si no hay S3)
        sim_s3_dir = os.path.join(settings.BASE_DIR, 'simulated_s3_bucket')
        if not USE_S3:
            os.makedirs(sim_s3_dir, exist_ok=True)

        try:
            # --- A. PREPARAR BASE DE DATOS ---
            db_path = settings.DATABASES['default']['NAME']
            db_filename = f"db_{timestamp}.sqlite3"
            self.stdout.write(f'📦 Empaquetando Base de Datos: {db_filename}...')
            
            # --- B. PREPARAR MEDIA ---
            media_root = settings.MEDIA_ROOT
            zip_filename = f"media_{timestamp}.zip"
            archive_path = os.path.join(temp_dir, f"media_{timestamp}")
            
            if os.path.exists(media_root):
                self.stdout.write(f'📸 Comprimiendo archivos multimedia...')
                shutil.make_archive(archive_path, 'zip', media_root)
            
            time.sleep(1) 

            # --- C. TRANSMISIÓN (REAL O SIMULADA) ---
            if USE_S3:
                import boto3
                s3 = boto3.client('s3', aws_access_key_id=AWS_ACCESS_KEY, aws_secret_access_key=AWS_SECRET_KEY)
                
                self.stdout.write(f'🚀 Transmitiendo a AWS S3 ({AWS_BUCKET_NAME})...')
                s3.upload_file(str(db_path), AWS_BUCKET_NAME, f"backups/db/{db_filename}")
                if os.path.exists(media_root):
                    s3.upload_file(f"{archive_path}.zip", AWS_BUCKET_NAME, f"backups/media/{zip_filename}")
                    
                self.stdout.write(self.style.SUCCESS(f'✅ RESPALDO CLOUD COMPLETADO EXITOSAMENTE'))
            
            else:
                # SIMULACIÓN
                self.stdout.write(f'📡 Simulando conexión encriptada a S3...')
                time.sleep(2) # Simula tiempo de red
                
                # "Subir" a la carpeta simulada
                shutil.copy2(db_path, os.path.join(sim_s3_dir, db_filename))
                if os.path.exists(media_root):
                    shutil.copy2(f"{archive_path}.zip", os.path.join(sim_s3_dir, zip_filename))
                
                self.stdout.write(self.style.SUCCESS(f'✅ RESPALDO EXITOSO (Guardado en {sim_s3_dir})'))
                self.stdout.write(self.style.WARNING(f'ℹ️  Nota: Configure variables de entorno para activar subida real.'))

        except Exception as e:
            self.stdout.write(self.style.ERROR(f'❌ Error en protocolo: {str(e)}'))
        finally:
            if os.path.exists(temp_dir):
                shutil.rmtree(temp_dir)