from flask import Blueprint, jsonify

from backend.auth import login_required
from backend.repositories.account_repository import get_accounts

bp = Blueprint("accounts", __name__)


@bp.get("/api/accounts")
@login_required
def accounts():
    return jsonify(get_accounts())


@bp.get("/api/categories")
@login_required
def categories():
    # Legacy alias — returns accounts in the old {category, subcategories} shape
    accts = get_accounts()
    return jsonify([{"category": a["slug"], "subcategories": a["subcategories"]} for a in accts])
