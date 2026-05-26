import os
import django
import sys

# Ensure correct encoding for print statements
sys.stdout.reconfigure(encoding='utf-8')

os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'alumni_system.settings')
django.setup()

from accounts.models import Faculty, Department

def run():
    # Find Faculty of Science and Technology
    faculty = Faculty.objects.filter(name__icontains='วิทยาศาสตร์').first()
    if not faculty:
        print("Error: ไม่พบคณะวิทยาศาสตร์")
        return
        
    print(f"Found faculty: {faculty.name} (ID: {faculty.id})")
    
    depts = [
        {"id": "051", "name": "วิทยาการคอมพิวเตอร์", "short_name": "CS"},
        {"id": "052", "name": "เทคโนโลยีสารสนเทศ", "short_name": "IT"},
        {"id": "053", "name": "จุลชีววิทยาอุตสาหกรรม", "short_name": "MI"},
        {"id": "054", "name": "วิทยาศาสตร์การแพทย์", "short_name": "MS"},
        {"id": "055", "name": "วิทยาศาสตร์และเทคโนโลยีการอาหาร", "short_name": "FS"},
        {"id": "056", "name": "วิทยาการคอมพิวเตอร์ (เทียบโอน)", "short_name": "CS"},
        {"id": "057", "name": "ปัญญาประดิษฐ์", "short_name": "AI"},
        {"id": "058", "name": "วิทยาการหุ่นยนต์สุขภาพ", "short_name": "RB"},
    ]
    
    for d in depts:
        dept, created = Department.objects.update_or_create(
            id=d["id"],
            defaults={
                "faculty": faculty,
                "name": d["name"],
                "short_name": d["short_name"]
            }
        )
        status = "Created" if created else "Updated"
        print(f"{status}: {dept.id} - {dept.name} ({dept.short_name})")

if __name__ == '__main__':
    run()
