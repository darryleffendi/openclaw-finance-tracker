import json
import sqlite3
from pathlib import Path

from backend.seeds import ACCOUNTS

DB_PATH = Path(__file__).parent.parent / "finance.db"


def get_connection():
    conn = sqlite3.connect(DB_PATH)
    conn.row_factory = sqlite3.Row
    return conn


def init_db():
    with get_connection() as conn:
        conn.execute("""
            CREATE TABLE IF NOT EXISTS transactions (
                id          INTEGER PRIMARY KEY AUTOINCREMENT,
                date        TEXT NOT NULL,
                amount      REAL NOT NULL,
                type        TEXT NOT NULL CHECK(type IN ('income', 'expense')),
                category    TEXT NOT NULL,
                subcategory TEXT,
                note        TEXT,
                created_at  TEXT DEFAULT (datetime('now'))
            )
        """)
        conn.execute("""
            CREATE TABLE IF NOT EXISTS accounts (
                slug           TEXT    PRIMARY KEY NOT NULL,
                display_name   TEXT    NOT NULL,
                type           TEXT    NOT NULL CHECK(type IN ('income', 'expense', 'holding', 'savings')),
                monthly_budget REAL    NOT NULL DEFAULT 0,
                subcategories  TEXT    NOT NULL DEFAULT '[]',
                sort_order     INTEGER NOT NULL DEFAULT 0,
                created_at     TEXT    DEFAULT (datetime('now'))
            )
        """)
        conn.execute("""
            CREATE TABLE IF NOT EXISTS account_buckets (
                slug          TEXT NOT NULL,
                year_month    TEXT NOT NULL,
                income        REAL NOT NULL DEFAULT 0,
                expense       REAL NOT NULL DEFAULT 0,
                auto_dist_in  REAL NOT NULL DEFAULT 0,
                auto_dist_out REAL NOT NULL DEFAULT 0,
                PRIMARY KEY (slug, year_month),
                FOREIGN KEY (slug) REFERENCES accounts(slug)
            )
        """)
        for acct in ACCOUNTS:
            conn.execute(
                """
                INSERT OR IGNORE INTO accounts
                    (slug, display_name, type, monthly_budget, subcategories, sort_order)
                VALUES (?, ?, ?, ?, ?, ?)
                """,
                (
                    acct["slug"],
                    acct["display_name"],
                    acct["type"],
                    acct["monthly_budget"],
                    json.dumps(acct["subcategories"]),
                    acct["sort_order"],
                ),
            )
        conn.commit()


# Always initialize on import
init_db()
