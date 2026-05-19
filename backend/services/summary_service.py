from datetime import datetime

from backend.repositories import account_bucket_repository as bucket_repo
from backend.repositories.account_repository import get_accounts
from backend.repositories.transaction_repository import get_transactions_by_period

AUTO_DIST_NOTE = "auto-distribution from salary"


def _month_for_period(period):
    """Map 'this-month' / 'last-month' to a YYYY-MM string. Returns None for other periods."""
    if period == "this-month":
        return datetime.now().strftime("%Y-%m")
    if period == "last-month":
        now = datetime.now()
        prev_year = now.year if now.month > 1 else now.year - 1
        prev_month = now.month - 1 if now.month > 1 else 12
        return f"{prev_year:04d}-{prev_month:02d}"
    return None


def get_summary(period: str = "this-month"):
    year_month = _month_for_period(period)
    if year_month is not None:
        # Fast path: aggregate across all account_buckets for this month.
        totals = bucket_repo.get_summary_for_month(year_month)
        income = totals["income"]
        expense = totals["expense"]
        # transaction_count still requires a txns query (buckets don't track row count)
        real_txns = [
            t for t in get_transactions_by_period(period)
            if t.get("note") != AUTO_DIST_NOTE
        ]
        txn_count = len(real_txns)
    else:
        # Fallback for day/week/all: aggregate from transactions directly
        real_txns = [
            t for t in get_transactions_by_period(period)
            if t.get("note") != AUTO_DIST_NOTE
        ]
        income = sum(t["amount"] for t in real_txns if t["type"] == "income")
        expense = sum(t["amount"] for t in real_txns if t["type"] == "expense")
        txn_count = len(real_txns)

    return {
        "period": period,
        "income": income,
        "expense": expense,
        "balance": income - expense,
        "transaction_count": txn_count,
        "accounts": get_accounts(),
    }
