from backend.db import get_connection

ALLOWED_UPDATE_FIELDS = {"name", "amount", "type", "category", "subcategory", "note", "day_of_month", "enabled"}


# ── Conn-passing operations ────────────────────────────────────────────────

def get_due(conn, year_month: str):
    """Return all enabled rules that haven't run yet this month."""
    return conn.execute(
        """
        SELECT * FROM recurring_transactions
        WHERE enabled = 1
          AND (last_run_month IS NULL OR last_run_month != ?)
        ORDER BY id ASC
        """,
        (year_month,),
    ).fetchall()


def mark_run(conn, rule_id: int, year_month: str):
    conn.execute(
        "UPDATE recurring_transactions SET last_run_month = ? WHERE id = ?",
        (year_month, rule_id),
    )


# ── Standalone operations ──────────────────────────────────────────────────

def get_all():
    with get_connection() as conn:
        rows = conn.execute(
            "SELECT * FROM recurring_transactions ORDER BY id ASC"
        ).fetchall()
        return [dict(r) for r in rows]


def get_by_id(rule_id: int):
    with get_connection() as conn:
        row = conn.execute(
            "SELECT * FROM recurring_transactions WHERE id = ?", (rule_id,)
        ).fetchone()
        return dict(row) if row else None


def create(name, amount, type, category, day_of_month, subcategory=None, note=None, enabled=1):
    with get_connection() as conn:
        cursor = conn.execute(
            """
            INSERT INTO recurring_transactions
                (name, amount, type, category, subcategory, note, day_of_month, enabled)
            VALUES (?, ?, ?, ?, ?, ?, ?, ?)
            """,
            (name, amount, type, category, subcategory, note, day_of_month, enabled),
        )
        conn.commit()
        return cursor.lastrowid


def update(rule_id: int, **fields) -> bool:
    unknown = set(fields) - ALLOWED_UPDATE_FIELDS
    if unknown:
        raise ValueError(f"Unknown recurring fields: {sorted(unknown)}")
    if not fields:
        raise ValueError("No fields supplied")
    set_clauses = [f"{k} = ?" for k in fields]
    params = list(fields.values()) + [rule_id]
    with get_connection() as conn:
        cursor = conn.execute(
            f"UPDATE recurring_transactions SET {', '.join(set_clauses)} WHERE id = ?",
            params,
        )
        conn.commit()
        return cursor.rowcount > 0


def delete(rule_id: int) -> bool:
    with get_connection() as conn:
        cursor = conn.execute(
            "DELETE FROM recurring_transactions WHERE id = ?", (rule_id,)
        )
        conn.commit()
        return cursor.rowcount > 0
