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


def update_transaction(txn_id: int, amount: float = None, note: str = None, date: str = None):
    """
    Edit a transaction's amount, note and/or date. Type and category are immutable.

    Auto-distribution rows (note='auto-distribution from salary') cannot be
    edited directly — edit the parent salary row instead.

    For salary income rows: an amount or date change uses delete-and-reinsert to
    correctly re-run the salary cascade at the (possibly new) date. The returned
    new_id replaces the old id.

    A date change that crosses a month boundary moves the transaction's bucket
    impact from the old month to the new month, since buckets are month-keyed.

    Returns a dict with the result including new_id (may equal txn_id for
    non-salary edits).
    """
    if amount is None and note is None and date is None:
        raise ValueError("Supply at least one of: amount, note, date")

    if date is not None:
        try:
            datetime.strptime(date, "%Y-%m-%d")
        except ValueError:
            raise ValueError("Date must be in YYYY-MM-DD format")

    with get_connection() as conn:
        row = transaction_repo.get_by_id(conn, txn_id)
        if row is None:
            return None

        if row["note"] == AUTO_DIST_NOTE:
            raise ValueError("Cannot edit auto-distribution rows directly. Edit the parent salary transaction instead.")

    new_date = date if date is not None else row["date"]
    amount_changed = amount is not None and amount != row["amount"]
    date_changed = date is not None and date != row["date"]
    month_changed = date_changed and new_date[:7] != row["date"][:7]

    # Salary amount or date change: cascade-delete old + reinsert at new date
    if (amount_changed or date_changed) and row["category"] == "salary" and row["type"] == "income":
        delete_transaction(txn_id)
        new_id, distributed = insert_transaction(
            amount=amount if amount is not None else row["amount"],
            type=row["type"],
            category=row["category"],
            subcategory=row["subcategory"],
            note=note if note is not None else row["note"],
            date=new_date,
        )
        return {"new_id": new_id, "old_id": txn_id, "salary_redistributed": True, "distributions": distributed}

    # Non-salary or note-only edit: in-place update
    with get_connection() as conn:
        old_month = row["date"][:7]
        new_month = new_date[:7]
        old_amt = row["amount"]
        new_amt = amount if amount is not None else old_amt

        # Reverse the full old impact from the old month and apply the full new
        # impact to the new month. When only the amount changed within the same
        # month this nets to (new_amt - old_amt) on that month's bucket.
        if amount_changed or month_changed:
            if row["type"] == "income":
                bucket_repo.apply_delta(conn, row["category"], old_month, income=-old_amt)
                bucket_repo.apply_delta(conn, row["category"], new_month, income=new_amt)
            else:
                bucket_repo.apply_delta(conn, row["category"], old_month, expense=-old_amt)
                bucket_repo.apply_delta(conn, row["category"], new_month, expense=new_amt)

        if amount_changed:
            conn.execute("UPDATE transactions SET amount = ? WHERE id = ?", (new_amt, txn_id))

        if date_changed:
            conn.execute("UPDATE transactions SET date = ? WHERE id = ?", (new_date, txn_id))

        if note is not None:
            transaction_repo.update_note(conn, txn_id, note)

        conn.commit()

    return {"new_id": txn_id, "old_id": txn_id, "salary_redistributed": False}
