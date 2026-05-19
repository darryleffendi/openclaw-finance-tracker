from flask import Blueprint, jsonify, request

from backend.auth import login_required
from backend.repositories.recurring_repository import ALLOWED_UPDATE_FIELDS
from backend.services.recurring_service import (
    create_rule,
    delete_rule,
    get_rule,
    list_rules,
    run_now,
    update_rule,
)

bp = Blueprint("recurring", __name__, url_prefix="/api/recurring")


@bp.get("")
@login_required
def index():
    return jsonify(list_rules())


@bp.post("")
@login_required
def create():
    data = request.json or {}
    required = {"name", "amount", "type", "category", "day_of_month"}
    missing = required - set(data)
    if missing:
        return jsonify({"error": f"Missing required fields: {sorted(missing)}"}), 400
    try:
        rule = create_rule(
            name=data["name"],
            amount=float(data["amount"]),
            type=data["type"],
            category=data["category"],
            day_of_month=int(data["day_of_month"]),
            subcategory=data.get("subcategory"),
            note=data.get("note"),
            enabled=int(data.get("enabled", 1)),
        )
    except Exception as e:
        return jsonify({"error": str(e)}), 400
    return jsonify(rule), 201


@bp.patch("/<int:rule_id>")
@login_required
def update(rule_id):
    data = request.json or {}
    fields = {k: v for k, v in data.items() if k in ALLOWED_UPDATE_FIELDS}
    if not fields:
        return jsonify({"error": f"No editable fields. Allowed: {sorted(ALLOWED_UPDATE_FIELDS)}"}), 400
    result = update_rule(rule_id, **fields)
    if result is None:
        return jsonify({"error": "Rule not found"}), 404
    return jsonify(result)


@bp.delete("/<int:rule_id>")
@login_required
def destroy(rule_id):
    if get_rule(rule_id) is None:
        return jsonify({"error": "Rule not found"}), 404
    delete_rule(rule_id)
    return jsonify({"success": True, "id": rule_id})


@bp.post("/run")
@login_required
def run():
    results = run_now()
    return jsonify({"materialized": len(results), "transactions": results})
