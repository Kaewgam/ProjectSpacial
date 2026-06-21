import requests
response = requests.get("https://alumni-backend-3jgo.onrender.com/graph-data/")
print(response.status_code)
print(response.text[:200])
