"""
Backfill transactions.parent_id on existing auto-distribution rows.

Before parent_id existed, distribution rows were linked to their salary only by
sharing its date. This links each one to the salary income row on the same
date. Aborts if any date has more or fewer than one salary income, since the
link would be ambiguous. Idempotent: only touches rows with parent_id NULL.

Usage:
    python3 scripts/migrate_parent_id.py
"""
import shutil
import sys
from datetime import datetime
from pathlib import Path

sys.path.insert(0, str(Path(__file__).parent.parent))

from backend.db import DB_PATH, get_connection  # init_db adds the parent_id column

AUTO_DIST_NOTE = "auto-distribution from salary"


def main():
    backup_dir = Path(__file__).parent.parent / "finance-db-backup"
    backup_dir.mkdir(exist_ok=True)
    ts = datetime.now().strftime("%Y%m%d-%H%M%S")
    backup_path = backup_dir / f"finance-pre-parent-id-{ts}.db"
    shutil.copy(DB_PATH, backup_path)
    print(f"Backup: {backup_path}")

    with get_connection() as conn:
        dates = [r["date"] for r in conn.execute(
            "SELECT DISTINCT date FROM transactions WHERE note = ? AND parent_id IS NULL",
            (AUTO_DIST_NOTE,),
        )]
        for date in dates:
            salaries = conn.execute(
                "SELECT id FROM transactions WHERE category = 'salary' AND type = 'income' "
                "AND date = ? AND parent_id IS NULL",
                (date,),
            ).fetchall()
            if len(salaries) != 1:
                sys.exit(f"Abort: {len(salaries)} salary incomes on {date}, cannot link unambiguously.")
            cur = conn.execute(
                "UPDATE transactions SET parent_id = ? WHERE note = ? AND date = ? AND parent_id IS NULL",
                (salaries[0]["id"], AUTO_DIST_NOTE, date),
            )
            print(f"{date}: linked {cur.rowcount} rows to salary #{salaries[0]['id']}")
        conn.commit()


if __name__ == "__main__":
    main()
