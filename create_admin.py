from accounts.models import User

student_id = 'Admin'
email = 'admin@alumni.local'
password = 'admin'

if User.objects.filter(student_id=student_id).exists():
    print(f"[SKIP] บัญชี '{student_id}' มีอยู่แล้ว")
else:
    user = User.objects.create_user(
        student_id=student_id,
        password=password,
    )
    user.role = 'ADMIN'
    user.is_staff = True
    user.save()
    
    from accounts.models import UserProfile
    UserProfile.objects.create(
        user=user,
        email=email,
        first_name='Admin',
        last_name='System'
    )
    print(f"[OK] สร้างบัญชี Admin สำเร็จ!")
    print(f"     Student ID : {student_id}")
    print(f"     Email      : {email}")
    print(f"     Password   : {password}")
    print(f"     Role       : {user.role}")
