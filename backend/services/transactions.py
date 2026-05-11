from datetime import datetime

from backend.db import get_connection
from backend.repositories import accounts as accounts_repo
from backend.repositories import transactions as transactions_repo
from backend.services.distribution import distribute_within


def insert_transaction(
    amount: float,
    type: str,
    category: str,
    subcategory: str = None,
    note: str = None,
    date: str = None,
):
    if date is None:
        date = datetime.now().strftime("%Y-%m-%d")

    with get_connection() as conn:
        txn_id = transactions_repo.insert(
            conn,
            amount=amount,
            type=type,
            category=category,
            subcategory=subcategory,
            note=note,
            date=date,
        )

        acct = accounts_repo.get_by_slug(conn, category)
        distributed = []
        if acct:
            delta = amount if type == "income" else -amount
            accounts_repo.update_balance(conn, category, delta)
            if category == "salary" and type == "income":
                distributed = distribute_within(conn, amount, date)

        conn.commit()
        return txn_id, distributed


def delete_transaction(txn_id: int) -> bool:
    with get_connection() as conn:
        row = transactions_repo.get_by_id(conn, txn_id)
        if row is None:
            return False

        # Cascade-delete auto-distribution rows if deleting a salary income
        if row["category"] == "salary" and row["type"] == "income":
            for dr in transactions_repo.find_salary_distributions(conn, row["date"]):
                transactions_repo.delete(conn, dr["id"])
                accounts_repo.update_balance(conn, dr["category"], -dr["amount"])

        # Reverse the main row's balance impact. Skip if this row is itself an
        # auto-distribution (handled in the cascade above to avoid double-reversal).
        if row["note"] != "auto-distribution from salary":
            delta = row["amount"] if row["type"] == "income" else -row["amount"]
            accounts_repo.update_balance(conn, row["category"], -delta)

        transactions_repo.delete(conn, txn_id)
        conn.commit()
        return True
