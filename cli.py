#!/usr/bin/env python3
import argparse
import json
import sys
from backend.repositories.account_repository import get_accounts, update_account_budget
from backend.repositories.transaction_repository import (
    get_all_transactions,
    get_transactions_by_category,
    get_transactions_by_period,
)
from backend.services.distribution_service import distribute_salary
from backend.services.summary_service import get_summary
from backend.services.transaction_service import delete_transaction, insert_transaction


def main():
    parser = argparse.ArgumentParser(description="Finance Tracker CLI")
    subparsers = parser.add_subparsers(dest="command", required=True)

    # Insert
    insert_parser = subparsers.add_parser("insert", help="Insert a transaction")
    insert_parser.add_argument("--amount", type=float, required=True)
    insert_parser.add_argument("--type", choices=["income", "expense"], required=True)
    insert_parser.add_argument("--category", required=True)
    insert_parser.add_argument("--subcategory", default=None)
    insert_parser.add_argument("--note", default=None)
    insert_parser.add_argument("--date", default=None, help="YYYY-MM-DD, defaults to today")

    # Query
    query_parser = subparsers.add_parser("query", help="Query transactions")
    query_parser.add_argument(
        "--period",
        choices=["today", "this-week", "this-month", "last-month", "all"],
        default="this-month",
    )
    query_parser.add_argument("--category", default=None, help="Filter by category/account slug")
    query_parser.add_argument("--summary", action="store_true", help="Return summary only")

    # Delete
    delete_parser = subparsers.add_parser("delete", help="Delete a transaction by ID")
    delete_parser.add_argument("--id", type=int, required=True)

    # Accounts
    subparsers.add_parser("accounts", help="List all accounts with balances")

    # Categories (legacy alias for accounts)
    subparsers.add_parser("categories", help="[deprecated] Use 'accounts' instead")

    # Set budget
    set_budget_parser = subparsers.add_parser("set-budget", help="Update monthly budget for an account")
    set_budget_parser.add_argument("--account", required=True, help="Account slug")
    set_budget_parser.add_argument("--amount", type=float, required=True, help="New monthly budget in IDR")

    # Distribute
    distribute_parser = subparsers.add_parser("distribute", help="Manually distribute funds to expense accounts")
    distribute_parser.add_argument("--amount", type=float, required=True)
    distribute_parser.add_argument("--from", dest="source_account", default="freelance",
                                   help="Source account slug (default: freelance)")

    args = parser.parse_args()

    if args.command == "insert":
        txn_id, distributed = insert_transaction(
            amount=args.amount,
            type=args.type,
            category=args.category,
            subcategory=args.subcategory,
            note=args.note,
            date=args.date,
        )
        result = {"success": True, "id": txn_id}
        if distributed:
            result["distributions"] = distributed
        print(json.dumps(result))

    elif args.command == "query":
        if args.summary:
            result = get_summary(args.period)
        elif args.category:
            result = get_transactions_by_category(args.category)
        else:
            result = get_transactions_by_period(args.period)
        print(json.dumps(result, indent=2))

    elif args.command == "delete":
        success = delete_transaction(args.id)
        print(json.dumps({"success": success, "id": args.id}))

    elif args.command in ("accounts", "categories"):
        if args.command == "categories":
            print("Note: 'categories' is deprecated, use 'accounts' instead", file=sys.stderr)
        print(json.dumps(get_accounts(), indent=2))

    elif args.command == "set-budget":
        success = update_account_budget(args.account, args.amount)
        print(json.dumps({"success": success, "account": args.account, "monthly_budget": args.amount}))

    elif args.command == "distribute":
        result = distribute_salary(args.amount, args.source_account)
        print(json.dumps(result, indent=2))


if __name__ == "__main__":
    main()
