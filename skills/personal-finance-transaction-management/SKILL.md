---
name: personal-finance-transaction-management
description: Manage individual finance transactions one at a time. Use this skill when the user wants to record a single income or expense, query transactions, get summaries, manage account balances/budgets, distribute salary, manage recurring rules, check today's allowance, or when a new query type is needed that the CLI doesn't yet support. For bulk imports from Excel or image files, use the finance-bulk-import skill instead.
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
python3 cli.py insert --amount 10000000 --type income --category salary --note "may salary"
# ↑ Salary auto-distributes proportionally to all expense/savings accounts
python3 cli.py insert --amount 120000 --type expense --category transport --subcategory flazz --date 2026-05-15
python3 cli.py insert --amount 35000 --type expense --category groceries --note "alfamart"
python3 cli.py insert --amount 2000000 --type income --category freelance --note "project payment"
```

## Editing a Transaction (amount and/or note only)

```bash
python3 cli.py edit --id <id> --amount <new_amount>
python3 cli.py edit --id <id> --note "<new_note>"
python3 cli.py edit --id <id> --amount <new_amount> --note "<new_note>"
# Salary income: editing the amount re-runs the full distribution cascade (row id changes)
# Auto-distribution rows cannot be edited directly — edit the parent salary row
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

# Summary only
python3 cli.py query --period this-month --summary
```

## Today's Allowance

```bash
python3 cli.py today
# Returns total daily allowance + per-category breakdown for accounts with daily_budget_enabled=1
# Formula per account: (monthly_budget - spent_this_month) / days_remaining_in_month
```

## Listing Accounts

```bash
python3 cli.py accounts
# Returns all accounts with slug, display_name, type, monthly_budget, daily_budget_enabled, subcategories
```

## Updating an Account

```bash
python3 cli.py set-account --slug food --monthly-budget 2500000
python3 cli.py set-account --slug food --per-day-budget 1
python3 cli.py set-account --slug food --subcategories "dine,gofood,grabfood,snack"
python3 cli.py set-account --slug food --monthly-budget 2500000 --per-day-budget 1 --subcategories "dine,gofood"
# Accepts any subset of the above flags; updates only what is provided
```

## Deleting a Transaction

```bash
python3 cli.py delete --id <id>
# If the deleted transaction is a salary income, its auto-distribution rows are also deleted
```

## Recurring Transaction Rules

```bash
# List all rules
python3 cli.py recurring list

# Create a rule (fires on day N of each month)
python3 cli.py recurring add --name "Rent" --amount 2200000 --type expense --category fixed --day-of-month 25 --note "monthly rent"
python3 cli.py recurring add --name "Salary" --amount 19875000 --type income --category salary --day-of-month 1 --note "monthly salary"

# Update a rule
python3 cli.py recurring update --id <id> --amount 2400000
python3 cli.py recurring update --id <id> --enabled 0  # disable
python3 cli.py recurring update --id <id> --enabled 1  # re-enable

# Delete a rule
python3 cli.py recurring delete --id <id>

# Force-materialize all enabled rules for the current month (idempotent)
python3 cli.py recurring run
```

Rules auto-materialize lazily on the first API read of each month (transactions, summary, accounts, today).
Salary recurring rules trigger the full auto-distribution cascade.
Day-of-month is clamped to the last day of the month (e.g. day 31 in February → day 28).

## Distributing Salary / Freelance Income Manually

```bash
python3 cli.py distribute --amount 2000000 --from freelance
```

## Extending with New Query Types

If the user asks for a query type not yet supported (e.g., "show by date range", "top 5 accounts"):

1. Add a new function to the appropriate `backend/` module (`repositories/transaction_repository.py`, `repositories/account_repository.py`, or `services/summary_service.py`) following the existing patterns
2. Add a new `--flag` to the `query` subparser in `cli.py`
3. Handle the new flag in the `elif args.command == "query":` block
4. Test the new command before responding to the user

Always confirm with the user before writing to files.

## Response Format

Parse the JSON output and present it in a readable format. For summaries, show income, expense, balance, and account info. For lists, group by date or account as appropriate. Use IDR (Rp) for currency.

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
| savings | Savings | savings |
| investments | Investments | savings |

### Subcategories

- **fixed**: rent, electricity, subscriptions
- **food**: dine, gofood, snack
- **transport**: gopay, ovo, flazz
- **wellness**: haircut, medicine, nutrition
- **entertainment**: hobbies, social, shopping
