"""
One-shot migration: populate account_buckets from existing transactions.

Idempotent — truncates the table first, then walks every transaction row
and increments the correct bucket column based on type and auto-dist marker.

After running, verifies that bucket totals match a fresh aggregation of
the transactions table. Does NOT drop accounts.balance (that's a separate step).

Usage:
    python3 scripts/migrate_buckets.py
"""
import sys
from collections import defaultdict
from pathlib import Path

sys.path.insert(0, str(Path(__file__).parent.parent))

from backend.db import get_connection

AUTO_DIST_NOTE = "auto-distribution from salary"


def main():
    with get_connection() as conn:
        # 1. Truncate buckets for a clean rebuild
        conn.execute("DELETE FROM account_buckets")

        # 2. Walk every transaction, classify, accumulate
        txns = conn.execute(
            "SELECT amount, type, category, note, date FROM transactions"
        ).fetchall()

        # in-memory accumulator: (slug, year_month) -> {income, expense, auto_dist_in, auto_dist_out}
        acc = defaultdict(lambda: {"income": 0, "expense": 0, "auto_dist_in": 0, "auto_dist_out": 0})

        for t in txns:
            month = t["date"][:7]
            key = (t["category"], month)
            is_auto_dist = (t["note"] == AUTO_DIST_NOTE)
            if is_auto_dist:
                if t["type"] == "income":
                    acc[key]["auto_dist_in"] += t["amount"]
                else:
                    acc[key]["auto_dist_out"] += t["amount"]
            else:
                if t["type"] == "income":
                    acc[key]["income"] += t["amount"]
                else:
                    acc[key]["expense"] += t["amount"]

        # 3. Bulk insert
        for (slug, year_month), cols in acc.items():
            conn.execute(
                """
                INSERT INTO account_buckets (slug, year_month, income, expense, auto_dist_in, auto_dist_out)
                VALUES (?, ?, ?, ?, ?, ?)
                """,
                (slug, year_month, cols["income"], cols["expense"], cols["auto_dist_in"], cols["auto_dist_out"]),
            )
        conn.commit()

        # 4. Verify
        print(f"Migrated {len(txns)} transactions into {len(acc)} bucket rows.")
        print()
        print("Verification — bucket sums vs direct transaction aggregations:")
        for col, sql in [
            ("income",        f"SUM(CASE WHEN type='income'  AND note IS NOT '{AUTO_DIST_NOTE}' THEN amount ELSE 0 END)"),
            ("expense",       f"SUM(CASE WHEN type='expense' AND note IS NOT '{AUTO_DIST_NOTE}' THEN amount ELSE 0 END)"),
            ("auto_dist_in",  f"SUM(CASE WHEN type='income'  AND note  = '{AUTO_DIST_NOTE}' THEN amount ELSE 0 END)"),
            ("auto_dist_out", f"SUM(CASE WHEN type='expense' AND note  = '{AUTO_DIST_NOTE}' THEN amount ELSE 0 END)"),
        ]:
            txn_total = conn.execute(f"SELECT COALESCE({sql}, 0) FROM transactions").fetchone()[0]
            bucket_total = conn.execute(f"SELECT COALESCE(SUM({col}), 0) FROM account_buckets").fetchone()[0]
            match = "✓" if abs(txn_total - bucket_total) < 1e-6 else "✗ MISMATCH"
            print(f"  {col:14} txns={txn_total:>16,.0f}  buckets={bucket_total:>16,.0f}  {match}")


if __name__ == "__main__":
    main()
