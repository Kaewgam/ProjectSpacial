import os
import django
import sys

os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'alumni_system.settings')
django.setup()

from django.core.files import File
from urllib.parse import unquote
from accounts.models import UserCertificate

def upload_certificates():
    media_root = os.path.join(django.conf.settings.BASE_DIR, 'media')
    count = 0
    
    qs = UserCertificate.objects.all()
    for obj in qs:
        file_field = obj.image
        if not file_field:
            continue
            
        db_path = unquote(file_field.name)
        full_path = os.path.join(media_root, os.path.normpath(db_path))
        
        if os.path.exists(full_path):
            try:
                print(f"Uploading {db_path} ...")
                with open(full_path, 'rb') as f:
                    file_obj = File(f)
                    file_field.save(os.path.basename(full_path), file_obj, save=True)
                count += 1
            except Exception as e:
                print(f"Error uploading {db_path}: {e}")
        else:
            print(f"Local file not found for upload: {full_path}")
            
    return count

if __name__ == "__main__":
    print("Starting Cloudinary upload for Certificates...")
    c = upload_certificates()
    print(f"Done! Uploaded {c} Certificate Images.")
