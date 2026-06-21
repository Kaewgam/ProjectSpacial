import os
import django
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'alumni_system.settings')
django.setup()

from accounts.neo4j_service import sync_all_to_neo4j

print("Starting Neo4j Sync...")
result = sync_all_to_neo4j()
print("Sync Result:", result)
