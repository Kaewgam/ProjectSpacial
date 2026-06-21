import os
import django
import sys
import shutil

os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'alumni_system.settings')
django.setup()

from django.core.files import File
from urllib.parse import unquote
from posts.models import PostImage
from accounts.models import UserProfile, HallOfFame

def upload_images(qs, field_name):
    # Ensure local media path
    media_root = os.path.join(django.conf.settings.BASE_DIR, 'media')
    
    count = 0
    for obj in qs:
        file_field = getattr(obj, field_name)
        if not file_field:
            continue
            
        # The DB path might be URL-encoded, but we renamed the files to match unquoted
        db_path = unquote(file_field.name)
        full_path = os.path.join(media_root, os.path.normpath(db_path))
        
        if os.path.exists(full_path):
            try:
                print(f"Uploading {db_path} ...")
                with open(full_path, 'rb') as f:
                    file_obj = File(f)
                    # This will upload to Cloudinary and update the DB!
                    file_field.save(os.path.basename(full_path), file_obj, save=True)
                count += 1
            except Exception as e:
                print(f"Error uploading {db_path}: {e}")
        else:
            print(f"Local file not found for upload: {full_path}")
            
    return count

print("Starting Cloudinary upload...")
c1 = upload_images(PostImage.objects.all(), 'image')
c2 = upload_images(UserProfile.objects.all(), 'avatar')
c3 = upload_images(HallOfFame.objects.all(), 'image')

print(f"Done! Uploaded {c1} Post Images, {c2} Avatars, {c3} Hall of Fame images.")
