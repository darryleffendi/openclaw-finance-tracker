from datetime import datetime

from backend.db import get_connection
from backend.repositories import account_bucket_repository as bucket_repo
from backend.repositories import account_repository as account_repo
from backend.repositories import transaction_repository as transaction_repo
from backend.services.distribution_service import distribute_within

AUTO_DIST_NOTE = "auto-distribution from salary"


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


def update_transaction(txn_id: int, amount: float = None, note: str = None):
    """
    Edit a transaction's amount and/or note. Type and category are immutable.

    Auto-distribution rows (note='auto-distribution from salary') cannot be
    edited directly — edit the parent salary row instead.

    For salary income rows: amount change uses delete-and-reinsert to correctly
    re-run the salary cascade. The returned new_id replaces the old id.

    Returns a dict with the result including new_id (may equal txn_id for
    non-salary edits).
    """
    if amount is None and note is None:
        raise ValueError("Supply at least one of: amount, note")

    with get_connection() as conn:
        row = transaction_repo.get_by_id(conn, txn_id)
        if row is None:
            return None

        if row["note"] == AUTO_DIST_NOTE:
            raise ValueError("Cannot edit auto-distribution rows directly. Edit the parent salary transaction instead.")

    # Salary amount change: cascade-delete old + reinsert with new amount
    if amount is not None and amount != row["amount"] and row["category"] == "salary" and row["type"] == "income":
        delete_transaction(txn_id)
        new_id, distributed = insert_transaction(
            amount=amount,
            type=row["type"],
            category=row["category"],
            subcategory=row["subcategory"],
            note=note if note is not None else row["note"],
            date=row["date"],
        )
        return {"new_id": new_id, "old_id": txn_id, "salary_redistributed": True, "distributions": distributed}

    # Non-salary or note-only edit: in-place update
    with get_connection() as conn:
        row_month = row["date"][:7]

        if amount is not None and amount != row["amount"]:
            old_amt = row["amount"]
            new_amt = amount
            # Update the row's amount
            conn.execute("UPDATE transactions SET amount = ? WHERE id = ?", (new_amt, txn_id))
            # Reverse old bucket impact and apply new
            if row["type"] == "income":
                bucket_repo.apply_delta(conn, row["category"], row_month, income=new_amt - old_amt)
            else:
                bucket_repo.apply_delta(conn, row["category"], row_month, expense=new_amt - old_amt)

        if note is not None:
            transaction_repo.update_note(conn, txn_id, note)

        conn.commit()

    return {"new_id": txn_id, "old_id": txn_id, "salary_redistributed": False}
