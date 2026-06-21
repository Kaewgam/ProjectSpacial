import requests
import json

response = requests.get("https://alumni-backend-3jgo.onrender.com/api/posts/")
if response.status_code == 200:
    data = response.json()
    for post in data.get('results', data)[:2]:
        print("Post ID:", post.get('id'))
        print("Cover Image:", post.get('cover_image'))
else:
    print("Failed to fetch API:", response.status_code)
