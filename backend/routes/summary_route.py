from flask import Blueprint, jsonify, request

from backend.auth import login_required
from backend.services.recurring_service import materialize_if_needed
from backend.services.summary_service import get_summary, get_summary_range

bp = Blueprint("summary", __name__)


@bp.get("/api/summary")
@login_required
def summary():
    materialize_if_needed()
    start = request.args.get("start")
    end = request.args.get("end")
    if start or end:
        return jsonify(get_summary_range(start, end))
    period = request.args.get("period", "this-month")
    return jsonify(get_summary(period))
