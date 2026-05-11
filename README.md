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

The DB auto-initializes on first import of `backend.db` (which happens on any `cli.py` run or service start). To create it eagerly:

```bash
python3 -c "import backend.db"
```

This creates `finance.db` in the project root and seeds the `accounts` table.

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

### 4. Configure environment

Create a `.env` file in the project root (gitignored). The backend reads it via `EnvironmentFile=` in the systemd unit, and `load_dotenv()` for local runs.

```dotenv
SECRET_KEY=             # any long random string; used to sign Flask session cookies
GOOGLE_CLIENT_ID=       # from Google Cloud Console → OAuth 2.0 Client IDs
GOOGLE_CLIENT_SECRET=   # paired with the client ID above
REDIRECT_URI=           # e.g. https://your-domain/api/auth/callback (must match Google Console)
ALLOWED_EMAILS=         # comma-separated allowlist, e.g. you@gmail.com
```

### 5. Install systemd services

Two services run the stack: `finance-tracker.service` (Flask backend on port 8009) and `finance-frontend.service` (Vite build watcher).

Adjust the install path in the unit files if yours isn't `/home/ubuntu/codespace/personal-finance-tracker`.

**`/etc/systemd/system/finance-tracker.service`:**

```ini
[Unit]
Description=Personal Finance Tracker Flask API
After=network.target

[Service]
Type=simple
User=ubuntu
WorkingDirectory=/home/ubuntu/codespace/personal-finance-tracker
ExecStart=/usr/bin/python3 -m backend.app
Restart=on-failure
RestartSec=5
EnvironmentFile=/home/ubuntu/codespace/personal-finance-tracker/.env

[Install]
WantedBy=multi-user.target
```

**`/etc/systemd/system/finance-frontend.service`:**

```ini
[Unit]
Description=Finance Tracker Frontend Build Watcher
After=network.target

[Service]
Type=simple
User=ubuntu
WorkingDirectory=/home/ubuntu/codespace/personal-finance-tracker/frontend
ExecStart=/usr/bin/npm run build -- --watch
Restart=on-failure
RestartSec=5

[Install]
WantedBy=multi-user.target
```

Then load and enable them:

```bash
sudo systemctl daemon-reload
sudo systemctl enable --now finance-tracker.service finance-frontend.service
sudo systemctl status finance-tracker.service
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

### Dashboard (systemd)

The Flask backend and frontend build watcher run as systemd services.

```bash
# Start
sudo systemctl start finance-tracker.service finance-frontend.service

# Stop
sudo systemctl stop finance-tracker.service finance-frontend.service

# Restart (e.g. after a code change)
sudo systemctl restart finance-tracker.service finance-frontend.service

# Status
sudo systemctl status finance-tracker.service
sudo systemctl status finance-frontend.service

# Logs (follow)
sudo journalctl -u finance-tracker.service -f
sudo journalctl -u finance-frontend.service -f
```

The backend listens on port `8009`. Frontend build output is served behind your usual reverse proxy.

---

## Notes

- Currency is **IDR (Indonesian Rupiah)**, stored as plain float
- Dates are stored as `YYYY-MM-DD` text
- The Flask API only needs to run when the dashboard is active
