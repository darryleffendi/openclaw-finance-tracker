#!/usr/bin/env python3
import argparse
import json
import sys
from backend.repositories.account_repository import get_account, get_accounts, update_account, update_account_budget
from backend.repositories.transaction_repository import (
    get_all_transactions,
    get_transactions_by_category,
    get_transactions_by_period,
)
from backend.services.distribution_service import distribute_salary
from backend.services.today_service import get_today
from backend.services.recurring_service import (
    create_rule,
    delete_rule,
    get_rule,
    list_rules,
    run_now,
    update_rule,
)
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

    # Set budget (legacy — kept for back-compat; prefer set-account)
    set_budget_parser = subparsers.add_parser("set-budget", help="[deprecated] Update monthly budget; prefer 'set-account'")
    set_budget_parser.add_argument("--account", required=True, help="Account slug")
    set_budget_parser.add_argument("--amount", type=float, required=True, help="New monthly budget in IDR")

    # Set account (any subset of fields)
    set_account_parser = subparsers.add_parser("set-account", help="Update any account fields (partial)")
    set_account_parser.add_argument("--slug", required=True, help="Account slug")
    set_account_parser.add_argument("--monthly-budget", type=float, default=None, help="New monthly budget in IDR")
    set_account_parser.add_argument("--per-day-budget", type=int, choices=[0, 1], default=None,
                                    help="Whether this account contributes to today's allowance (0 or 1)")
    set_account_parser.add_argument("--subcategories", default=None,
                                    help="Comma-separated subcategory list, e.g. 'dine,gofood,snack' (use empty string to clear)")
    set_account_parser.add_argument("--display-name", default=None, help="Display name")

    # Today's allowance
    subparsers.add_parser("today", help="Show today's daily spending allowance")

    # Recurring rules
    recurring_parser = subparsers.add_parser("recurring", help="Manage recurring transaction rules")
    recurring_sub = recurring_parser.add_subparsers(dest="recurring_action", required=True)

    recurring_sub.add_parser("list", help="List all recurring rules")

    rec_add = recurring_sub.add_parser("add", help="Create a recurring rule")
    rec_add.add_argument("--name", required=True, help="Display name for the rule")
    rec_add.add_argument("--amount", type=float, required=True)
    rec_add.add_argument("--type", choices=["income", "expense"], required=True)
    rec_add.add_argument("--category", required=True)
    rec_add.add_argument("--day-of-month", type=int, required=True, help="Day 1-31 (clamped to month-end if needed)")
    rec_add.add_argument("--subcategory", default=None)
    rec_add.add_argument("--note", default=None)
    rec_add.add_argument("--disabled", action="store_true", help="Create in disabled state")

    rec_update = recurring_sub.add_parser("update", help="Update a recurring rule")
    rec_update.add_argument("--id", type=int, required=True, help="Rule id")
    rec_update.add_argument("--name", default=None)
    rec_update.add_argument("--amount", type=float, default=None)
    rec_update.add_argument("--day-of-month", type=int, default=None)
    rec_update.add_argument("--enabled", type=int, choices=[0, 1], default=None, help="Enable (1) or disable (0)")
    rec_update.add_argument("--note", default=None)

    rec_delete = recurring_sub.add_parser("delete", help="Delete a recurring rule")
    rec_delete.add_argument("--id", type=int, required=True, help="Rule id")

    recurring_sub.add_parser("run", help="Force-materialize all enabled rules for the current month")

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

    elif args.command == "set-account":
        fields = {}
        if args.monthly_budget is not None:
            fields["monthly_budget"] = args.monthly_budget
        if args.per_day_budget is not None:
            fields["per_day_budget"] = args.per_day_budget
        if args.subcategories is not None:
            fields["subcategories"] = [s.strip() for s in args.subcategories.split(",") if s.strip()]
        if args.display_name is not None:
            fields["display_name"] = args.display_name
        if not fields:
            print(json.dumps({"success": False, "error": "Supply at least one of --monthly-budget, --per-day-budget, --subcategories, --display-name"}))
            sys.exit(1)
        try:
            ok = update_account(args.slug, **fields)
        except ValueError as e:
            print(json.dumps({"success": False, "error": str(e)}))
            sys.exit(1)
        if not ok:
            print(json.dumps({"success": False, "error": "Account not found"}))
            sys.exit(1)
        print(json.dumps({"success": True, "account": get_account(args.slug)}, indent=2))

    elif args.command == "today":
        print(json.dumps(get_today(), indent=2))

    elif args.command == "recurring":
        if args.recurring_action == "list":
            print(json.dumps(list_rules(), indent=2))

        elif args.recurring_action == "add":
            rule = create_rule(
                name=args.name,
                amount=args.amount,
                type=args.type,
                category=args.category,
                day_of_month=args.day_of_month,
                subcategory=args.subcategory,
                note=args.note,
                enabled=0 if args.disabled else 1,
            )
            print(json.dumps(rule, indent=2))

        elif args.recurring_action == "update":
            fields = {}
            if args.name is not None:
                fields["name"] = args.name
            if args.amount is not None:
                fields["amount"] = args.amount
            if args.day_of_month is not None:
                fields["day_of_month"] = args.day_of_month
            if args.enabled is not None:
                fields["enabled"] = args.enabled
            if args.note is not None:
                fields["note"] = args.note
            if not fields:
                print(json.dumps({"success": False, "error": "No fields to update"}))
                sys.exit(1)
            result = update_rule(args.id, **fields)
            if result is None:
                print(json.dumps({"success": False, "error": "Rule not found"}))
                sys.exit(1)
            print(json.dumps(result, indent=2))

        elif args.recurring_action == "delete":
            if get_rule(args.id) is None:
                print(json.dumps({"success": False, "error": "Rule not found"}))
                sys.exit(1)
            delete_rule(args.id)
            print(json.dumps({"success": True, "id": args.id}))

        elif args.recurring_action == "run":
            results = run_now()
            print(json.dumps({"materialized": len(results), "transactions": results}, indent=2))

    elif args.command == "distribute":
        result = distribute_salary(args.amount, args.source_account)
        print(json.dumps(result, indent=2))


if __name__ == "__main__":
    main()
