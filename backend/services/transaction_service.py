from datetime import datetime

from backend.db import get_connection
from backend.repositories import account_bucket_repository as bucket_repo
from backend.repositories import account_repository as account_repo
from backend.repositories import transaction_repository as transaction_repo
from backend.services.distribution_service import distribute_within


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
    year_month = date[:7]

    with get_connection() as conn:
        txn_id = transaction_repo.insert(
            conn,
            amount=amount,
            type=type,
            category=category,
            subcategory=subcategory,
            note=note,
            date=date,
        )

        acct = account_repo.get_by_slug(conn, category)
        distributed = []
        if acct:
            if type == "income":
                bucket_repo.apply_delta(conn, category, year_month, income=amount)
            else:
                bucket_repo.apply_delta(conn, category, year_month, expense=amount)
            if category == "salary" and type == "income":
                distributed = distribute_within(conn, "salary", amount, date)

        conn.commit()
        return txn_id, distributed


def delete_transaction(txn_id: int) -> bool:
    with get_connection() as conn:
        row = transaction_repo.get_by_id(conn, txn_id)
        if row is None:
            return False

        # Cascade-delete auto-distribution rows if deleting a salary income.
        # Reverses both the target income rows AND the source expense mirror row.
        if row["category"] == "salary" and row["type"] == "income":
            dr_month = row["date"][:7]
            for dr in transaction_repo.find_salary_distributions(conn, row["date"]):
                transaction_repo.delete(conn, dr["id"])
                if dr["type"] == "income":
                    bucket_repo.apply_delta(conn, dr["category"], dr_month, auto_dist_in=-dr["amount"])
                else:
                    bucket_repo.apply_delta(conn, dr["category"], dr_month, auto_dist_out=-dr["amount"])

        # Reverse the main row's bucket impact. Skip if this row is itself an
        # auto-distribution (handled in the cascade above to avoid double-reversal).
        if row["note"] != "auto-distribution from salary":
            row_month = row["date"][:7]
            if row["type"] == "income":
                bucket_repo.apply_delta(conn, row["category"], row_month, income=-row["amount"])
            else:
                bucket_repo.apply_delta(conn, row["category"], row_month, expense=-row["amount"])

        transaction_repo.delete(conn, txn_id)
        conn.commit()
        return True
