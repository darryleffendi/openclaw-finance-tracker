from flask import Blueprint, jsonify, redirect, session

from backend import auth as auth_module
from backend.config import ALLOWED_EMAILS, REDIRECT_URI

bp = Blueprint("auth", __name__, url_prefix="/api/auth")


@bp.get("/login")
def auth_login():
    return auth_module.google.authorize_redirect(REDIRECT_URI)


@bp.get("/callback")
def auth_callback():
    token = auth_module.google.authorize_access_token()
    email = token.get("userinfo", {}).get("email")
    if email not in ALLOWED_EMAILS:
        return jsonify({"error": "Access denied"}), 403
    session.permanent = True
    session["user_email"] = email
    return redirect("/")


@bp.get("/logout")
def auth_logout():
    session.clear()
    return redirect("/")
