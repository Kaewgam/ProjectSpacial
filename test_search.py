import os
import django

os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'alumni_system.settings')
django.setup()

from django.test import Client

c = Client()
res = c.get('/api/alumni/search/', {'faculty': 'คณะวิทยาศาสตร์และเทคโนโลยี', 'department': 'วิทยาการคอมพิวเตอร์'})
print("Status code:", res.status_code)
data = res.json()
print("Total found:", data.get('total'))
for user in data.get('results', []):
    print("Found user:", user.get('student_id'))

