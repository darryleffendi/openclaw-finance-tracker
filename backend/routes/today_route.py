from flask import Blueprint, jsonify

from backend.auth import login_required
from backend.services.recurring_service import materialize_if_needed
from backend.services.today_service import get_today

bp = Blueprint("today", __name__)


@bp.get("/api/today")
@login_required
def today():
    materialize_if_needed()
    return jsonify(get_today())
