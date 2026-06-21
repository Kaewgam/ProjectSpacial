import requests
import json

response = requests.get("https://alumni-backend-3jgo.onrender.com/api/posts/")
if response.status_code == 200:
    data = response.json()
    for post in data.get('results', data):
        print("Post Title:", post.get('title'))
        print("Cover Image:", post.get('cover_image'))
        print("Images:", post.get('images'))
else:
    print("Failed to fetch API:", response.status_code)
