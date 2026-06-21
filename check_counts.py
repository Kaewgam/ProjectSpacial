import os
import django
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'alumni_system.settings')
django.setup()

from accounts.models import Department, User, Faculty
from posts.models import Post

print("Users:", User.objects.count())
print("Departments:", Department.objects.count())
print("Faculties:", Faculty.objects.count())
print("Posts:", Post.objects.count())
