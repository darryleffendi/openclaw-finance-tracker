from flask import Blueprint, jsonify

from backend.auth import login_required
from backend.services.today_service import get_today

bp = Blueprint("today", __name__)


@bp.get("/api/today")
@login_required
def today():
    return jsonify(get_today())
