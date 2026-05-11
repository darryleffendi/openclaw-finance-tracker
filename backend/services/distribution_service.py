from datetime import datetime

from backend.db import get_connection
from backend.repositories import account_repository as account_repo
from backend.repositories import transaction_repository as transaction_repo


def distribute_within(conn, salary_amount: float, date: str):
    """
    Distribute a deposit across all expense/savings accounts in proportion
    to their monthly_budget. Operates on the caller's open connection — does
    not commit. Returns the list of per-account allocations.

    If salary_amount >= total budget: each account gets exactly its monthly_budget.
    If salary_amount < total budget: each account gets a proportional share.
    Any surplus stays in the source account (caller's responsibility).
    """
    targets = account_repo.get_distribution_targets(conn)

    total_budget = sum(t["monthly_budget"] for t in targets)
    if total_budget == 0 or not targets:
        return []

    scale = min(1.0, salary_amount / total_budget)
    distributed = []
    allocated = 0.0

    for i, target in enumerate(targets):
        if i == len(targets) - 1:
            # Last account: give it the exact remainder to avoid float drift
            share = round(salary_amount * scale - allocated)
        else:
            share = round(target["monthly_budget"] * scale)
        allocated += share

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
        account_repo.update_balance(conn, target["slug"], share)
        distributed.append({"account": target["slug"], "amount": share})

    return distributed


def distribute_salary(amount: float, source_account: str = "salary") -> dict:
    """Manual distribution — for freelance or other income sources."""
    date = datetime.now().strftime("%Y-%m-%d")
    with get_connection() as conn:
        distributed = distribute_within(conn, amount, date)
        conn.commit()
    return {"source": source_account, "total": amount, "distributions": distributed}
