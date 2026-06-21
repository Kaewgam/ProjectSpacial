import os
import django
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'alumni_system.settings')
django.setup()

from django.db import connection

with connection.cursor() as cursor:
    cursor.execute("ALTER DATABASE postgres SET search_path TO public;")
    cursor.execute("ALTER USER postgres SET search_path TO public;")
    print("Fixed search_path!")
