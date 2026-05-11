from flask import Blueprint, jsonify, request

from backend.auth import login_required
from backend.services.summary_service import get_summary

bp = Blueprint("summary", __name__)


@bp.get("/api/summary")
@login_required
def summary():
    period = request.args.get("period", "this-month")
    return jsonify(get_summary(period))
