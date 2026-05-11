---
name: personal-finance-transaction-management
description: Manage individual finance transactions one at a time. Use this skill when the user wants to record a single income or expense, query transactions, get summaries, manage account balances/budgets, distribute salary, or when a new query type is needed that the CLI doesn't yet support. For bulk imports from Excel or image files, use the finance-bulk-import skill instead.
---

# Personal Finance Transaction Management

## Files
- CLI: `~/codespace/personal-finance-tracker/cli.py`
- Backend code: `~/codespace/personal-finance-tracker/backend/` (repositories + services + routes)
- Database: `~/codespace/personal-finance-tracker/finance.db`

## Inserting a Transaction

```bash
cd ~/codespace/personal-finance-tracker
python3 cli.py insert --amount <amount> --type <income|expense> --category "<slug>" [--subcategory "<subcategory>"] [--note "<note>"] [--date YYYY-MM-DD]
```

Examples:
```bash
python3 cli.py insert --amount 50000 --type expense --category food --subcategory gofood --note "lunch"
python3 cli.py insert --amount 10000000 --type income --category salary --note "april salary"
# ↑ Salary auto-distributes to all expense/savings accounts by their monthly_budget
python3 cli.py insert --amount 120000 --type expense --category transport --subcategory flazz --date 2025-02-15
python3 cli.py insert --amount 35000 --type expense --category groceries --note "alfamart"
python3 cli.py insert --amount 2000000 --type income --category freelance --note "project payment"
```

## Querying Transactions

```bash
cd ~/codespace/personal-finance-tracker

# By period
python3 cli.py query --period today
python3 cli.py query --period this-week
python3 cli.py query --period this-month
python3 cli.py query --period last-month
python3 cli.py query --period all

# By account
python3 cli.py query --category food

# Summary only (includes per-account balances)
python3 cli.py query --period this-month --summary
```

## Listing Accounts

```bash
python3 cli.py accounts
# Returns all accounts with slug, display_name, type, balance, monthly_budget
```

## Deleting a Transaction

```bash
python3 cli.py delete --id <id>
# If the deleted transaction is a salary income, its auto-distribution rows are also deleted
```

## Distributing Salary / Freelance Income Manually

```bash
# Distribute a lump sum to all expense/savings accounts by their monthly_budget proportions
python3 cli.py distribute --amount 2000000 --from freelance
```

## Setting a Budget

```bash
python3 cli.py set-budget --account food --amount 2500000
# Updates the monthly_budget for the food account
```

## Extending with New Query Types

If the user asks for a query type not yet supported (e.g., "show by date range", "top 5 accounts"):

1. Add a new function to the appropriate `backend/` module (`repositories/transaction_repository.py`, `repositories/account_repository.py`, or `services/summary_service.py`) following the existing patterns
2. Add a new `--flag` to the `query` subparser in `cli.py`
3. Handle the new flag in the `elif args.command == "query":` block
4. Test the new command before responding to the user

Always confirm with the user before writing to files.

## Response Format

Parse the JSON output and present it in a readable format. For summaries, show income, expense, balance, and account balances. For lists, group by date or account as appropriate. Use IDR (Rp) for currency.

## Account Reference

| Slug | Display Name | Type |
|------|-------------|------|
| salary | Salary | income |
| freelance | Freelance | holding |
| fixed | Fixed Obligations | expense |
| food | Food | expense |
| groceries | Groceries & Personal Care | expense |
| transport | Transport | expense |
| wellness | Wellness & Personal | expense |
| entertainment | Social & Entertainment | expense |
| savings | Savings / Investment | savings |

### Subcategories
- **fixed**: rent, electricity, internet, phone, water, gym, subscriptions
- **food**: dine, gofood, grabfood, snack
- **transport**: gopay, ovo, flazz
- **wellness**: haircut, medicine, nutrition
- **entertainment**: hobbies, social, shopping
