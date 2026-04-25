import json
import sqlite3
from datetime import datetime
from pathlib import Path

DB_PATH = Path(__file__).parent / "finance.db"


def get_connection():
    conn = sqlite3.connect(DB_PATH)
    conn.row_factory = sqlite3.Row
    return conn


def init_db():
    from seeds import ACCOUNTS
    with get_connection() as conn:
        conn.execute("""
            CREATE TABLE IF NOT EXISTS transactions (
                id          INTEGER PRIMARY KEY AUTOINCREMENT,
                date        TEXT NOT NULL,
                amount      REAL NOT NULL,
                type        TEXT NOT NULL CHECK(type IN ('income', 'expense')),
                category    TEXT NOT NULL,
                subcategory TEXT,
                note        TEXT,
                created_at  TEXT DEFAULT (datetime('now'))
            )
        """)
        conn.execute("""
            CREATE TABLE IF NOT EXISTS accounts (
                slug           TEXT    PRIMARY KEY NOT NULL,
                display_name   TEXT    NOT NULL,
                type           TEXT    NOT NULL CHECK(type IN ('income', 'expense', 'holding', 'savings')),
                monthly_budget REAL    NOT NULL DEFAULT 0,
                balance        REAL    NOT NULL DEFAULT 0,
                subcategories  TEXT    NOT NULL DEFAULT '[]',
                sort_order     INTEGER NOT NULL DEFAULT 0,
                created_at     TEXT    DEFAULT (datetime('now'))
            )
        """)
        for acct in ACCOUNTS:
            conn.execute(
                """
                INSERT OR IGNORE INTO accounts
                    (slug, display_name, type, monthly_budget, subcategories, sort_order)
                VALUES (?, ?, ?, ?, ?, ?)
                """,
                (
                    acct["slug"],
                    acct["display_name"],
                    acct["type"],
                    acct["monthly_budget"],
                    json.dumps(acct["subcategories"]),
                    acct["sort_order"],
                ),
            )
        conn.commit()



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


def get_accounts():
    with get_connection() as conn:
        rows = conn.execute(
            "SELECT * FROM accounts ORDER BY sort_order ASC"
        ).fetchall()
        result = []
        for row in rows:
            d = dict(row)
            d["subcategories"] = json.loads(d["subcategories"])
            result.append(d)
        return result


def update_account_budget(slug: str, monthly_budget: float) -> bool:
    with get_connection() as conn:
        cursor = conn.execute(
            "UPDATE accounts SET monthly_budget = ? WHERE slug = ?",
            (monthly_budget, slug),
        )
        conn.commit()
        return cursor.rowcount > 0


def get_summary(period: str = "this-month"):
    transactions = get_transactions_by_period(period)
    # Exclude auto-distribution rows from the summary to avoid double-counting
    real_txns = [t for t in transactions if t.get("note") != "auto-distribution from salary"]
    income = sum(t["amount"] for t in real_txns if t["type"] == "income")
    expense = sum(t["amount"] for t in real_txns if t["type"] == "expense")
    return {
        "period": period,
        "income": income,
        "expense": expense,
        "balance": income - expense,
        "transaction_count": len(real_txns),
        "accounts": get_accounts(),
    }


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


def distribute_salary(amount: float, source_account: str = "salary") -> dict:
    """Manual distribution — for freelance or other income sources."""
    date = datetime.now().strftime("%Y-%m-%d")
    with get_connection() as conn:
        distributed = _distribute_salary(conn, amount, date)
        conn.commit()
    return {"source": source_account, "total": amount, "distributions": distributed}


def wipe_all(confirm: bool = False):
    if not confirm:
        return {"wiped": False, "reason": "Pass confirm=True to wipe"}
    with get_connection() as conn:
        conn.execute("DELETE FROM transactions")
        conn.execute("UPDATE accounts SET balance = 0")
        conn.commit()
    return {"wiped": True}


# Always initialize on import
init_db()
