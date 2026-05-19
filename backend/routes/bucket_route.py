from datetime import datetime

from flask import Blueprint, jsonify, request

from backend.auth import login_required
from backend.repositories import account_bucket_repository as bucket_repo

bp = Blueprint("buckets", __name__)


@bp.get("/api/buckets")
@login_required
def list_buckets():
    month = request.args.get("month") or datetime.now().strftime("%Y-%m")
    return jsonify({
        "month": month,
        "buckets": bucket_repo.get_all_for_month(month),
    })
