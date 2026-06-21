import os
import django
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'alumni_system.settings')
django.setup()

from posts.models import PostImage
from urllib.parse import unquote

img = PostImage.objects.first()
name = img.image.name
print("Code points of name:", [hex(ord(c)) for c in unquote(name)])
