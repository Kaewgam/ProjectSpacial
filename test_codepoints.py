import os
import django
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'alumni_system.settings')
django.setup()

from posts.models import Post

post = Post.objects.first()
print("Code points:", [hex(ord(c)) for c in post.title])
