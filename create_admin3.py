import os
import django
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'alumni_system.settings')
django.setup()

from accounts.models import User
from accounts.models import UserProfile

if not User.objects.filter(student_id='admin').exists():
    user = User.objects.create_superuser('admin', 'admin1234')
    UserProfile.objects.create(user=user, first_name='Admin', last_name='Supabase', email='admin@admin.com')
    print("Admin created!")
else:
    print("Admin already exists!")
