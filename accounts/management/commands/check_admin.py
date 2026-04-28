from django.core.management.base import BaseCommand
from accounts.models import User
from unittest.mock import patch


class Command(BaseCommand):
    help = 'Show and fix admin account status'

    def handle(self, *args, **kwargs):
        student_id = 'Admin'

        try:
            user = User.objects.get(student_id=student_id)
            self.stdout.write(f'Student ID : {user.student_id}')
            self.stdout.write(f'Email      : {user.email}')
            self.stdout.write(f'Role       : {user.role}')
            self.stdout.write(f'is_staff   : {user.is_staff}')
            self.stdout.write(f'is_active  : {user.is_active}')

            if user.role != 'ADMIN':
                with patch('accounts.models.sync_user_to_neo4j', return_value=None):
                    user.role = 'ADMIN'
                    user.is_staff = True
                    user.save()
                self.stdout.write(self.style.SUCCESS('Fixed: role updated to ADMIN'))
            else:
                self.stdout.write(self.style.SUCCESS('Role is already ADMIN — OK!'))

        except User.DoesNotExist:
            self.stdout.write(self.style.ERROR(f'Account "{student_id}" not found!'))
