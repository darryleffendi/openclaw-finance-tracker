from datetime import date

from backend.db import get_connection
from backend.repositories import account_bucket_repository as bucket_repo
from backend.repositories.account_repository import get_accounts
from backend.utils.date_utils import days_remaining_in_month


def get_today():
    """
    Compute today's daily spending allowance across all accounts where
    daily_budget_enabled is set.

    Formula per account:
        daily_allowance = balance / days_remaining_in_month

    balance = income + auto_dist_in - expense - auto_dist_out for this account
    in the current month, i.e. what was actually funded minus what was spent.
    days_remaining includes today (inclusive).

    Returns a negative total_allowance when the combined daily allowance is
    in the red — i.e. the month's funding for these categories is already
    exhausted or overrun.
    """
    today_iso = date.today().strftime("%Y-%m-%d")
    year_month = today_iso[:7]
    days_remaining = days_remaining_in_month(today_iso)

    daily_accounts = [a for a in get_accounts() if a.get("daily_budget_enabled")]

    breakdown = []
    total = 0

    with get_connection() as conn:
        for acct in daily_accounts:
            bucket = bucket_repo.get_for_month(conn, acct["slug"], year_month)
            spent = bucket["expense"] if bucket else 0
            remaining_in_month = bucket["balance"] if bucket else 0
            daily = round(remaining_in_month / days_remaining)
            breakdown.append({
                "category": acct["slug"],
                "display_name": acct["display_name"],
                "monthly_budget": acct["monthly_budget"],
                "spent_this_month": spent,
                "remaining_in_month": remaining_in_month,
                "daily_allowance": daily,
            })
            total += daily

    return {
        "date": today_iso,
        "days_remaining": days_remaining,
        "total_allowance": total,
        "over_budget": total < 0,
        "breakdown": breakdown,
    }
