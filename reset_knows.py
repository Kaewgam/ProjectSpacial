import os
import django

os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'alumni_system.settings')
django.setup()

from neo4j_driver import driver, auto_create_knows

print("Deleting all KNOWS relationships...")
with driver.session() as session:
    session.run("MATCH ()-[r:KNOWS]->() DELETE r")
print("Deleted.")

print("Rebuilding KNOWS relationships...")
auto_create_knows()
print("Done.")
