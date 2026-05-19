from flask import Blueprint, jsonify, request

from backend.auth import login_required
from backend.repositories.account_repository import (
    ALLOWED_UPDATE_FIELDS,
    get_account,
    get_accounts,
    update_account,
)
from backend.services.recurring_service import materialize_if_needed

bp = Blueprint("accounts", __name__)


@bp.get("/api/accounts")
@login_required
def accounts():
    materialize_if_needed()
    return jsonify(get_accounts())


@bp.get("/api/categories")
@login_required
def categories():
    # Legacy alias — returns accounts in the old {category, subcategories} shape
    accts = get_accounts()
    return jsonify([{"category": a["slug"], "subcategories": a["subcategories"]} for a in accts])


@bp.patch("/api/accounts/<slug>")
@login_required
def patch_account(slug):
    data = request.json or {}
    fields = {k: v for k, v in data.items() if k in ALLOWED_UPDATE_FIELDS}
    if not fields:
        return jsonify({"error": f"No editable fields supplied. Allowed: {sorted(ALLOWED_UPDATE_FIELDS)}"}), 400

    try:
        ok = update_account(slug, **fields)
    except ValueError as e:
        return jsonify({"error": str(e)}), 400

    if not ok:
        return jsonify({"error": "Account not found"}), 404
    return jsonify(get_account(slug))
