import os
import django
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'alumni_system.settings')
django.setup()

from posts.models import PostImage
from accounts.models import UserProfile

print("--- Post Images ---")
for img in PostImage.objects.all()[:5]:
    print(img.image.url if img.image else "No image")

print("--- User Avatars ---")
for p in UserProfile.objects.all()[:5]:
    print(p.avatar.url if p.avatar else "No avatar")
