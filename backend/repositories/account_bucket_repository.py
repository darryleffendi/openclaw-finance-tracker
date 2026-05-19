from backend.db import get_connection


# ── Operations that take a caller-supplied connection ──────────────────────
# Used by services that compose multiple writes into one transaction.

def apply_delta(conn, slug, year_month, *, income=0, expense=0, auto_dist_in=0, auto_dist_out=0):
    """
    Increment any subset of the bucket's columns. Creates the bucket row
    on first use via UPSERT (SQLite ON CONFLICT). Pass negative values to
    reverse a previous delta (used by delete_transaction).
    """
    conn.execute(
        """
        INSERT INTO account_buckets (slug, year_month, income, expense, auto_dist_in, auto_dist_out)
        VALUES (?, ?, ?, ?, ?, ?)
        ON CONFLICT(slug, year_month) DO UPDATE SET
            income        = income        + excluded.income,
            expense       = expense       + excluded.expense,
            auto_dist_in  = auto_dist_in  + excluded.auto_dist_in,
            auto_dist_out = auto_dist_out + excluded.auto_dist_out
        """,
        (slug, year_month, income, expense, auto_dist_in, auto_dist_out),
    )


def get_for_month(conn, slug, year_month):
    return conn.execute(
        "SELECT * FROM account_buckets WHERE slug = ? AND year_month = ?",
        (slug, year_month),
    ).fetchone()


def get_all_for_month_with_conn(conn, year_month):
    rows = conn.execute(
        "SELECT * FROM account_buckets WHERE year_month = ?",
        (year_month,),
    ).fetchall()
    return [dict(r) for r in rows]


def sum_all_time_with_conn(conn, slug):
    row = conn.execute(
        """
        SELECT
            COALESCE(SUM(income), 0)        AS income,
            COALESCE(SUM(expense), 0)       AS expense,
            COALESCE(SUM(auto_dist_in), 0)  AS auto_dist_in,
            COALESCE(SUM(auto_dist_out), 0) AS auto_dist_out
        FROM account_buckets WHERE slug = ?
        """,
        (slug,),
    ).fetchone()
    return dict(row) if row else None


# ── Standalone read operations (own their own connection) ──────────────────

def get_all_for_month(year_month):
    with get_connection() as conn:
        return get_all_for_month_with_conn(conn, year_month)


def get_summary_for_month(year_month):
    """Aggregate totals across all accounts for a single month."""
    with get_connection() as conn:
        row = conn.execute(
            """
            SELECT
                COALESCE(SUM(income), 0)        AS income,
                COALESCE(SUM(expense), 0)       AS expense,
                COALESCE(SUM(auto_dist_in), 0)  AS auto_dist_in,
                COALESCE(SUM(auto_dist_out), 0) AS auto_dist_out
            FROM account_buckets WHERE year_month = ?
            """,
            (year_month,),
        ).fetchone()
        return dict(row) if row else {"income": 0, "expense": 0, "auto_dist_in": 0, "auto_dist_out": 0}


def sum_all_time(slug):
    with get_connection() as conn:
        return sum_all_time_with_conn(conn, slug)
