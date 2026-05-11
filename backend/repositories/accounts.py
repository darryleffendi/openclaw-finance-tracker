import json

from backend.db import get_connection


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
