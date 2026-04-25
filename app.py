import os
from functools import wraps
from flask import Flask, jsonify, request, session, redirect
from flask_cors import CORS
from authlib.integrations.flask_client import OAuth
from dotenv import load_dotenv
from werkzeug.middleware.proxy_fix import ProxyFix
from database import (
    insert_transaction,
    get_transactions_by_period,
    get_transactions_by_category,
    get_summary,
    get_all_transactions,
    delete_transaction,
    get_accounts,
    distribute_salary,
)

load_dotenv()

app = Flask(__name__)
app.wsgi_app = ProxyFix(app.wsgi_app, x_proto=1, x_host=1)
app.secret_key = os.environ["SECRET_KEY"]
CORS(app, origins=["http://localhost:5179"], supports_credentials=True)

oauth = OAuth(app)
google = oauth.register(
    name="google",
    client_id=os.environ["GOOGLE_CLIENT_ID"],
    client_secret=os.environ["GOOGLE_CLIENT_SECRET"],
    server_metadata_url="https://accounts.google.com/.well-known/openid-configuration",
    client_kwargs={"scope": "openid email profile"},
)
ALLOWED_EMAILS = {e.strip() for e in os.environ["ALLOWED_EMAILS"].split(",")}


def login_required(f):
    @wraps(f)
    def decorated(*args, **kwargs):
        if "user_email" not in session:
            return jsonify({"error": "Unauthorized"}), 401
        return f(*args, **kwargs)
    return decorated


# ── Auth routes ───────────────────────────────────────────────────────────────

@app.get("/api/auth/login")
def auth_login():
    redirect_uri = os.environ["REDIRECT_URI"]
    return google.authorize_redirect(redirect_uri)


@app.get("/api/auth/callback")
def auth_callback():
    token = google.authorize_access_token()
    email = token.get("userinfo", {}).get("email")
    if email not in ALLOWED_EMAILS:
        return jsonify({"error": "Access denied"}), 403
    session.permanent = True
    session["user_email"] = email
    return redirect("/")


@app.get("/api/auth/logout")
def auth_logout():
    session.clear()
    return redirect("/")


# ── Protected API routes ──────────────────────────────────────────────────────

@app.get("/api/transactions")
@login_required
def list_transactions():
    period = request.args.get("period", "this-month")
    category = request.args.get("category")
    if category:
        return jsonify(get_transactions_by_category(category))
    return jsonify(get_transactions_by_period(period))


@app.post("/api/transactions")
@login_required
def create_transaction():
    data = request.json
    txn_id, distributed = insert_transaction(
        amount=data["amount"],
        type=data["type"],
        category=data["category"],
        subcategory=data.get("subcategory"),
        note=data.get("note"),
        date=data.get("date"),
    )
    result = {"success": True, "id": txn_id}
    if distributed:
        result["distributions"] = distributed
    return jsonify(result), 201


@app.delete("/api/transactions/<int:transaction_id>")
@login_required
def remove_transaction(transaction_id):
    success = delete_transaction(transaction_id)
    if success:
        return jsonify({"success": True, "id": transaction_id})
    return jsonify({"success": False, "error": "Not found"}), 404


@app.get("/api/summary")
@login_required
def summary():
    period = request.args.get("period", "this-month")
    return jsonify(get_summary(period))


@app.get("/api/accounts")
@login_required
def accounts():
    return jsonify(get_accounts())


@app.get("/api/categories")
@login_required
def categories():
    # Legacy alias — returns accounts in the old {category, subcategories} shape
    accts = get_accounts()
    return jsonify([{"category": a["slug"], "subcategories": a["subcategories"]} for a in accts])


@app.post("/api/distribute")
@login_required
def distribute():
    data = request.json
    amount = data.get("amount")
    if not amount:
        return jsonify({"error": "amount is required"}), 400
    source = data.get("source_account", "freelance")
    result = distribute_salary(amount, source)
    return jsonify(result), 201


if __name__ == "__main__":
    app.run(port=8009, debug=False)
