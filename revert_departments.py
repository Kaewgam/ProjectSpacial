import os
import django
import sys
import re

sys.stdout.reconfigure(encoding='utf-8')
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'alumni_system.settings')
django.setup()

from accounts.models import Department

def run():
    depts = Department.objects.all()
    for d in depts:
        # If the name has the format "XX ... (YYY)"
        match = re.match(r'^[A-Z]+\s+(.*)\s+\(\d+\)$', d.name)
        if match:
            clean_name = match.group(1).strip()
            print(f"Reverting: {d.name} -> {clean_name}")
            d.name = clean_name
            d.save()
        else:
            print(f"No match for: {d.name}")

if __name__ == '__main__':
    run()
