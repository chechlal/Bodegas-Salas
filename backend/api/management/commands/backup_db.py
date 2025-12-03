from django.core.management.base import BaseCommand
import shutil
import datetime
import os
import boto3
from django.conf import settings
from django.db import connection

class Command(BaseCommand):
    help = 'Backups the database and uploads it to S3 if configured, or keeps it local.'

    def handle(self, *args, **kwargs):
        self.stdout.write("Starting backup...")

        # 1. Identify DB file (SQLite)
        # For Postgres, we would use pg_dump
        db_path = settings.DATABASES['default']['NAME']
        if settings.DATABASES['default']['ENGINE'] != 'django.db.backends.sqlite3':
             self.stdout.write(self.style.ERROR("Backup script currently supports SQLite only."))
             return

        timestamp = datetime.datetime.now().strftime("%Y%m%d_%H%M%S")
        backup_filename = f"db_backup_{timestamp}.sqlite3"
        backup_path = os.path.join(settings.BASE_DIR, "backups", backup_filename)

        # Ensure backups dir exists
        os.makedirs(os.path.join(settings.BASE_DIR, "backups"), exist_ok=True)

        # 2. Copy/Dump DB
        # For SQLite, a simple copy works if traffic is low, but better to use vacuum or similar.
        # Here we just copy.
        try:
            shutil.copy2(db_path, backup_path)
            self.stdout.write(self.style.SUCCESS(f"Local backup created at {backup_path}"))
        except Exception as e:
             self.stdout.write(self.style.ERROR(f"Error creating local backup: {e}"))
             return

        # 3. Upload to S3 if configured
        if getattr(settings, 'AWS_ACCESS_KEY_ID', None):
            self.stdout.write("Uploading to S3...")
            s3 = boto3.client(
                's3',
                aws_access_key_id=settings.AWS_ACCESS_KEY_ID,
                aws_secret_access_key=settings.AWS_SECRET_ACCESS_KEY
            )
            try:
                s3.upload_file(
                    backup_path,
                    settings.AWS_STORAGE_BUCKET_NAME,
                    f"backups/{backup_filename}"
                )
                self.stdout.write(self.style.SUCCESS(f"Backup uploaded to S3: backups/{backup_filename}"))
            except Exception as e:
                self.stdout.write(self.style.ERROR(f"Error uploading to S3: {e}"))
        else:
            self.stdout.write(self.style.WARNING("S3 credentials not found. Skipping S3 upload."))

        self.stdout.write(self.style.SUCCESS("Backup process completed."))
