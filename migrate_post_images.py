import os
import django

os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'alumni_system.settings')
django.setup()

from posts.models import Post, PostImage

def migrate_images():
    posts = Post.objects.exclude(cover_image='')
    count = 0
    for post in posts:
        if post.cover_image:
            # check if it already has this image to avoid duplicates
            if not PostImage.objects.filter(post=post, image=post.cover_image).exists():
                PostImage.objects.create(post=post, image=post.cover_image)
                count += 1
    print(f"Migrated {count} cover images to PostImage.")

if __name__ == "__main__":
    migrate_images()
