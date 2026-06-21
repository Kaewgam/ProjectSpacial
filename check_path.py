import os
import django
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'alumni_system.settings')
django.setup()

from django.db import connection

with connection.cursor() as cursor:
    cursor.execute("SHOW search_path;")
    print("Search Path:", cursor.fetchone())
    cursor.execute("SELECT table_schema, table_name FROM information_schema.tables WHERE table_name = 'accounts_user';")
    print("Tables:", cursor.fetchall())
    try:
        cursor.execute('SELECT COUNT(*) FROM "accounts_user";')
        print("Count with quotes:", cursor.fetchone())
    except Exception as e:
        print("Error with quotes:", e)
