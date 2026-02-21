#!/usr/bin/env python3
import argparse
import json
import sys
from database import (
    insert_transaction,
    get_transactions_by_period,
    get_transactions_by_category,
    get_summary,
    get_all_transactions,
    delete_transaction,
)
from constants import CATEGORIES, VALID_CATEGORIES, SUBCATEGORY_MAP


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
    query_parser.add_argument("--category", default=None, help="Filter by category")
    query_parser.add_argument("--summary", action="store_true", help="Return summary only")

    # Delete
    delete_parser = subparsers.add_parser("delete", help="Delete a transaction by ID")
    delete_parser.add_argument("--id", type=int, required=True)

    # Categories
    subparsers.add_parser("categories", help="List all categories and subcategories")

    args = parser.parse_args()

    if args.command == "insert":
        row_id = insert_transaction(
            amount=args.amount,
            type=args.type,
            category=args.category,
            subcategory=args.subcategory,
            note=args.note,
            date=args.date,
        )
        print(json.dumps({"success": True, "id": row_id}))

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

    elif args.command == "categories":
        print(json.dumps(CATEGORIES, indent=2))


if __name__ == "__main__":
    main()
