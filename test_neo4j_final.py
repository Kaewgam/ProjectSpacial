import os
from neo4j import GraphDatabase

URI = "neo4j+s://160708aa.databases.neo4j.io"
USER = "160708aa"
PASSWORD = "HGS8Zww0eqB5stZ33Zqe2-Vz5LBwk2UycuLBvzvU7mA"

print("URI:", URI)
print("USER:", USER)
print("PASSWORD:", PASSWORD)

try:
    driver = GraphDatabase.driver(URI, auth=(USER, PASSWORD))
    driver.verify_connectivity()
    print("Connection successful!")
    
    with driver.session() as session:
        res = session.run("MATCH (n) RETURN count(n) as cnt")
        print("Nodes count:", res.single()["cnt"])
except Exception as e:
    print("Error:", e)
