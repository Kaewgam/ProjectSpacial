import os
import django
import sys

sys.stdout.reconfigure(encoding='utf-8')
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'alumni_system.settings')
django.setup()

from accounts.models import Faculty

def run():
    # Find Faculty of Science and Technology
    faculty = Faculty.objects.filter(name__icontains='วิทยาศาสตร์').first()
    if not faculty:
        print("Error: ไม่พบคณะวิทยาศาสตร์")
        return
        
    print(f"Keeping faculty: {faculty.name} (ID: {faculty.id})")
    
    # Delete all other faculties
    others = Faculty.objects.exclude(id=faculty.id)
    count = others.count()
    if count > 0:
        for other in others:
            print(f"Deleting faculty: {other.name} (ID: {other.id})")
        others.delete()
        print(f"Deleted {count} other faculties.")
    else:
        print("No other faculties to delete.")

if __name__ == '__main__':
    run()
