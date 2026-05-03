from django.contrib.auth.models import AbstractBaseUser, BaseUserManager, PermissionsMixin
from django.db import models
from django.db.models.signals import post_delete
from django.dispatch import receiver
from neo4j_driver import sync_user_to_neo4j, delete_user_from_neo4j

import uuid

class UserManager(BaseUserManager):
    def create_user(self, student_id, email, password=None, **extra_fields):
        if not student_id:
            raise ValueError("Student ID is required")

        email = self.normalize_email(email)
        user = self.model(
            student_id=student_id,
            email=email,
            **extra_fields
        )
        user.set_password(password)
        user.save(using=self._db)
        return user

    def create_superuser(self, student_id, email, password=None, **extra_fields):
        extra_fields.setdefault('is_staff', True)
        extra_fields.setdefault('is_superuser', True)
        return self.create_user(student_id, email, password, **extra_fields)


class Faculty(models.Model):
    name = models.CharField(max_length=150, unique=True)
    
    def __str__(self):
        return self.name

class Department(models.Model):
    faculty = models.ForeignKey(Faculty, on_delete=models.CASCADE, related_name='departments')
    name = models.CharField(max_length=150)
    short_name = models.CharField(max_length=20, blank=True, default='')
    code = models.CharField(max_length=20, blank=True, default='')
    
    class Meta:
        unique_together = ('faculty', 'name')

    def __str__(self):
        return self.name

class User(AbstractBaseUser, PermissionsMixin):
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)

    # ข้อมูลบัญชี
    student_id = models.CharField(max_length=10, unique=True)
    email = models.EmailField(unique=True)
    password = models.CharField(max_length=128)
    role = models.CharField(max_length=20, choices=[
        ('ADMIN', 'Admin'),
        ('ALUMNI', 'Alumni'),
    ], default='ALUMNI')

    # ข้อมูลส่วนตัว
    prefix = models.CharField(max_length=20, blank=True, default='', choices=[
        ('นาย', 'นาย'),
        ('นาง', 'นาง'),
        ('นางสาว', 'นางสาว'),
    ])
    first_name = models.CharField(max_length=100, blank=True, default='')
    last_name = models.CharField(max_length=100, blank=True, default='')

    # ข้อมูลการศึกษา (FK)
    faculty_ref = models.ForeignKey(Faculty, on_delete=models.SET_NULL, null=True, blank=True, related_name='users')
    department_ref = models.ForeignKey(Department, on_delete=models.SET_NULL, null=True, blank=True, related_name='users')

    # ข้อมูลอาชีพ
    occupation = models.CharField(max_length=150, blank=True, default='') # ตำแหน่ง
    company = models.CharField(max_length=150, blank=True, default='') # หน่วยงาน/สังกัด

    # รูปโปรไฟล์
    avatar = models.ImageField(upload_to='avatars/', blank=True, null=True)

    is_active = models.BooleanField(default=True)
    is_staff = models.BooleanField(default=False)
    date_joined = models.DateTimeField(auto_now_add=True)

    objects = UserManager()

    USERNAME_FIELD = 'student_id'
    REQUIRED_FIELDS = ['email']

    def __str__(self):
        return self.student_id

    def save(self, *args, **kwargs):
        super().save(*args, **kwargs)

        # 🔥 Sync ไป Neo4j
        try:
            sync_user_to_neo4j(self)
            self._neo4j_synced = True
        except Exception as e:
            # ไม่ให้ระบบพังถ้า Neo4j ไม่ทำงาน
            print(f"Failed to sync user {self.student_id} to Neo4j: {e}")
            self._neo4j_synced = False

class PasswordResetToken(models.Model):
    user = models.ForeignKey(User, on_delete=models.CASCADE, related_name='reset_tokens')
    token = models.UUIDField(default=uuid.uuid4, unique=True)
    created_at = models.DateTimeField(auto_now_add=True)
    expires_at = models.DateTimeField()
    used = models.BooleanField(default=False)

    def is_valid(self):
        from django.utils import timezone
        return not self.used and timezone.now() < self.expires_at

    def __str__(self):
        return f"{self.user.student_id} - {self.token}"

# 🔥 ลงทะเบียน Signal เพื่อลบ User ใน Neo4j เมื่อลบทิ้งใน PostgreSQL
@receiver(post_delete, sender=User)
def delete_user_in_neo4j(sender, instance, **kwargs):
    try:
        delete_user_from_neo4j(instance.student_id)
    except Exception as e:
        print(f"Failed to delete user {instance.student_id} from Neo4j: {e}")
