import os
import django
from dotenv import load_dotenv

# Force reload .env
load_dotenv(override=True)

os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'alumni_system.settings')
django.setup()

from neo4j_driver import sync_user_to_neo4j
from accounts.models import User

print("URI:", os.getenv("NEO4J_URI"))

print("Starting Neo4j Sync locally...")
users = User.objects.all()
count = 0
for u in users:
    sync_user_to_neo4j(u)
    count += 1

print(f"Sync complete! Synced {count} users to Neo4j.")
