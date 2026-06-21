import os
import django
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'alumni_system.settings')
django.setup()

from posts.models import PostImage

for img in PostImage.objects.all()[:5]:
    print(repr(img.image.name))
