from django.db import models
from accounts.models import User
import uuid


class Post(models.Model):
    CATEGORY_CHOICES = [
        ('ประกาศ',   'ประกาศ'),
        ('กิจกรรม',  'กิจกรรม'),
        ('ข่าวสาร',  'ข่าวสาร'),
        ('ประกาศสมัครงาน', 'ประกาศสมัครงาน'),
    ]

    id         = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    title      = models.CharField(max_length=120)
    excerpt    = models.CharField(max_length=200, blank=True, default='')
    content    = models.TextField()
    category   = models.CharField(max_length=20, choices=CATEGORY_CHOICES)
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
