import json

from backend.db import get_connection


# ── Operations that take a caller-supplied connection ──────────────────────
# Used by services that compose multiple writes into one transaction.

def get_by_slug(conn, slug):
    return conn.execute(
        "SELECT * FROM accounts WHERE slug = ?", (slug,)
    ).fetchone()


def update_balance(conn, slug, delta):
    conn.execute(
        "UPDATE accounts SET balance = balance + ? WHERE slug = ?",
        (delta, slug),
    )


def get_distribution_targets(conn):
    return conn.execute(
        """
        SELECT slug, display_name, monthly_budget
        FROM accounts
        WHERE type IN ('expense', 'savings') AND monthly_budget > 0
        ORDER BY sort_order ASC
        """
    ).fetchall()


# ── Standalone operations (own their own connection) ───────────────────────

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
