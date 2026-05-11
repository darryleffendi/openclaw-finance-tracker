from flask import Blueprint, jsonify, request

from backend.auth import login_required
from backend.services.distribution_service import distribute_salary

bp = Blueprint("distribute", __name__)


@bp.post("/api/distribute")
@login_required
def distribute():
    data = request.json
    amount = data.get("amount")
    if not amount:
        return jsonify({"error": "amount is required"}), 400
    source = data.get("source_account", "freelance")
    result = distribute_salary(amount, source)
    return jsonify(result), 201
