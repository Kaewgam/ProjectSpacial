import os
import django

os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'alumni_system.settings')
django.setup()

from accounts.models import User, Department, Faculty

print("=== Departments ===")
for d in Department.objects.all():
    print(f"ID: {d.id} | Name: {d.name} | Short: {d.short_name} | Faculty: {d.faculty.name}")

print("\n=== Alumni Educations ===")
alumni = User.objects.filter(role='ALUMNI')
print(f"Total alumni: {alumni.count()}")
for u in alumni:
    edu = u.educations.first()
    if edu:
        d_name = edu.department_ref.name if edu.department_ref else "None"
        print(f"User: {u.student_id} | Dept: {d_name}")
