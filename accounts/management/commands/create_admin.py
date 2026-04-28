from django.core.management.base import BaseCommand
from accounts.models import User
from unittest.mock import patch


class Command(BaseCommand):
    help = 'Create default admin account (student_id=Admin, password=admin)'

    def handle(self, *args, **kwargs):
        student_id = 'Admin'
        email = 'admin@alumni.local'
        password = 'admin'

        if User.objects.filter(student_id=student_id).exists():
            self.stdout.write(self.style.WARNING(
                f'[SKIP] Account "{student_id}" already exists.'
            ))
            user = User.objects.get(student_id=student_id)
            if user.role != 'ADMIN':
                # patch sync เพื่อไม่ให้ error ถ้า Neo4j ไม่ได้รัน
                with patch('accounts.models.sync_user_to_neo4j', return_value=None):
                    user.role = 'ADMIN'
                    user.is_staff = True
                    user.save()
                self.stdout.write(self.style.SUCCESS('Updated role to ADMIN.'))
            return

        # patch sync_user_to_neo4j ชั่วคราว เผื่อ Neo4j ไม่ได้รัน
        with patch('accounts.models.sync_user_to_neo4j', return_value=None):
            user = User.objects.create_user(
                student_id=student_id,
                email=email,
                password=password,
                first_name='Admin',
                last_name='System',
                role='ADMIN',
            )
            user.role = 'ADMIN'
            user.is_staff = True
            user.save()

        self.stdout.write(self.style.SUCCESS('Admin account created successfully!'))
        self.stdout.write(f'  Student ID : {student_id}')
        self.stdout.write(f'  Email      : {email}')
        self.stdout.write(f'  Password   : {password}')
        self.stdout.write(f'  Role       : {user.role}')
        self.stdout.write('')
        self.stdout.write(self.style.WARNING(
            'NOTE: Sync to Neo4j was skipped. Run "python manage.py create_admin" again when Neo4j is running to sync.'
        ))

