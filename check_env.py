import os
from dotenv import load_dotenv
load_dotenv()
print("CLOUDINARY_URL:", os.getenv("CLOUDINARY_URL"))
