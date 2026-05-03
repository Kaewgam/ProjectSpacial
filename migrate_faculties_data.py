import os
import django

os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'alumni_system.settings')
django.setup()

from accounts.models import User, Faculty, Department

def run_migration():
    print("Starting data migration for Faculty and Department...")
    
    users = User.objects.all()
    count = 0
    
    for user in users:
        faculty_name = user.faculty.strip() if user.faculty else ""
        department_name = user.department.strip() if user.department else ""
        
        faculty_obj = None
        department_obj = None
        
        if faculty_name:
            faculty_obj, _ = Faculty.objects.get_or_create(name=faculty_name)
            user.faculty_ref = faculty_obj
            
            if department_name:
                import re
                code = ""
                short_name = ""
                
                # Extract code from parenthesis
                code_match = re.search(r'\((\d+)\)', department_name)
                if code_match:
                    code = code_match.group(1)
                    
                # Extract short name (capital letters at start)
                short_match = re.match(r'^([A-Z]+)', department_name)
                if short_match:
                    short_name = short_match.group(1)
                
                department_obj, _ = Department.objects.get_or_create(
                    faculty=faculty_obj,
                    name=department_name,
                    defaults={'short_name': short_name, 'code': code}
                )
                user.department_ref = department_obj
                
        user.save()
        count += 1
        
    print(f"Migration completed for {count} users.")

if __name__ == "__main__":
    run_migration()
