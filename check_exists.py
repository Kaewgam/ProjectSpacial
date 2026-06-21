import os
import django
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'alumni_system.settings')
django.setup()

from posts.models import PostImage
from urllib.parse import unquote

img = PostImage.objects.first()
db_path = unquote(img.image.name)
media_root = django.conf.settings.MEDIA_ROOT
full_path = os.path.join(media_root, os.path.normpath(db_path))

print("Checking:", full_path)
print("Exists?", os.path.exists(full_path))
