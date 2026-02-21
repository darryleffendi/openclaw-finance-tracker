# Personal Finance Tracker

CLI-first personal finance tracker for Darryl, powered by OpenClaw skills. Tracks income and expenses in IDR with an optional React dashboard.

## Stack

- **Backend:** Python + SQLite (no ORM)
- **API:** Flask (on-demand, only runs when dashboard is active)
- **Frontend:** React + Vite + Tailwind + Recharts
- **Interface:** OpenClaw skills (primary), `cli.py` (direct)

---

## Setup

### 1. Initialize the database

```bash
python3 database.py
```

This auto-creates `finance.db` in the project root.

### 2. Link skills to OpenClaw

```bash
bash setup.sh
```

This symlinks the skills in `skills/` to `~/.openclaw/workspace/skills/` so OpenClaw can discover them.

### 3. Install dependencies

**Python (Flask API):**

```bash
sudo apt install python3-flask python3-flask-cors
```

**Frontend:**

```bash
cd frontend
npm install
```

---

## Usage

### Via OpenClaw (recommended)

Chat with OpenClaw to manage your finances naturally:

- **Insert a transaction** — "I spent 50k on lunch via GoPay"
- **Query transactions** — "Show me this month's expenses" or "What did I spend on food?"
- **Delete a transaction** — "Remove transaction 42"
- **Open the dashboard** — "Start the finance dashboard" (opens Flask API + React UI, accessible via SSH port forwarding)

OpenClaw uses the `personal-finance-transaction-management` and `finance-dashboard` skills to handle these actions.

### Via CLI (direct)

```bash
# Insert a transaction
python3 cli.py insert --amount 50000 --type expense --category food --subcategory gofood --note "lunch"

# Query transactions
python3 cli.py query --period this-month --summary
python3 cli.py query --period today

# Delete a transaction
python3 cli.py delete --id <id>

# List categories
python3 cli.py categories
```

### Dashboard (manual)

Start the Flask API:

```bash
python3 app.py
```

Start the frontend (in a separate terminal):

```bash
cd frontend
npm run dev -- --port 5173
```

Access via SSH port forwarding on ports `8000` (API) and `5173` (UI).

---

## Notes

- Currency is **IDR (Indonesian Rupiah)**, stored as plain float
- Dates are stored as `YYYY-MM-DD` text
- The Flask API only needs to run when the dashboard is active
