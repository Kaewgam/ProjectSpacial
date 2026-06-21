import os
import django
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'alumni_system.settings')
django.setup()

from posts.models import PostImage
from urllib.parse import unquote

for img in PostImage.objects.all()[:5]:
    print("DB value:", img.image.name)
    print("URL:", img.image.url)
    print("Decoded DB:", unquote(img.image.name))
