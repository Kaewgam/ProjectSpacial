import os
import django

os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'alumni_system.settings')
django.setup()

from posts.models import Post

count = Post.objects.filter(category='โอกาสงาน').update(category='ประกาศสมัครงาน')
print(f"Updated {count} posts.")
