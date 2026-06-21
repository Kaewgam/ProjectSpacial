import os
import django
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'alumni_system.settings')
django.setup()

from posts.models import PostImage
import re

def strip_thai_vowels(text):
    # Thai vowels and tone marks: \u0E31, \u0E34-\u0E3A, \u0E47-\u0E4E
    return re.sub(r'[\u0E31\u0E34-\u0E3A\u0E47-\u0E4E]', '', text)

for img in PostImage.objects.all()[:5]:
    db_name = img.image.name
    basename = os.path.basename(db_name)
    stripped = strip_thai_vowels(basename)
    print("DB:", basename)
    print("Stripped:", stripped)
