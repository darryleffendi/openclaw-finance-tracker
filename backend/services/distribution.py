from datetime import datetime

from backend.db import get_connection


def _distribute_salary(conn, salary_amount: float, date: str):
    """
    Auto-distribute a salary deposit to all expense/savings accounts by
    their monthly_budget amounts. Called within an open connection/transaction.

    If salary_amount >= total budget: each account gets exactly its monthly_budget.
    If salary_amount < total budget: each account gets a proportional share.
    Any surplus stays in the salary account.
    """
    targets = conn.execute(
        """
        SELECT slug, display_name, monthly_budget
        FROM accounts
        WHERE type IN ('expense', 'savings') AND monthly_budget > 0
        ORDER BY sort_order ASC
        """
    ).fetchall()

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

        conn.execute(
            "INSERT INTO transactions (date, amount, type, category, note) VALUES (?, ?, 'income', ?, ?)",
            (date, share, target["slug"], f"auto-distribution from salary"),
        )
        conn.execute(
            "UPDATE accounts SET balance = balance + ? WHERE slug = ?",
            (share, target["slug"]),
        )
        distributed.append({"account": target["slug"], "amount": share})

    return distributed


def distribute_salary(amount: float, source_account: str = "salary") -> dict:
    """Manual distribution — for freelance or other income sources."""
    date = datetime.now().strftime("%Y-%m-%d")
    with get_connection() as conn:
        distributed = _distribute_salary(conn, amount, date)
        conn.commit()
    return {"source": source_account, "total": amount, "distributions": distributed}
