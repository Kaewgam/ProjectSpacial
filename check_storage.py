import os
import django
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'alumni_system.settings')
django.setup()

from posts.models import PostImage
from django.core.files.storage import default_storage

img = PostImage.objects.first()
print("Storage class:", type(img.image.storage))
print("Default storage:", type(default_storage))
print("Image name:", img.image.name)
print("Image url:", img.image.url)
