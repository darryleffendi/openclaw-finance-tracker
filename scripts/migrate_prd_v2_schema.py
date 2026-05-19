"""
PRD v2 schema migration — additive, idempotent, schema-only.

Run once after upgrading the codebase. Live data (existing account budgets,
per_day_budget flags, etc.) is left untouched. Apply seed-value changes via
`cli.py set-account` when ready.

This script triggers init_db() which:
  - Adds per_day_budget column (default 0) if absent
  - Creates recurring_transactions table if absent
  - Creates idx_txn_date and idx_txn_category_date if absent
  - Inserts the new `investments` account row via INSERT OR IGNORE
    (additive: doesn't affect existing rows)

Usage:
    python3 scripts/migrate_prd_v2_schema.py
"""
import shutil
import sys
from datetime import datetime
from pathlib import Path

sys.path.insert(0, str(Path(__file__).parent.parent))

from backend.db import DB_PATH, get_connection


def main():
    # 1. Backup
    backup_dir = Path(__file__).parent.parent / "finance-db-backup"
    backup_dir.mkdir(exist_ok=True)
    ts = datetime.now().strftime("%Y%m%d-%H%M%S")
    backup_path = backup_dir / f"finance-pre-prd-v2-{ts}.db"
    shutil.copy(DB_PATH, backup_path)
    print(f"Backup: {backup_path}")

    # 2. Trigger schema sync (init_db ran on import; re-import explicitly for clarity)
    import backend.db  # noqa: F401  — running init_db on import
    print("Schema sync complete (via init_db).")

    # 3. Verify
    with get_connection() as conn:
        print()
        print("=== Verification ===")

        cols = {r["name"] for r in conn.execute("PRAGMA table_info(accounts)").fetchall()}
        print(f"  accounts.per_day_budget present: {'per_day_budget' in cols}")

        tables = {r["name"] for r in conn.execute(
            "SELECT name FROM sqlite_master WHERE type='table'"
        ).fetchall()}
        print(f"  recurring_transactions table present: {'recurring_transactions' in tables}")

        indexes = {r["name"] for r in conn.execute(
            "SELECT name FROM sqlite_master WHERE type='index'"
        ).fetchall()}
        print(f"  idx_txn_date present:          {'idx_txn_date' in indexes}")
        print(f"  idx_txn_category_date present: {'idx_txn_category_date' in indexes}")

        n_accounts = conn.execute("SELECT COUNT(*) FROM accounts").fetchone()[0]
        n_investments = conn.execute(
            "SELECT COUNT(*) FROM accounts WHERE slug='investments'"
        ).fetchone()[0]
        print(f"  total accounts: {n_accounts}  (investments row present: {bool(n_investments)})")

    print()
    print("Done. To apply seed-value changes, use cli.py set-account (Stream 2).")


if __name__ == "__main__":
    main()
