---
name: finance-dashboard
description: Start or stop the finance tracker dashboard. Use when the user says "open dashboard", "start dashboard", "show dashboard", or "stop dashboard".
---

# Finance Dashboard

## Files
- Flask API: `~/codespace/personal-finance-tracker/app.py`
- React frontend: `~/codespace/personal-finance-tracker/frontend/`
- PID files: `/tmp/finance-flask.pid`, `/tmp/finance-react.pid`

## Start Dashboard

```bash
# Start Flask API in background
cd ~/codespace/personal-finance-tracker
nohup python3 app.py > /tmp/finance-flask.log 2>&1 &
echo $! > /tmp/finance-flask.pid
echo "Flask started on port 8009"

# Start React dev server in background
cd ~/codespace/personal-finance-tracker/frontend
nohup npm run dev -- --port 5179 > /tmp/finance-react.log 2>&1 &
echo $! > /tmp/finance-react.pid
echo "React started on port 5179"
```

After starting, tell the user:

> Both servers are running. To access the dashboard from your local machine, run:
> ```
> ssh -L 5179:localhost:5179 -L 8009:localhost:8009 darryl
> ```
> Then open http://localhost:5179 in your browser.
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
