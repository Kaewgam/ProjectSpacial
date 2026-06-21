import requests
import json

response = requests.get("https://alumni-backend-3jgo.onrender.com/api/graph-data/")
print(response.status_code)
print(response.text)
