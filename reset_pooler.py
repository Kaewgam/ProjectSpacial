import os
import django
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'alumni_system.settings')
django.setup()

from django.db import connections

for _ in range(50):
    conn = connections['default']
    conn.close()
    with conn.cursor() as cursor:
        cursor.execute("RESET search_path;")
    conn.close()

print("Pooler sessions reset!")
