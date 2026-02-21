# Finance Tracker — Implementation Guide for Claude Code

## Overview

Build a personal finance tracker accessible via OpenClaw (Claude Code CLI). No Telegram bot. No always-on server. SQLite as the database. Flask API + React dashboard starts on-demand via a skill.

---

## Project Structure

```
~/codespace/finance-tracker/
├── app.py                  # Flask API (on-demand)
├── database.py             # All SQLite logic
├── cli.py                  # CLI interface for OpenClaw
├── finance.db              # SQLite database file (auto-created)
├── setup.sh                # Symlink setup script
├── requirements.txt
├── frontend/
│   ├── package.json
│   ├── index.html
│   ├── src/
│   │   ├── main.jsx
│   │   ├── App.jsx
│   │   └── components/
│   │       ├── Summary.jsx
│   │       ├── TransactionList.jsx
│   │       └── Charts.jsx
└── skills/
    ├── personal-finance-transaction-management/
    │   └── SKILL.md
    └── finance-dashboard/
        └── SKILL.md

~/.openclaw/workspace/
├── personal-finance-transaction-management -> (symlink)
└── finance-dashboard -> (symlink)
```

---

## Step 1: Initialize the Project

```bash
mkdir -p ~/codespace/finance-tracker/skills/personal-finance-transaction-management
mkdir -p ~/codespace/finance-tracker/skills/finance-dashboard
mkdir -p ~/codespace/finance-tracker/frontend/src/components
cd ~/codespace/finance-tracker
```

Create `requirements.txt`:
```
flask
flask-cors
```

Install dependencies:
```bash
pip install -r requirements.txt
```

---

## Step 2: database.py

Create `~/codespace/finance-tracker/database.py`:

```python
import sqlite3
from datetime import datetime, date
from pathlib import Path

DB_PATH = Path(__file__).parent / "finance.db"


def get_connection():
    conn = sqlite3.connect(DB_PATH)
    conn.row_factory = sqlite3.Row
    return conn


def init_db():
    with get_connection() as conn:
        conn.execute("""
            CREATE TABLE IF NOT EXISTS transactions (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                date TEXT NOT NULL,
                amount REAL NOT NULL,
                type TEXT NOT NULL CHECK(type IN ('income', 'expense')),
                category TEXT NOT NULL,
                note TEXT,
                created_at TEXT DEFAULT (datetime('now'))
            )
        """)
        conn.commit()


def insert_transaction(amount: float, type: str, category: str, note: str = None, date: str = None):
    if date is None:
        date = datetime.now().strftime("%Y-%m-%d")
    with get_connection() as conn:
        cursor = conn.execute(
            "INSERT INTO transactions (date, amount, type, category, note) VALUES (?, ?, ?, ?, ?)",
            (date, amount, type, category, note)
        )
        conn.commit()
        return cursor.lastrowid


def get_transactions_by_period(period: str):
    today = date.today().isoformat()
    queries = {
        "today": "WHERE date = date('now')",
        "this-week": "WHERE date >= date('now', 'weekday 0', '-7 days')",
        "this-month": "WHERE strftime('%Y-%m', date) = strftime('%Y-%m', 'now')",
        "last-month": "WHERE strftime('%Y-%m', date) = strftime('%Y-%m', date('now', '-1 month'))",
        "all": "",
    }
    where = queries.get(period, "WHERE date = date('now')")
    with get_connection() as conn:
        rows = conn.execute(f"SELECT * FROM transactions {where} ORDER BY date DESC").fetchall()
        return [dict(row) for row in rows]


def get_transactions_by_category(category: str):
    with get_connection() as conn:
        rows = conn.execute(
            "SELECT * FROM transactions WHERE LOWER(category) = LOWER(?) ORDER BY date DESC",
            (category,)
        ).fetchall()
        return [dict(row) for row in rows]


def get_summary(period: str = "this-month"):
    transactions = get_transactions_by_period(period)
    income = sum(t["amount"] for t in transactions if t["type"] == "income")
    expense = sum(t["amount"] for t in transactions if t["type"] == "expense")
    return {
        "period": period,
        "income": income,
        "expense": expense,
        "balance": income - expense,
        "transaction_count": len(transactions),
    }


def get_all_transactions():
    return get_transactions_by_period("all")


# Always initialize on import
init_db()
```

---

## Step 3: cli.py

Create `~/codespace/finance-tracker/cli.py`:

```python
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
)


def main():
    parser = argparse.ArgumentParser(description="Finance Tracker CLI")
    subparsers = parser.add_subparsers(dest="command", required=True)

    # Insert
    insert_parser = subparsers.add_parser("insert", help="Insert a transaction")
    insert_parser.add_argument("--amount", type=float, required=True)
    insert_parser.add_argument("--type", choices=["income", "expense"], required=True)
    insert_parser.add_argument("--category", required=True)
    insert_parser.add_argument("--note", default=None)
    insert_parser.add_argument("--date", default=None, help="YYYY-MM-DD, defaults to today")

    # Query
    query_parser = subparsers.add_parser("query", help="Query transactions")
    query_parser.add_argument("--period", choices=["today", "this-week", "this-month", "last-month", "all"], default="this-month")
    query_parser.add_argument("--category", default=None, help="Filter by category")
    query_parser.add_argument("--summary", action="store_true", help="Return summary only")

    args = parser.parse_args()

    if args.command == "insert":
        row_id = insert_transaction(
            amount=args.amount,
            type=args.type,
            category=args.category,
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


if __name__ == "__main__":
    main()
```

Make it executable:
```bash
chmod +x ~/codespace/finance-tracker/cli.py
```

---

## Step 4: app.py (Flask API)

Create `~/codespace/finance-tracker/app.py`:

```python
from flask import Flask, jsonify, request
from flask_cors import CORS
from database import (
    insert_transaction,
    get_transactions_by_period,
    get_transactions_by_category,
    get_summary,
    get_all_transactions,
)

app = Flask(__name__)
CORS(app, origins=["http://localhost:5173"])  # Vite dev server only


@app.get("/api/transactions")
def list_transactions():
    period = request.args.get("period", "this-month")
    category = request.args.get("category")
    if category:
        return jsonify(get_transactions_by_category(category))
    return jsonify(get_transactions_by_period(period))


@app.post("/api/transactions")
def create_transaction():
    data = request.json
    row_id = insert_transaction(
        amount=data["amount"],
        type=data["type"],
        category=data["category"],
        note=data.get("note"),
        date=data.get("date"),
    )
    return jsonify({"success": True, "id": row_id}), 201


@app.get("/api/summary")
def summary():
    period = request.args.get("period", "this-month")
    return jsonify(get_summary(period))


if __name__ == "__main__":
    app.run(port=8000, debug=False)
```

---

## Step 5: React Frontend

### Initialize Vite + React + Tailwind

```bash
cd ~/codespace/finance-tracker/frontend
npm create vite@latest . -- --template react
npm install
npm install -D tailwindcss postcss autoprefixer
npx tailwindcss init -p
npm install recharts
```

Configure `tailwind.config.js`:
```js
export default {
  content: ["./index.html", "./src/**/*.{js,jsx}"],
  theme: { extend: {} },
  plugins: [],
}
```

Add to `src/index.css`:
```css
@tailwind base;
@tailwind components;
@tailwind utilities;
```

### src/App.jsx

```jsx
import { useState, useEffect } from "react"
import Summary from "./components/Summary"
import TransactionList from "./components/TransactionList"
import Charts from "./components/Charts"

const API = "http://localhost:8000/api"

export default function App() {
  const [period, setPeriod] = useState("this-month")
  const [transactions, setTransactions] = useState([])
  const [summary, setSummary] = useState(null)

  useEffect(() => {
    fetch(`${API}/transactions?period=${period}`)
      .then(r => r.json()).then(setTransactions)
    fetch(`${API}/summary?period=${period}`)
      .then(r => r.json()).then(setSummary)
  }, [period])

  const periods = ["today", "this-week", "this-month", "last-month", "all"]

  return (
    <div className="min-h-screen bg-gray-950 text-white p-6">
      <div className="max-w-4xl mx-auto">
        <h1 className="text-2xl font-bold mb-6">💰 Finance Tracker</h1>

        <div className="flex gap-2 mb-6">
          {periods.map(p => (
            <button
              key={p}
              onClick={() => setPeriod(p)}
              className={`px-3 py-1 rounded text-sm ${period === p ? "bg-indigo-600" : "bg-gray-800 hover:bg-gray-700"}`}
            >
              {p}
            </button>
          ))}
        </div>

        {summary && <Summary data={summary} />}
        {transactions.length > 0 && <Charts transactions={transactions} />}
        <TransactionList transactions={transactions} />
      </div>
    </div>
  )
}
```

### src/components/Summary.jsx

```jsx
export default function Summary({ data }) {
  return (
    <div className="grid grid-cols-3 gap-4 mb-6">
      <div className="bg-gray-800 rounded-lg p-4">
        <p className="text-sm text-gray-400">Income</p>
        <p className="text-xl font-bold text-green-400">Rp {data.income.toLocaleString()}</p>
      </div>
      <div className="bg-gray-800 rounded-lg p-4">
        <p className="text-sm text-gray-400">Expense</p>
        <p className="text-xl font-bold text-red-400">Rp {data.expense.toLocaleString()}</p>
      </div>
      <div className="bg-gray-800 rounded-lg p-4">
        <p className="text-sm text-gray-400">Balance</p>
        <p className={`text-xl font-bold ${data.balance >= 0 ? "text-blue-400" : "text-red-400"}`}>
          Rp {data.balance.toLocaleString()}
        </p>
      </div>
    </div>
  )
}
```

### src/components/Charts.jsx

```jsx
import { PieChart, Pie, Cell, Tooltip, ResponsiveContainer } from "recharts"

const COLORS = ["#6366f1", "#ec4899", "#f59e0b", "#10b981", "#3b82f6", "#8b5cf6"]

export default function Charts({ transactions }) {
  const expenseByCategory = transactions
    .filter(t => t.type === "expense")
    .reduce((acc, t) => {
      acc[t.category] = (acc[t.category] || 0) + t.amount
      return acc
    }, {})

  const data = Object.entries(expenseByCategory).map(([name, value]) => ({ name, value }))

  if (data.length === 0) return null

  return (
    <div className="bg-gray-800 rounded-lg p-4 mb-6">
      <p className="text-sm text-gray-400 mb-3">Expenses by Category</p>
      <ResponsiveContainer width="100%" height={200}>
        <PieChart>
          <Pie data={data} dataKey="value" nameKey="name" cx="50%" cy="50%" outerRadius={80}>
            {data.map((_, i) => <Cell key={i} fill={COLORS[i % COLORS.length]} />)}
          </Pie>
          <Tooltip formatter={(v) => `Rp ${v.toLocaleString()}`} />
        </PieChart>
      </ResponsiveContainer>
    </div>
  )
}
```

### src/components/TransactionList.jsx

```jsx
export default function TransactionList({ transactions }) {
  return (
    <div className="bg-gray-800 rounded-lg overflow-hidden">
      <table className="w-full text-sm">
        <thead className="bg-gray-700">
          <tr>
            <th className="text-left p-3">Date</th>
            <th className="text-left p-3">Category</th>
            <th className="text-left p-3">Note</th>
            <th className="text-right p-3">Amount</th>
          </tr>
        </thead>
        <tbody>
          {transactions.map(t => (
            <tr key={t.id} className="border-t border-gray-700">
              <td className="p-3 text-gray-400">{t.date}</td>
              <td className="p-3">{t.category}</td>
              <td className="p-3 text-gray-400">{t.note || "—"}</td>
              <td className={`p-3 text-right font-mono ${t.type === "income" ? "text-green-400" : "text-red-400"}`}>
                {t.type === "income" ? "+" : "-"}Rp {t.amount.toLocaleString()}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}
```

---

## Step 6: OpenClaw Skills

### skills/personal-finance-transaction-management/SKILL.md

```markdown
---
name: personal-finance-transaction-management
description: Manage personal finance transactions. Use this skill when the user wants to record income or expenses, query transactions, get summaries, or when a new query type is needed that the CLI doesn't yet support.
---

# Personal Finance Transaction Management

## Files
- CLI: `~/codespace/finance-tracker/cli.py`
- DB logic: `~/codespace/finance-tracker/database.py`
- Database: `~/codespace/finance-tracker/finance.db`

## Inserting a Transaction

```bash
cd ~/codespace/finance-tracker
python cli.py insert --amount <amount> --type <income|expense> --category "<category>" --note "<note>"
# Optional: --date YYYY-MM-DD (defaults to today)
```

Examples:
```bash
python cli.py insert --amount 50000 --type expense --category "food" --note "lunch"
python cli.py insert --amount 5000000 --type income --category "salary" --note "blibli"
python cli.py insert --amount 120000 --type expense --category "transport" --date 2025-02-15
```

## Querying Transactions

```bash
cd ~/codespace/finance-tracker

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

## Extending with New Query Types

If the user asks for a query type not yet supported (e.g., "show by date range", "top 5 categories"):

1. Add a new function to `database.py` following the existing patterns
2. Add a new `--flag` to the `query` subparser in `cli.py`
3. Handle the new flag in the `elif args.command == "query":` block
4. Test the new command before responding to the user

Always confirm with the user before writing to files.

## Response Format

Parse the JSON output and present it in a readable format. For summaries, show income, expense, and balance. For lists, group by date or category as appropriate.
```

---

### skills/finance-dashboard/SKILL.md

```markdown
---
name: finance-dashboard
description: Start or stop the finance tracker dashboard. Use when the user says "open dashboard", "start dashboard", "show dashboard", or "stop dashboard".
---

# Finance Dashboard

## Files
- Flask API: `~/codespace/finance-tracker/app.py`
- React frontend: `~/codespace/finance-tracker/frontend/`
- PID files: `/tmp/finance-flask.pid`, `/tmp/finance-react.pid`

## Start Dashboard

```bash
# Start Flask API in background
cd ~/codespace/finance-tracker
nohup python app.py > /tmp/finance-flask.log 2>&1 &
echo $! > /tmp/finance-flask.pid
echo "Flask started on port 8000"

# Start React dev server in background
cd ~/codespace/finance-tracker/frontend
nohup npm run dev -- --port 5173 > /tmp/finance-react.log 2>&1 &
echo $! > /tmp/finance-react.pid
echo "React started on port 5173"
```

After starting, tell the user:

> Both servers are running. To access the dashboard from your local machine, run:
> ```
> ssh -L 5173:localhost:5173 darryl
> ```
> Then open http://localhost:5173 in your browser.
> Say "stop dashboard" when done.

## Stop Dashboard

```bash
# Stop Flask
if [ -f /tmp/finance-flask.pid ]; then
  kill $(cat /tmp/finance-flask.pid) && rm /tmp/finance-flask.pid
  echo "Flask stopped"
fi

# Stop React
if [ -f /tmp/finance-react.pid ]; then
  kill $(cat /tmp/finance-react.pid) && rm /tmp/finance-react.pid
  echo "React stopped"
fi
```

## Check Status

```bash
if [ -f /tmp/finance-flask.pid ] && kill -0 $(cat /tmp/finance-flask.pid) 2>/dev/null; then
  echo "Flask: running (PID $(cat /tmp/finance-flask.pid))"
else
  echo "Flask: stopped"
fi

if [ -f /tmp/finance-react.pid ] && kill -0 $(cat /tmp/finance-react.pid) 2>/dev/null; then
  echo "React: running (PID $(cat /tmp/finance-react.pid))"
else
  echo "React: stopped"
fi
```
```

---

## Step 7: setup.sh (Symlinks)

Create `~/codespace/finance-tracker/setup.sh`:

```bash
#!/bin/bash
set -e

SKILLS_DIR="$HOME/.openclaw/workspace"
REPO_SKILLS="$HOME/codespace/finance-tracker/skills"

mkdir -p "$SKILLS_DIR"

echo "Creating symlinks..."

ln -sfn "$REPO_SKILLS/personal-finance-transaction-management" \
  "$SKILLS_DIR/personal-finance-transaction-management"

ln -sfn "$REPO_SKILLS/finance-dashboard" \
  "$SKILLS_DIR/finance-dashboard"

echo "Done. Symlinks created:"
ls -la "$SKILLS_DIR" | grep finance
```

```bash
chmod +x ~/codespace/finance-tracker/setup.sh
bash ~/codespace/finance-tracker/setup.sh
```

---

## Step 8: Verify Everything Works

```bash
cd ~/codespace/finance-tracker

# Test DB init and insert
python cli.py insert --amount 50000 --type expense --category "food" --note "test lunch"

# Test query
python cli.py query --period today

# Test summary
python cli.py query --period this-month --summary

# Confirm symlinks
ls -la ~/.openclaw/workspace/ | grep finance
```

---

## Usage Examples via OpenClaw

Once set up, you interact naturally:

| You say | OpenClaw does |
|---|---|
| "spent 45k on grab food" | `cli.py insert --amount 45000 --type expense --category transport --note "grab food"` |
| "got paid 8 million salary" | `cli.py insert --amount 8000000 --type income --category salary` |
| "how much did I spend this week?" | `cli.py query --period this-week --summary` |
| "show my food expenses" | `cli.py query --category food` |
| "open dashboard" | starts Flask + React, prints SSH tunnel command |
| "stop dashboard" | kills both processes |

