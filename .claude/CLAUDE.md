# Finance Tracker

Personal finance tracker for Darryl. CLI-first, OpenClaw-driven.

## Stack
- Python + SQLite (no ORM)
- Flask (on-demand API, not always running)
- React + Vite + Tailwind + Recharts

## Key Conventions
- Currency is IDR (Indonesian Rupiah), stored as plain float
- Dates stored as TEXT in YYYY-MM-DD format
- `cli.py` is the primary interface for the AI. Flask API is used for the UI dashboard.
- When adding new query types, always add to both `database.py` and `cli.py`

## Paths
- DB file: `~/codespace/finance-tracker/finance.db`
- Skills: `~/codespace/finance-tracker/skills/` (symlinked to `~/.openclaw/workspace/`)
