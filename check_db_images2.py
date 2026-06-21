import os
import django
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'alumni_system.settings')
django.setup()

from posts.models import PostImage
from urllib.parse import unquote

print("--- Post Images ---")
for img in PostImage.objects.all()[:5]:
    print("URL:", img.image.url)
