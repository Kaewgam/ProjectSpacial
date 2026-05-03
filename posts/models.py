from django.db import models
from accounts.models import User
import uuid


class Category(models.Model):
    name = models.CharField(max_length=50, unique=True)
    icon = models.CharField(max_length=10, default='📢')
    color_text = models.CharField(max_length=50, default='text-gray-700')
    color_border = models.CharField(max_length=50, default='border-gray-200')
    color_bg = models.CharField(max_length=50, default='bg-gray-50')
    color_dot = models.CharField(max_length=50, default='#6b7280')

    def __str__(self):
        return self.name


class Post(models.Model):
    id         = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    title      = models.CharField(max_length=255)
    excerpt    = models.TextField(blank=True)
    content    = models.TextField()
    category   = models.ForeignKey(Category, on_delete=models.SET_NULL, null=True, related_name='posts')
    author     = models.CharField(max_length=100, blank=True, default='')  # ชื่อหน่วยงาน
    created_by = models.ForeignKey(User, on_delete=models.SET_NULL, null=True, related_name='posts')
    cover_image = models.ImageField(upload_to='posts/', blank=True, null=True)
    pinned     = models.BooleanField(default=False)
    is_active  = models.BooleanField(default=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        ordering = ['-pinned', '-created_at']

    def __str__(self):
        return self.title
