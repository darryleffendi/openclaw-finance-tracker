import json

from backend.db import get_connection

ALLOWED_UPDATE_FIELDS = {"monthly_budget", "per_day_budget", "subcategories", "display_name"}


# ── Operations that take a caller-supplied connection ──────────────────────
# Used by services that compose multiple writes into one transaction.

def get_by_slug(conn, slug):
    return conn.execute(
        "SELECT * FROM accounts WHERE slug = ?", (slug,)
    ).fetchone()


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


def get_account(slug: str):
    with get_connection() as conn:
        row = conn.execute("SELECT * FROM accounts WHERE slug = ?", (slug,)).fetchone()
        if row is None:
            return None
        d = dict(row)
        d["subcategories"] = json.loads(d["subcategories"])
        return d


def update_account(slug: str, **fields) -> bool:
    """
    Partial update. Accepts any subset of: monthly_budget, per_day_budget,
    subcategories (list[str]), display_name. Unknown keys raise ValueError.
    Returns True if a row was updated, False if slug not found.
    """
    unknown = set(fields) - ALLOWED_UPDATE_FIELDS
    if unknown:
        raise ValueError(f"Unknown account fields: {sorted(unknown)}")
    if not fields:
        raise ValueError("No fields supplied")

    set_clauses = []
    params = []
    for key, val in fields.items():
        if key == "subcategories":
            if not isinstance(val, list):
                raise ValueError("subcategories must be a list")
            set_clauses.append("subcategories = ?")
            params.append(json.dumps(val))
        else:
            set_clauses.append(f"{key} = ?")
            params.append(val)
    params.append(slug)

    with get_connection() as conn:
        cursor = conn.execute(
            f"UPDATE accounts SET {', '.join(set_clauses)} WHERE slug = ?",
            params,
        )
        conn.commit()
        return cursor.rowcount > 0


def update_account_budget(slug: str, monthly_budget: float) -> bool:
    """Back-compat shim — prefer update_account."""
    return update_account(slug, monthly_budget=monthly_budget)
