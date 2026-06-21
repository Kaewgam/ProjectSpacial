import requests
import json

response = requests.get("http://127.0.0.1:8000/api/posts/")
if response.status_code == 200:
    data = response.json()
    for post in data.get('results', data)[:2]:
        print("Post ID:", post.get('id'))
        print("Images:", post.get('images'))
else:
    print("Failed to fetch API:", response.status_code)
