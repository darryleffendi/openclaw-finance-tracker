from functools import wraps

from authlib.integrations.flask_client import OAuth
from flask import jsonify, session

from backend.config import GOOGLE_CLIENT_ID, GOOGLE_CLIENT_SECRET

oauth = OAuth()
google = None


def init_oauth(app):
    global google
    oauth.init_app(app)
    google = oauth.register(
        name="google",
        client_id=GOOGLE_CLIENT_ID,
        client_secret=GOOGLE_CLIENT_SECRET,
        server_metadata_url="https://accounts.google.com/.well-known/openid-configuration",
        client_kwargs={"scope": "openid email profile"},
    )
    return google


def login_required(f):
    @wraps(f)
    def decorated(*args, **kwargs):
        if "user_email" not in session:
            return jsonify({"error": "Unauthorized"}), 401
        return f(*args, **kwargs)
    return decorated
