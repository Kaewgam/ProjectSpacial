import os
import django

os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'alumni_system.settings')
django.setup()

from posts.models import Post, Category

STYLES = {
  'ประกาศ':   {'bg': 'bg-violet-50',  'text': 'text-violet-700',  'border': 'border-violet-200',  'dot': '#7c3aed', 'icon': '📢'},
  'กิจกรรม':  {'bg': 'bg-emerald-50', 'text': 'text-emerald-700', 'border': 'border-emerald-200', 'dot': '#059669', 'icon': '📅'},
  'ข่าวสาร':  {'bg': 'bg-sky-50',     'text': 'text-sky-700',     'border': 'border-sky-200',     'dot': '#0284c7', 'icon': '🗞️'},
  'ประกาศสมัครงาน': {'bg': 'bg-amber-50',   'text': 'text-amber-700',   'border': 'border-amber-200',   'dot': '#d97706', 'icon': '💼'},
}

for name, style in STYLES.items():
    cat, created = Category.objects.get_or_create(name=name, defaults={
        'icon': style['icon'],
        'color_text': style['text'],
        'color_border': style['border'],
        'color_bg': style['bg'],
        'color_dot': style['dot']
    })
    
    # Update posts
    Post.objects.filter(category=name).update(category_ref=cat)

print("Categories migrated successfully!")
