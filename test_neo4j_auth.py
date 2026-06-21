import os
from dotenv import load_dotenv
load_dotenv(override=True)
from neo4j import GraphDatabase

URI = os.getenv("NEO4J_URI")
USER = os.getenv("NEO4J_USER")
PASSWORD = os.getenv("NEO4J_PASSWORD")

print("URI:", URI)
print("USER:", USER)
print("PASSWORD:", PASSWORD)

try:
    driver = GraphDatabase.driver(URI, auth=(USER, PASSWORD))
    driver.verify_connectivity()
    print("Connection successful!")
except Exception as e:
    print("Error:", e)
