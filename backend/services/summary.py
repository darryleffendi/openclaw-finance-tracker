from backend.repositories.accounts import get_accounts
from backend.repositories.transactions import get_transactions_by_period


def get_summary(period: str = "this-month"):
    transactions = get_transactions_by_period(period)
    # Exclude auto-distribution rows from the summary to avoid double-counting
    real_txns = [t for t in transactions if t.get("note") != "auto-distribution from salary"]
    income = sum(t["amount"] for t in real_txns if t["type"] == "income")
    expense = sum(t["amount"] for t in real_txns if t["type"] == "expense")
    return {
        "period": period,
        "income": income,
        "expense": expense,
        "balance": income - expense,
        "transaction_count": len(real_txns),
        "accounts": get_accounts(),
    }
