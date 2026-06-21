import os
import django
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'alumni_system.settings')
django.setup()

from posts.models import PostImage

img = PostImage.objects.first()
print("DB name:", img.image.name)
