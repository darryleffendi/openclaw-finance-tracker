---
name: personal-finance-transaction-management
description: Manage individual finance transactions one at a time. Use this skill when the user wants to record a single income or expense, query transactions, get summaries, manage account balances/budgets, manage recurring rules, check today's allowance, or when a new query type is needed that the CLI doesn't yet support.
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
python3 cli.py insert --amount 2000000 --type income --category other_income --subcategory freelance --note "project payment"
# ↑ Any non-salary income goes to other_income and is transferred in full to savings
```

## Editing a Transaction (amount and/or note only)

```bash
python3 cli.py edit --id <id> --amount <new_amount>
python3 cli.py edit --id <id> --note "<new_note>"
python3 cli.py edit --id <id> --amount <new_amount> --note "<new_note>"
# Salary / other_income income: editing the amount re-runs the full distribution cascade (row id changes)
# Auto-distribution rows cannot be edited directly — edit the parent salary / other_income row
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

# By date range (overrides --period)
python3 cli.py query --start 2026-10-01 --end 2026-10-15
python3 cli.py query --start 2026-10-01 --end 2026-10-15 --summary

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
python3 cli.py set-account --slug food --daily-budget-enabled 1
python3 cli.py set-account --slug food --subcategories "dine,gofood,grabfood,snack"
python3 cli.py set-account --slug food --monthly-budget 2500000 --daily-budget-enabled 1 --subcategories "dine,gofood"
# Accepts any subset of the above flags; updates only what is provided
```

## Deleting a Transaction

```bash
python3 cli.py delete --id <id>
# If the deleted transaction is a salary / other_income income, its auto-distribution rows are also deleted
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

## Transferring Between Accounts

```bash
python3 cli.py transfer --from food --to entertainment --amount 200000
python3 cli.py transfer --from food --to savings --amount 500000 --date 2026-05-20
```

Writes an expense on the source and an income on the target (both auto-distribution rows), so balances move but income/expense totals don't. Transfers can't be edited; delete the source row (returned `id`) to undo — the target row is removed with it.

## Month-End Settlement

```bash
python3 cli.py settle --month 2026-09          # settle a finished month
python3 cli.py settle --month 2026-10 --force  # settle the current month anyway
python3 cli.py settle --month 2026-09 --undo   # remove that month's settlement
```

Brings every expense account's balance for the month to 0 with transfers dated the month's last day (subcategory `settlement`). Leftovers go to savings; deficits are covered from savings, then investments (which may go negative). Re-running only settles what changed since (e.g. late transactions).

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
| other_income | Other Income | income |
| fixed | Fixed Obligations | expense |
| food | Food | expense |
| groceries | Groceries & Personal Care | expense |
| transport | Transport | expense |
| wellness | Wellness & Personal | expense |
| entertainment | Social & Entertainment | expense |
| savings | Savings | savings |
| investments | Investments | savings |
| date | Date | expense |
| charity | Charity | expense |

### Subcategories

- **fixed**: rent, subscriptions
- **food**: dine, gofood, snack
- **transport**: gopay, ovo, flazz
- **wellness**: haircut, medicine, supplements
- **entertainment**: hobbies, social, shopping
- **date**: gifts, dinner (anything spent on/for a date)
- **charity**: anything given to people (donations, zakat, helping others)
