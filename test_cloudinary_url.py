import requests

url1 = "https://res.cloudinary.com/dmahnk1ez)/image/upload/v1/media/posts/images/%E0%B8%9C%E0%B8%A5%E0%B8%A5%E0%B8%9E%E0%B8%98%E0%B8%81%E0%B8%B2%E0%B8%A3%E0%B9%80%E0%B8%A3%E0%B8%A2%E0%B8%99%E0%B8%A3%E0%B8%97%E0%B8%84%E0%B8%B2%E0%B8%94%E0%B8%AB%E0%B8%A7%E0%B8%87%E0%B8%88%E0%B8%B2%E0%B8%81%E0%B8%AB%E0%B8%A5%E0%B8%81%E0%B8%AA%E0%B8%95%E0%B8%A3_%E0%B8%84%E0%B8%93%E0%B8%B0%E0%B8%A7%E0%B8%97%E0%B8%A2%E0%B8%B2%E0%B8%A8%E0%B8%B2%E0%B8%AA%E0%B8%95%E0%B8%A3%E0%B9%81%E0%B8%A5%E0%B8%B0%E0%B9%80%E0%B8%97%E0%B8%84%E0%B9%82%E0%B8%99%E0%B9%82%E0%B8%A5%E0%B8%A2_1_r3q9j5b_hftbxq"
url2 = url1.replace("dmahnk1ez)", "dmahnk1ez")

print("Fetching url1...")
try:
    r1 = requests.get(url1)
    print("url1 status:", r1.status_code)
except Exception as e:
    print("url1 error:", e)

print("Fetching url2...")
try:
    r2 = requests.get(url2)
    print("url2 status:", r2.status_code)
except Exception as e:
    print("url2 error:", e)
