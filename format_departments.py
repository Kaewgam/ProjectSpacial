import os
import django
import sys

sys.stdout.reconfigure(encoding='utf-8')
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'alumni_system.settings')
django.setup()

from accounts.models import Department

def run():
    depts = Department.objects.all()
    for d in depts:
        # Avoid double-adding if it already contains the code
        if f"({d.id})" not in d.name and d.short_name:
            new_name = f"{d.short_name} {d.name} ({d.id})"
            print(f"Updating: {d.name} -> {new_name}")
            d.name = new_name
            d.save()
        else:
            print(f"Skipping: {d.name}")

if __name__ == '__main__':
    run()
