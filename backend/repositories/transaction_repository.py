from backend.db import get_connection

AUTO_DIST_NOTE = "auto-distribution from salary"


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


def update_note(conn, txn_id, note):
    conn.execute("UPDATE transactions SET note = ? WHERE id = ?", (note, txn_id))


def find_salary_distributions(conn, date):
    return conn.execute(
        "SELECT id, amount, type, category FROM transactions "
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


def _range_clause(start, end):
    """Build a WHERE clause + named params for an inclusive [start, end] date range.
    Either bound may be None; both None means no filter (all time)."""
    if start and end:
        return "WHERE date BETWEEN :start AND :end", {"start": start, "end": end}
    if start:
        return "WHERE date >= :start", {"start": start}
    if end:
        return "WHERE date <= :end", {"end": end}
    return "", {}


def get_transactions_by_range(start, end):
    clause, params = _range_clause(start, end)
    with get_connection() as conn:
        rows = conn.execute(
            f"SELECT * FROM transactions {clause} ORDER BY date DESC, id DESC",
            params,
        ).fetchall()
        return [dict(row) for row in rows]


def aggregate_accounts_by_range(start, end):
    """Per-account (category) totals for a date range, shaped like account_buckets
    rows. Auto-distribution transactions are split out into auto_dist_in/out so
    the frontend's spentForAccount() logic works unchanged. `IS`/`IS NOT` is used
    (not =/!=) so NULL-note rows compare correctly."""
    clause, params = _range_clause(start, end)
    params["ad"] = AUTO_DIST_NOTE
    with get_connection() as conn:
        rows = conn.execute(
            f"""
            SELECT
                category AS slug,
                COALESCE(SUM(CASE WHEN type='income'  AND note IS NOT :ad THEN amount ELSE 0 END), 0) AS income,
                COALESCE(SUM(CASE WHEN type='expense' AND note IS NOT :ad THEN amount ELSE 0 END), 0) AS expense,
                COALESCE(SUM(CASE WHEN type='income'  AND note IS     :ad THEN amount ELSE 0 END), 0) AS auto_dist_in,
                COALESCE(SUM(CASE WHEN type='expense' AND note IS     :ad THEN amount ELSE 0 END), 0) AS auto_dist_out
            FROM transactions
            {clause}
            GROUP BY category
            """,
            params,
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
