import calendar
from datetime import datetime

from backend.db import get_connection
from backend.repositories import account_bucket_repository as bucket_repo
from backend.repositories import account_repository as account_repo
from backend.repositories import transaction_repository as transaction_repo
from backend.services.transaction_service import delete_transaction, insert_transfer
from backend.utils.date_utils import current_year_month


def _validate_month(year_month):
    try:
        datetime.strptime(year_month, "%Y-%m")
    except ValueError:
        raise ValueError("Month must be in YYYY-MM format")


def settle(year_month: str, force: bool = False) -> dict:
    """
    Bring every expense account's balance for the month to 0 with settlement
    transfers dated the month's last day. Leftovers move to savings first;
    deficits are then covered from savings (up to its balance for the month)
    and the remainder from investments, which may go negative.

    Re-running only settles what changed since, as settled accounts sit at 0.
    """
    _validate_month(year_month)
    if year_month >= current_year_month() and not force:
        raise ValueError(f"{year_month} has not ended yet. Pass force to settle it anyway.")

    y, m = (int(x) for x in year_month.split("-"))
    date = f"{year_month}-{calendar.monthrange(y, m)[1]:02d}"
    sub = transaction_repo.SETTLEMENT_SUBCATEGORY
    transfers = []

    def move(source, target, amount):
        insert_transfer(conn, source, target, amount, date, subcategory=sub)
        transfers.append({"from": source, "to": target, "amount": amount})

    with get_connection() as conn:
        balances = {b["slug"]: b["balance"] for b in bucket_repo.get_all_for_month_with_conn(conn, year_month)}

        deficits = []
        for slug in account_repo.get_slugs_by_type(conn, "expense"):
            balance = round(balances.get(slug, 0))
            if balance > 0:
                move(slug, "savings", balance)
            elif balance < 0:
                deficits.append((slug, -balance))

        savings_left = max(0, round(balances.get("savings", 0)) + sum(t["amount"] for t in transfers))
        for slug, need in deficits:
            from_savings = min(need, savings_left)
            if from_savings:
                move("savings", slug, from_savings)
                savings_left -= from_savings
            if need - from_savings:
                move("investments", slug, need - from_savings)

        conn.commit()

    return {"month": year_month, "date": date, "transfers": transfers}


def unsettle(year_month: str) -> dict:
    """Delete every settlement transfer of the month."""
    _validate_month(year_month)
    with get_connection() as conn:
        ids = [r["id"] for r in transaction_repo.find_settlement_sources(conn, year_month)]
    for txn_id in ids:
        delete_transaction(txn_id)
    return {"month": year_month, "removed_transfers": len(ids)}
