import sqlite3
from datetime import datetime, date
from pathlib import Path

DB_PATH = Path(__file__).parent / "finance.db"


def get_connection():
    conn = sqlite3.connect(DB_PATH)
    conn.row_factory = sqlite3.Row
    return conn


def init_db():
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
        conn.commit()


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
        conn.commit()
        return cursor.lastrowid


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
            f"SELECT * FROM transactions {where} ORDER BY date DESC"
        ).fetchall()
        return [dict(row) for row in rows]


def get_transactions_by_category(category: str):
    with get_connection() as conn:
        rows = conn.execute(
            "SELECT * FROM transactions WHERE LOWER(category) = LOWER(?) ORDER BY date DESC",
            (category,),
        ).fetchall()
        return [dict(row) for row in rows]


def get_summary(period: str = "this-month"):
    transactions = get_transactions_by_period(period)
    income = sum(t["amount"] for t in transactions if t["type"] == "income")
    expense = sum(t["amount"] for t in transactions if t["type"] == "expense")
    return {
        "period": period,
        "income": income,
        "expense": expense,
        "balance": income - expense,
        "transaction_count": len(transactions),
    }


def get_all_transactions():
    return get_transactions_by_period("all")


def delete_transaction(transaction_id: int):
    with get_connection() as conn:
        cursor = conn.execute(
            "DELETE FROM transactions WHERE id = ?", (transaction_id,)
        )
        conn.commit()
        return cursor.rowcount > 0


# Always initialize on import
init_db()
