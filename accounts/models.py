from django.contrib.auth.models import AbstractBaseUser, BaseUserManager, PermissionsMixin
from django.db import models
from django.db.models.signals import post_delete
from django.dispatch import receiver
from neo4j_driver import sync_user_to_neo4j, delete_user_from_neo4j

import uuid

class UserManager(BaseUserManager):
    def create_user(self, student_id, password=None, **extra_fields):
        if not student_id:
            raise ValueError("Student ID is required")

        user = self.model(
            student_id=student_id,
            **extra_fields
        )
        user.set_password(password)
        user.save(using=self._db)
        return user

    def create_superuser(self, student_id, password=None, **extra_fields):
        extra_fields.setdefault('is_staff', True)
        extra_fields.setdefault('is_superuser', True)
        return self.create_user(student_id, password, **extra_fields)


class Faculty(models.Model):
    id = models.CharField(primary_key=True, max_length=10)
    name = models.CharField(max_length=150, unique=True)
    
    def __str__(self):
        return f"[{self.id}] {self.name}"

class Department(models.Model):
    id = models.CharField(primary_key=True, max_length=10)
    faculty = models.ForeignKey(Faculty, on_delete=models.CASCADE, related_name='departments')
    name = models.CharField(max_length=150)
    short_name = models.CharField(max_length=20, blank=True, default='')
    
    class Meta:
        unique_together = ('faculty', 'name')

    def __str__(self):
        return f"[{self.id}] {self.name}"

class User(AbstractBaseUser, PermissionsMixin):
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)

    student_id = models.CharField(max_length=10, unique=True)
    password = models.CharField(max_length=128)
    role = models.CharField(max_length=20, choices=[
        ('ADMIN', 'Admin'),
        ('ALUMNI', 'Alumni'),
    ], default='ALUMNI')

    is_active = models.BooleanField(default=True)
    is_staff = models.BooleanField(default=False)
    date_joined = models.DateTimeField(auto_now_add=True)

    objects = UserManager()

    USERNAME_FIELD = 'student_id'
    REQUIRED_FIELDS = []

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

class UserProfile(models.Model):
    user = models.OneToOneField(User, on_delete=models.CASCADE, related_name='profile')
    email = models.EmailField(unique=True, null=True, blank=True)
    prefix = models.CharField(max_length=20, blank=True, default='', choices=[
        ('นาย', 'นาย'),
        ('นาง', 'นาง'),
        ('นางสาว', 'นางสาว'),
    ])
    first_name = models.CharField(max_length=100, blank=True, default='')
    last_name = models.CharField(max_length=100, blank=True, default='')
    phone_number = models.CharField(max_length=20, blank=True, default='')
    github_link = models.URLField(max_length=255, blank=True, default='')
    avatar = models.ImageField(upload_to='avatars/', blank=True, null=True)

    def __str__(self):
        return f"{self.first_name} {self.last_name}"

class UserEducation(models.Model):
    user = models.ForeignKey(User, on_delete=models.CASCADE, related_name='educations')
    faculty_ref = models.ForeignKey(Faculty, on_delete=models.SET_NULL, null=True, blank=True, related_name='user_educations')
    department_ref = models.ForeignKey(Department, on_delete=models.SET_NULL, null=True, blank=True, related_name='user_educations')
    other_faculty = models.CharField(max_length=150, blank=True, default='')
    other_department = models.CharField(max_length=150, blank=True, default='')
    degree_level = models.CharField(max_length=50, blank=True, default='') # ป.ตรี, ป.โท, ป.เอก
    graduation_year = models.CharField(max_length=4, blank=True, default='')

    def __str__(self):
        return f"{self.user.student_id} - {self.faculty_ref}"

class UserCareer(models.Model):
    user = models.ForeignKey(User, on_delete=models.CASCADE, related_name='careers')
    occupation = models.CharField(max_length=150, blank=True, default='')
    company = models.CharField(max_length=150, blank=True, default='')
    work_email = models.EmailField(blank=True, default='')
    is_current = models.BooleanField(default=True)
    start_year = models.CharField(max_length=4, blank=True, default='')
    end_year = models.CharField(max_length=50, blank=True, default='')

    def __str__(self):
        return f"{self.user.student_id} - {self.occupation} at {self.company}"

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


class Skill(models.Model):
    name = models.CharField(max_length=100, unique=True)

    def __str__(self):
        return self.name

class UserSkill(models.Model):
    user = models.ForeignKey(User, on_delete=models.CASCADE, related_name='skills')
    skill = models.ForeignKey(Skill, on_delete=models.CASCADE, related_name='users')

    class Meta:
        unique_together = ('user', 'skill')

    def __str__(self):
        return f"{self.user.student_id} - {self.skill.name}"

class UserCertificate(models.Model):
    user = models.ForeignKey(User, on_delete=models.CASCADE, related_name='certificates')
    name = models.CharField(max_length=200)
    image = models.ImageField(upload_to='certificates/', blank=True, null=True)
    issue_year = models.CharField(max_length=4, blank=True, default='')

    def __str__(self):
        return f"{self.user.student_id} - {self.name}"

class HallOfFame(models.Model):
    CATEGORY_CHOICES = [
        ('ACADEMIC', 'Academic Excellence'),
        ('BUSINESS', 'Business & Career Success'),
        ('SOCIAL', 'Social Contribution'),
        ('SPORTS_ARTS', 'Sports & Arts'),
    ]

    user = models.ForeignKey(User, on_delete=models.CASCADE, related_name='hall_of_fames')
    award_year = models.CharField(max_length=4)
    category = models.CharField(max_length=50, choices=CATEGORY_CHOICES)
    title = models.CharField(max_length=200)
    description = models.TextField()
    image = models.ImageField(upload_to='hall_of_fame/', blank=True, null=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    def __str__(self):
        return f"{self.user.student_id} - {self.title} ({self.award_year})"
