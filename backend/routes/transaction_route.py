from flask import Blueprint, jsonify, request

from backend.auth import login_required
from backend.repositories.transaction_repository import (
    get_transactions_by_category,
    get_transactions_by_period,
)
from backend.services.recurring_service import materialize_if_needed
from backend.services.transaction_service import delete_transaction, insert_transaction, update_transaction

bp = Blueprint("transactions", __name__, url_prefix="/api/transactions")


@bp.get("")
@login_required
def list_transactions():
    materialize_if_needed()
    period = request.args.get("period", "this-month")
    category = request.args.get("category")
    if category:
        return jsonify(get_transactions_by_category(category))
    return jsonify(get_transactions_by_period(period))


@bp.post("")
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


@bp.patch("/<int:transaction_id>")
@login_required
def edit_transaction(transaction_id):
    data = request.json or {}
    amount = data.get("amount")
    note = data.get("note")
    if amount is None and note is None:
        return jsonify({"error": "Supply at least one of: amount, note"}), 400
    try:
        result = update_transaction(transaction_id, amount=amount, note=note)
    except ValueError as e:
        return jsonify({"error": str(e)}), 400
    if result is None:
        return jsonify({"error": "Transaction not found"}), 404
    return jsonify(result)


@bp.delete("/<int:transaction_id>")
@login_required
def remove_transaction(transaction_id):
    success = delete_transaction(transaction_id)
    if success:
        return jsonify({"success": True, "id": transaction_id})
    return jsonify({"success": False, "error": "Not found"}), 404
