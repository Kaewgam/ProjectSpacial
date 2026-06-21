import requests

print("Calling Render API to sync Neo4j...")
response = requests.post("https://alumni-backend-3jgo.onrender.com/api/admin/neo4j/sync-all/")
print(response.status_code)
print(response.text)
