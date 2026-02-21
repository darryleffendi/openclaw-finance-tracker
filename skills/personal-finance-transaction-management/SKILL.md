---
name: personal-finance-transaction-management
description: Manage personal finance transactions. Use this skill when the user wants to record income or expenses, query transactions, get summaries, or when a new query type is needed that the CLI doesn't yet support.
---

# Personal Finance Transaction Management

## Files
- CLI: `~/codespace/personal-finance-tracker/cli.py`
- DB logic: `~/codespace/personal-finance-tracker/database.py`
- Constants: `~/codespace/personal-finance-tracker/constants.py`
- Database: `~/codespace/personal-finance-tracker/finance.db`

## Inserting a Transaction

```bash
cd ~/codespace/personal-finance-tracker
python cli.py insert --amount <amount> --type <income|expense> --category "<category>" [--subcategory "<subcategory>"] [--note "<note>"] [--date YYYY-MM-DD]
```

Examples:
```bash
python cli.py insert --amount 50000 --type expense --category "food" --subcategory "gofood" --note "lunch"
python cli.py insert --amount 5000000 --type income --category "salary" --note "blibli"
python cli.py insert --amount 120000 --type expense --category "transport" --subcategory "flazz" --date 2025-02-15
python cli.py insert --amount 35000 --type expense --category "groceries" --note "alfamart"
```

## Querying Transactions

```bash
cd ~/codespace/personal-finance-tracker

# By period
python cli.py query --period today
python cli.py query --period this-week
python cli.py query --period this-month
python cli.py query --period last-month
python cli.py query --period all

# By category
python cli.py query --category food

# Summary only
python cli.py query --period this-month --summary
```

## Deleting a Transaction

```bash
python cli.py delete --id <id>
```

## Listing Categories

```bash
python cli.py categories
```

## Extending with New Query Types

If the user asks for a query type not yet supported (e.g., "show by date range", "top 5 categories"):

1. Add a new function to `database.py` following the existing patterns
2. Add a new `--flag` to the `query` subparser in `cli.py`
3. Handle the new flag in the `elif args.command == "query":` block
4. Test the new command before responding to the user

Always confirm with the user before writing to files.

## Response Format

Parse the JSON output and present it in a readable format. For summaries, show income, expense, and balance. For lists, group by date or category as appropriate. Use IDR (Rp) for currency.

## Category Reference

Common categories: food, groceries, transport, salary, freelance, bills, health, entertainment, shopping, savings, other

Food subcategories: dine, gofood, grabfood, snack
Transport subcategories: gojek, grab, flazz, krl, parkir
Bills subcategories: electricity, internet, phone, water
Health subcategories: medicine, doctor, gym
Entertainment subcategories: netflix, spotify, games, cinema
Shopping subcategories: clothes, electronics, tokopedia, shopee
