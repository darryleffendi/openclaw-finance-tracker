from backend.db import get_connection


# ── Operations that take a caller-supplied connection ──────────────────────
# Used by services that compose multiple writes into one transaction.

def insert(conn, *, amount, type, category, subcategory, note, date):
    cursor = conn.execute(
        "INSERT INTO transactions (date, amount, type, category, subcategory, note) "
        "VALUES (?, ?, ?, ?, ?, ?)",
        (date, amount, type, category, subcategory, note),
    )
    return cursor.lastrowid


def delete(conn, txn_id):
    conn.execute("DELETE FROM transactions WHERE id = ?", (txn_id,))


def get_by_id(conn, txn_id):
    return conn.execute(
        "SELECT * FROM transactions WHERE id = ?", (txn_id,)
    ).fetchone()


def find_salary_distributions(conn, date):
    return conn.execute(
        "SELECT id, amount, category FROM transactions "
        "WHERE note = 'auto-distribution from salary' AND date = ?",
        (date,),
    ).fetchall()


# ── Standalone read operations (own their own connection) ──────────────────

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
