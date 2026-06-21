import os
import django
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'alumni_system.settings')
django.setup()

from accounts.models import User

if not User.objects.filter(email='admin@admin.com').exists():
    user = User.objects.create_superuser('admin@admin.com', 'admin1234')
    user.first_name = 'Admin'
    user.last_name = 'Supabase'
    user.save()
    print("Admin created!")
else:
    print("Admin already exists!")
