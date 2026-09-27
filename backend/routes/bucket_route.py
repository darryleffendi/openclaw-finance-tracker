from datetime import datetime

from flask import Blueprint, jsonify, request

from backend.auth import login_required
from backend.repositories import account_bucket_repository as bucket_repo
from backend.repositories.transaction_repository import aggregate_accounts_by_range
from backend.services.recurring_service import materialize_if_needed

bp = Blueprint("buckets", __name__)


@bp.get("/api/buckets")
@login_required
def list_buckets():
    start = request.args.get("start")
    end = request.args.get("end")
    if start or end:
        materialize_if_needed()
        return jsonify({
            "start": start,
            "end": end,
            "buckets": aggregate_accounts_by_range(start, end),
        })
    month = request.args.get("month") or datetime.now().strftime("%Y-%m")
    return jsonify({
        "month": month,
        "buckets": bucket_repo.get_all_for_month(month),
    })
