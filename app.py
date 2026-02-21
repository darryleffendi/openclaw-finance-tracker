from flask import Flask, jsonify, request
from flask_cors import CORS
from database import (
    insert_transaction,
    get_transactions_by_period,
    get_transactions_by_category,
    get_summary,
    get_all_transactions,
    delete_transaction,
)
from constants import CATEGORIES

app = Flask(__name__)
CORS(app, origins=["http://localhost:5179"])  # Vite dev server only


@app.get("/api/transactions")
def list_transactions():
    period = request.args.get("period", "this-month")
    category = request.args.get("category")
    if category:
        return jsonify(get_transactions_by_category(category))
    return jsonify(get_transactions_by_period(period))


@app.post("/api/transactions")
def create_transaction():
    data = request.json
    row_id = insert_transaction(
        amount=data["amount"],
        type=data["type"],
        category=data["category"],
        subcategory=data.get("subcategory"),
        note=data.get("note"),
        date=data.get("date"),
    )
    return jsonify({"success": True, "id": row_id}), 201


@app.delete("/api/transactions/<int:transaction_id>")
def remove_transaction(transaction_id):
    success = delete_transaction(transaction_id)
    if success:
        return jsonify({"success": True, "id": transaction_id})
    return jsonify({"success": False, "error": "Not found"}), 404


@app.get("/api/summary")
def summary():
    period = request.args.get("period", "this-month")
    return jsonify(get_summary(period))


@app.get("/api/categories")
def categories():
    return jsonify(CATEGORIES)


if __name__ == "__main__":
    app.run(port=8009, debug=False)
