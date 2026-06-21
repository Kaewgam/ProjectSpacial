import os
import django
import re
import shutil

os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'alumni_system.settings')
django.setup()

from posts.models import PostImage
from accounts.models import UserProfile, HallOfFame

def strip_thai_vowels(text):
    # This strips exactly what Windows/zip stripped
    return re.sub(r'[\u0E31\u0E34-\u0E3A\u0E47-\u0E4E]', '', text)

def fix_image_files(qs, field_name):
    media_root = django.conf.settings.MEDIA_ROOT
    for obj in qs:
        file_field = getattr(obj, field_name)
        if not file_field:
            continue
            
        db_path = file_field.name # e.g. posts/images/ผลลัพธ์_1.jpg
        full_correct_path = os.path.join(media_root, os.path.normpath(db_path))
        
        # If it already exists correctly, skip
        if os.path.exists(full_correct_path):
            continue
            
        # Try to find the broken version
        basename = os.path.basename(db_path)
        dirname = os.path.dirname(full_correct_path)
        broken_basename = strip_thai_vowels(basename)
        broken_path = os.path.join(dirname, broken_basename)
        
        if os.path.exists(broken_path):
            os.rename(broken_path, full_correct_path)
            print(f"Fixed: {broken_basename} -> {basename}")
        else:
            print(f"Missing: {basename} (also tried {broken_basename})")

print("Fixing Post Images...")
fix_image_files(PostImage.objects.all(), 'image')

print("Fixing Avatars...")
fix_image_files(UserProfile.objects.all(), 'avatar')

print("Fixing Hall of Fame...")
fix_image_files(HallOfFame.objects.all(), 'image')

print("Done!")
