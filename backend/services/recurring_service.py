from datetime import date

from backend.db import get_connection
from backend.repositories import recurring_repository as recurring_repo
from backend.services.transaction_service import insert_transaction
from backend.utils.date_utils import clamp_day_to_month


def materialize_if_needed():
    """
    Insert materialized transactions for any recurring rule that hasn't run
    this month yet. Idempotent: safe to call on every API read.

    mark_run is called BEFORE insert_transaction so a crash after marking
    but before inserting leaves a phantom mark (recoverable via /run) rather
    than a duplicate row on the next page load.
    """
    today = date.today()
    year_month = today.strftime("%Y-%m")
    year, month = today.year, today.month

    with get_connection() as conn:
        due = recurring_repo.get_due(conn, year_month)
        if not due:
            return

        for rule in due:
            rule = dict(rule)
            day = clamp_day_to_month(year, month, rule["day_of_month"])
            txn_date = f"{year:04d}-{month:02d}-{day:02d}"

            recurring_repo.mark_run(conn, rule["id"], year_month)
        conn.commit()

    for rule in [dict(r) for r in due]:
        day = clamp_day_to_month(year, month, rule["day_of_month"])
        txn_date = f"{year:04d}-{month:02d}-{day:02d}"
        insert_transaction(
            amount=rule["amount"],
            type=rule["type"],
            category=rule["category"],
            subcategory=rule.get("subcategory"),
            note=rule.get("note") or f"recurring: {rule['name']}",
            date=txn_date,
        )


def list_rules():
    return recurring_repo.get_all()


def get_rule(rule_id: int):
    return recurring_repo.get_by_id(rule_id)


def create_rule(name, amount, type, category, day_of_month,
                subcategory=None, note=None, enabled=1):
    rule_id = recurring_repo.create(
        name=name, amount=amount, type=type, category=category,
        day_of_month=day_of_month, subcategory=subcategory,
        note=note, enabled=enabled,
    )
    return recurring_repo.get_by_id(rule_id)


def update_rule(rule_id: int, **fields) -> dict | None:
    ok = recurring_repo.update(rule_id, **fields)
    return recurring_repo.get_by_id(rule_id) if ok else None


def delete_rule(rule_id: int) -> bool:
    return recurring_repo.delete(rule_id)


def run_now():
    """Force materialization for current month regardless of last_run_month."""
    year_month = date.today().strftime("%Y-%m")
    year, month = date.today().year, date.today().month

    with get_connection() as conn:
        rules = conn.execute(
            "SELECT * FROM recurring_transactions WHERE enabled = 1 ORDER BY id ASC"
        ).fetchall()
        for rule in rules:
            recurring_repo.mark_run(conn, rule["id"], year_month)
        conn.commit()

    results = []
    for rule in [dict(r) for r in rules]:
        day = clamp_day_to_month(year, month, rule["day_of_month"])
        txn_date = f"{year:04d}-{month:02d}-{day:02d}"
        txn_id, dist = insert_transaction(
            amount=rule["amount"],
            type=rule["type"],
            category=rule["category"],
            subcategory=rule.get("subcategory"),
            note=rule.get("note") or f"recurring: {rule['name']}",
            date=txn_date,
        )
        results.append({"rule_id": rule["id"], "name": rule["name"], "txn_id": txn_id})
    return results
