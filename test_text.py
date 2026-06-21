import os
import django
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'alumni_system.settings')
django.setup()

from posts.models import Post

for post in Post.objects.all()[:2]:
    print("Title:", repr(post.title))
    print("Content:", repr(post.content[:20]))
