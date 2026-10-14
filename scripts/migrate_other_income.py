"""
Replace the `freelance` holding account with an `other_income` income account,
and rename the auto-distribution note to the source-neutral "auto-distribution".

init_db (run on import) already inserts `other_income` from seeds. This deletes
`freelance`, aborting if anything still references it. Idempotent.

Usage:
    python3 scripts/migrate_other_income.py
"""
import shutil
import sys
from datetime import datetime
from pathlib import Path

sys.path.insert(0, str(Path(__file__).parent.parent))

from backend.db import DB_PATH, get_connection


def main():
    backup_dir = Path(__file__).parent.parent / "finance-db-backup"
    backup_dir.mkdir(exist_ok=True)
    ts = datetime.now().strftime("%Y%m%d-%H%M%S")
    backup_path = backup_dir / f"finance-pre-other-income-{ts}.db"
    shutil.copy(DB_PATH, backup_path)
    print(f"Backup: {backup_path}")

    with get_connection() as conn:
        refs = sum(
            conn.execute(f"SELECT COUNT(*) FROM {table} WHERE {col} = 'freelance'").fetchone()[0]
            for table, col in (
                ("transactions", "category"),
                ("account_buckets", "slug"),
                ("recurring_transactions", "category"),
            )
        )
        if refs:
            sys.exit(f"Abort: {refs} rows still reference 'freelance'.")
        cur = conn.execute("DELETE FROM accounts WHERE slug = 'freelance'")
        print(f"Removed freelance account: {cur.rowcount}")

        cur = conn.execute(
            "UPDATE transactions SET note = 'auto-distribution' WHERE note = 'auto-distribution from salary'"
        )
        print(f"Renamed auto-distribution notes: {cur.rowcount}")
        conn.commit()


if __name__ == "__main__":
    main()
