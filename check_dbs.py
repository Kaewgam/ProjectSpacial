import os
import django
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'alumni_system.settings')
django.setup()

from django.db import connection

with connection.cursor() as cursor:
    cursor.execute("SELECT datname FROM pg_database;")
    dbs = cursor.fetchall()
    print("Databases:", [db[0] for db in dbs])
