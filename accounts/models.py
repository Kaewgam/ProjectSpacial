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


class User(AbstractBaseUser, PermissionsMixin):
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)

    # ข้อมูลบัญชี
    student_id = models.CharField(max_length=10, unique=True)
    email = models.EmailField(unique=True)
    password = models.CharField(max_length=128)
    role = models.CharField(max_length=20, choices=[
        ('ADMIN', 'Admin'),
        ('ALUMNI', 'Alumni'),
        ('STUDENT', 'Student'),
    ], default='ALUMNI')

    # ข้อมูลส่วนตัว
    prefix = models.CharField(max_length=20, blank=True, default='', choices=[
        ('นาย', 'นาย'),
        ('นาง', 'นาง'),
        ('นางสาว', 'นางสาว'),
    ])
    first_name = models.CharField(max_length=100, blank=True, default='')
    last_name = models.CharField(max_length=100, blank=True, default='')

    # ข้อมูลการศึกษา
    faculty = models.CharField(max_length=150, blank=True, default='')
    department = models.CharField(max_length=150, blank=True, default='')

    # ข้อมูลอาชีพ
    occupation = models.CharField(max_length=150, blank=True, default='')

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
        sync_user_to_neo4j(self)

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
    delete_user_from_neo4j(instance.student_id)
