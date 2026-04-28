from django.core.management.base import BaseCommand
from accounts.models import User
from neo4j_driver import cleanup_orphaned_users

class Command(BaseCommand):
    help = 'Cleans up orphaned User nodes in Neo4j that no longer exist in PostgreSQL'

    def handle(self, *args, **kwargs):
        self.stdout.write("Starting cross-check between PostgreSQL and Neo4j...")
        
        # 1. ดึง Student IDs ทั้งหมดที่มีอยู่ใน PostgreSQL ณ ปัจจุบัน
        valid_users = list(User.objects.values_list('student_id', flat=True))
        
        # 2. ป้อนรายชื่อให้ Neo4j หา Node ผี (Orphans) และลบทิ้ง
        orphans_deleted = cleanup_orphaned_users(valid_users)
        
        if orphans_deleted:
            self.stdout.write(self.style.SUCCESS(f"Successfully deleted {len(orphans_deleted)} orphaned node(s) from Neo4j!"))
            for pid in orphans_deleted:
                self.stdout.write(f"- Deleted: {pid}")
        else:
            self.stdout.write(self.style.SUCCESS("Neo4j database is perfectly in sync. No orphaned nodes found."))
