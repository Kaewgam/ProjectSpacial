import os
import django
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'alumni_system.settings')
django.setup()

from django.conf import settings
print("Current DB:", settings.DATABASES['default']['NAME'])
print("Current Host:", settings.DATABASES['default']['HOST'])

from accounts.models import User
print("Users:", User.objects.count())
