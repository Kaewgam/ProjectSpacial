import os
import django
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'alumni_system.settings')
django.setup()

from django.db import connection

with connection.cursor() as cursor:
    cursor.execute("SELECT table_schema, table_name FROM information_schema.tables WHERE table_name LIKE 'accounts%';")
    tables = cursor.fetchall()
    print("Tables:", tables)
