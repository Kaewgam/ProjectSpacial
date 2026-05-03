import os, django
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'alumni_system.settings')
django.setup()

from accounts.models import User, Faculty, Department
from django.db.models import Count

print("=" * 55)
print("   Migration Check Report")
print("=" * 55)

total = User.objects.count()
print(f"\nUsers ทั้งหมด: {total}")

# ── ตรวจ FK ──
has_faculty_fk  = User.objects.filter(faculty_ref__isnull=False).count()
has_dept_fk     = User.objects.filter(department_ref__isnull=False).count()
missing_fac_fk  = User.objects.filter(faculty_ref__isnull=True).count()
missing_dept_fk = User.objects.filter(department_ref__isnull=True).count()

print(f"\n[OK]  มี faculty_ref FK   : {has_faculty_fk}")
print(f"[OK]  มี department_ref FK: {has_dept_fk}")
print(f"[WARN] ไม่มี faculty_ref  : {missing_fac_fk}")
print(f"[WARN] ไม่มี department_ref: {missing_dept_fk}")

# ── Faculty & Department ──
fac_count  = Faculty.objects.count()
dept_count = Department.objects.count()
print(f"\nFaculty ในระบบ   : {fac_count}")
print(f"Department ในระบบ: {dept_count}")

# ── Roles ──
role_counts = User.objects.values('role').annotate(count=Count('id'))
print("\nจำนวนตาม Role:")
for r in role_counts:
    print(f"   {r['role']}: {r['count']}")

# ── Users ที่ยังไม่มี FK ──
no_fac = User.objects.filter(faculty_ref__isnull=True)
if no_fac.exists():
    print(f"\n[WARN] Users ที่ยังไม่ผูก faculty_ref ({no_fac.count()} คน):")
    for u in no_fac[:20]:
        print(f"   - {u.student_id} | {u.email}")
else:
    print("\n[OK] ทุก User มี faculty_ref เรียบร้อย")

# ── Full status ──
print("\n" + "=" * 55)
print("   All Users Status")
print("=" * 55)
for u in User.objects.select_related('faculty_ref', 'department_ref').all():
    fac  = u.faculty_ref.name   if u.faculty_ref   else "(ไม่ระบุ)"
    dept = u.department_ref.name if u.department_ref else "(ไม่ระบุ)"
    print(f"{u.student_id:<12} | role={u.role:<6} | faculty={fac} | dept={dept}")

print("\n[DONE] ตรวจสอบเสร็จสิ้น")
