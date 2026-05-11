from datetime import datetime

from backend.db import get_connection
from backend.services.distribution import _distribute_salary


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
        cursor = conn.execute(
            "INSERT INTO transactions (date, amount, type, category, subcategory, note) VALUES (?, ?, ?, ?, ?, ?)",
            (date, amount, type, category, subcategory, note),
        )
        txn_id = cursor.lastrowid

        # Update the account balance
        acct = conn.execute(
            "SELECT type FROM accounts WHERE slug = ?", (category,)
        ).fetchone()

        distributed = []
        if acct:
            delta = amount if type == "income" else -amount
            conn.execute(
                "UPDATE accounts SET balance = balance + ? WHERE slug = ?",
                (delta, category),
            )
            # Auto-distribute salary to expense/savings accounts
            if category == "salary" and type == "income":
                distributed = _distribute_salary(conn, amount, date)

        conn.commit()
        return txn_id, distributed


def get_transactions_by_period(period: str):
    queries = {
        "today": "WHERE date = date('now')",
        "this-week": "WHERE date >= date('now', 'weekday 0', '-7 days')",
        "this-month": "WHERE strftime('%Y-%m', date) = strftime('%Y-%m', 'now')",
        "last-month": "WHERE strftime('%Y-%m', date) = strftime('%Y-%m', date('now', '-1 month'))",
        "all": "",
    }
    where = queries.get(period, "WHERE date = date('now')")
    with get_connection() as conn:
        rows = conn.execute(
            f"SELECT * FROM transactions {where} ORDER BY date DESC, id DESC"
        ).fetchall()
        return [dict(row) for row in rows]


def get_transactions_by_category(category: str):
    with get_connection() as conn:
        rows = conn.execute(
            "SELECT * FROM transactions WHERE LOWER(category) = LOWER(?) ORDER BY date DESC, id DESC",
            (category,),
        ).fetchall()
        return [dict(row) for row in rows]


def get_all_transactions():
    return get_transactions_by_period("all")


def delete_transaction(transaction_id: int):
    with get_connection() as conn:
        row = conn.execute(
            "SELECT amount, type, category, note FROM transactions WHERE id = ?",
            (transaction_id,),
        ).fetchone()
        if row is None:
            return False

        # Cascade-delete auto-distribution rows if deleting a salary transaction
        if row["category"] == "salary" and row["type"] == "income":
            dist_rows = conn.execute(
                "SELECT id, amount, category FROM transactions WHERE note = 'auto-distribution from salary' AND date = (SELECT date FROM transactions WHERE id = ?)",
                (transaction_id,),
            ).fetchall()
            for dr in dist_rows:
                conn.execute("DELETE FROM transactions WHERE id = ?", (dr["id"],))
                conn.execute(
                    "UPDATE accounts SET balance = balance - ? WHERE slug = ?",
                    (dr["amount"], dr["category"]),
                )

        # Reverse the account balance for the main transaction
        # Skip reversal for auto-distribution rows (handled above or deleted separately)
        if row["note"] != "auto-distribution from salary":
            delta = row["amount"] if row["type"] == "income" else -row["amount"]
            conn.execute(
                "UPDATE accounts SET balance = balance - ? WHERE slug = ?",
                (delta, row["category"]),
            )

        conn.execute("DELETE FROM transactions WHERE id = ?", (transaction_id,))
        conn.commit()
        return True


def wipe_all(confirm: bool = False):
    if not confirm:
        return {"wiped": False, "reason": "Pass confirm=True to wipe"}
    with get_connection() as conn:
        conn.execute("DELETE FROM transactions")
        conn.execute("UPDATE accounts SET balance = 0")
        conn.commit()
    return {"wiped": True}
