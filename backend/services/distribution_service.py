from datetime import datetime

from backend.db import get_connection
from backend.repositories import account_bucket_repository as bucket_repo
from backend.repositories import account_repository as account_repo
from backend.repositories import transaction_repository as transaction_repo


def distribute_within(conn, source_account: str, amount: float, date: str):
    """
    Distribute a deposit across all expense/savings accounts in proportion
    to their monthly_budget. Operates on the caller's open connection — does
    not commit. Returns the list of per-account allocations.

    Inserts one income row per target (for the audit trail) and one matching
    expense row on source_account for the total distributed, so the balance
    invariant `balance == sum(signed txn amounts)` holds on every account.
    """
    targets = account_repo.get_distribution_targets(conn)

    total_budget = sum(t["monthly_budget"] for t in targets)
    if total_budget == 0 or not targets:
        return []

    to_distribute = round(min(amount, total_budget))
    year_month = date[:7]
    distributed = []
    total_distributed = 0

    for i, target in enumerate(targets):
        if i == len(targets) - 1:
            # Last account absorbs rounding drift so the sum equals to_distribute exactly
            share = to_distribute - total_distributed
        else:
            share = round(target["monthly_budget"] * to_distribute / total_budget)

        if share <= 0:
            continue

        transaction_repo.insert(
            conn,
            amount=share,
            type="income",
            category=target["slug"],
            subcategory=None,
            note="auto-distribution from salary",
            date=date,
        )
        bucket_repo.apply_delta(conn, target["slug"], year_month, auto_dist_in=share)
        distributed.append({"account": target["slug"], "amount": share})
        total_distributed += share

    if total_distributed > 0:
        transaction_repo.insert(
            conn,
            amount=total_distributed,
            type="expense",
            category=source_account,
            subcategory=None,
            note="auto-distribution from salary",
            date=date,
        )
        bucket_repo.apply_delta(conn, source_account, year_month, auto_dist_out=total_distributed)

    return distributed


def distribute_salary(amount: float, source_account: str = "salary") -> dict:
    """Manual distribution — for freelance or other income sources."""
    date = datetime.now().strftime("%Y-%m-%d")
    with get_connection() as conn:
        distributed = distribute_within(conn, source_account, amount, date)
        conn.commit()
    return {"source": source_account, "total": amount, "distributions": distributed}
