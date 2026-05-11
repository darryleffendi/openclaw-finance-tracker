import os

from dotenv import load_dotenv

load_dotenv()

SECRET_KEY = os.environ["SECRET_KEY"]
GOOGLE_CLIENT_ID = os.environ["GOOGLE_CLIENT_ID"]
GOOGLE_CLIENT_SECRET = os.environ["GOOGLE_CLIENT_SECRET"]
REDIRECT_URI = os.environ["REDIRECT_URI"]
ALLOWED_EMAILS = {e.strip() for e in os.environ["ALLOWED_EMAILS"].split(",")}
CORS_ORIGINS = ["http://localhost:5179"]
PORT = 8009
