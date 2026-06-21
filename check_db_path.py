import os
import django
import re
from urllib.parse import unquote

os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'alumni_system.settings')
django.setup()

from posts.models import PostImage

def strip_thai_vowels(text):
    return re.sub(r'[\u0E31\u0E34-\u0E3A\u0E47-\u0E4E]', '', text)

for img in PostImage.objects.all()[:2]:
    db_path = img.image.name
    # Unquote because Django might have saved the name url-encoded!
    db_path = unquote(db_path)
    basename = os.path.basename(db_path)
    broken_basename = strip_thai_vowels(basename)
    print("DB Name:", basename)
    print("Broken Name:", broken_basename)
