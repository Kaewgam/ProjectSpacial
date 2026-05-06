import os
import django

os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'alumni_system.settings')
django.setup()

from accounts.models import User, UserProfile

def migrate_data():
    users = User.objects.all()
    count = 0
    for user in users:
        # Create Profile
        if hasattr(user, 'profile'):
            user.profile.email = user.email
            user.profile.save()
            count += 1
    
    print(f"Migrated {count} emails successfully!")

if __name__ == "__main__":
    migrate_data()
