# Personal Finance Tracker — PRD v2

## 1. Background

Personal-use finance tracker for Darryl (single user, IDR). The current build is functional but the UI is rough and the budget model is shallow. This v2 introduces:

- **Daily spending guidance** (today's allowance) so the question "can I spend X on lunch?" is answered in seconds.
- **Per-category budget health** with three-tier warning states.
- **Recurring transactions** for predictable monthly obligations (salary, rent, subscriptions).
- **An investments account** separate from savings.
- **Editable transactions and budgets** for real-life corrections.
- **A Monarch-inspired full UI overhaul**, mobile-first.

Transaction *entry* is mostly via Telegram + OpenClaw; the dashboard is **read-mostly**.

## 2. Users & Primary Use Cases

- **User:** Darryl. Single user. IDR currency. Indonesian locale.
- **Entry surface:** Telegram bot → OpenClaw → `cli.py insert` (primary). Dashboard FAB / Add button (occasional).
- **Viewing surface:** Web dashboard, **mobile-first** (in-the-moment checks: "what's my allowance today?"), desktop secondary (weekly review, settings).

### Top user journeys (sorted by frequency)

1. Open dashboard on phone → see today's allowance → decide whether to spend.
2. Open dashboard → glance at category health → spot what's tight.
3. Log a transaction outside the app (Telegram) and trust it shows up correctly.
4. Edit a wrong transaction (typo'd amount).
5. Tweak budgets when life changes (settings).
6. Set up a new recurring rule (settings).

## 3. Goals

- Daily allowance answer in <2s from app open on mobile.
- Zero-cron recurring transactions that "just appear" on the 1st of the month.
- Negative balances render correctly (current bug fix).
- Salary auto-distribution remains intact and visible in the UI.
- Aesthetic on par with Monarch — clean, dense-but-airy, dark.

## 4. Non-goals (out of scope for v2)

- Multi-user, sharing, household.
- Bank/credit card sync (OFX, Plaid, etc.).
- Investment performance tracking (price/value/P&L).
- Forecasting beyond current burn rate.
- Year-over-year comparison view.
- CSV export.
- Custom user-defined categories (account list stays fixed).

---

## 5. Functional Requirements

### 5.1 Today's Allowance Card *(NEW — hero card)*

- Top-of-dashboard hero, above per-account cards.
- Shows total allowance for today summed across all accounts where `per_day_budget = true`.
- Per-category formula:
  ```
  daily_allowance = (monthly_budget − spent_this_month) / days_remaining_in_month
  ```
  where `days_remaining_in_month` includes today.
- Tap/expand → per-category breakdown (e.g. food: Rp 70.000, groceries: Rp 9.000, transport: Rp 10.000).
- Overspent today: render as "Rp X over today's allowance" in red, with a subtle line "Tomorrow's allowance will be reduced."
- Updates live as transactions are added/edited/deleted in today's date.

### 5.2 Per-Account Cards

- One card per account (10 total: salary, freelance, fixed, food, groceries, transport, wellness, entertainment, savings, investments).
- Mobile: stacked, full-width. Desktop ≥1024px: 2- or 3-col grid.
- Card content:
  - Account display name + small type icon (income / expense / savings)
  - Monthly budget (Rp X)
  - Spent this month (Rp Y)
  - Remaining (`budget − spent`) — large, bold
  - Progress bar with **three-tier color**:
    - Green: >40% of budget remaining
    - Yellow: 10–40% remaining
    - Orange: 0–10% remaining
    - Red: negative (over budget)
  - "N subcategories" hint if any
- Tap → category detail page (full transaction history filtered by category, deeper stats).
- **No daily number on these cards** — daily lives only in the hero card.

### 5.3 Period Selector (Calendar Picker)

- Default: current month.
- Three modes: **Day**, **Week** (Mon–Sun), **Month**.
- Calendar UI for free selection of any past day/week/month.
- Header always shows the selected period.
- Mobile: swipe ← / → on header to step ±1 unit.

### 5.4 Charts

- **Spending breakdown** — donut chart, expense categories only, scoped to selected period.
- **Income vs Expense over time** — bar chart, last 6 months default.
- Mobile: charts collapsed by default behind a "Show charts" toggle to keep budget cards above the fold.

### 5.5 Transaction List

- Mobile: below charts. Desktop ≥1024px: side panel on the right.
- Each row: date · category icon · subcategory · note · amount (right-aligned, colored by type).
- Per-row actions: **pencil** (edit) and **trash** (delete).
- Filter chips at top: All, then one per category.
- Badges:
  - Salary auto-distribution: badge "Distributed across 8 accounts" (links to detail).
  - Recurring-generated: small "↻" icon.

### 5.6 Add Transaction *(DEMOTED)*

- Mobile: floating action button (FAB), bottom-right, primary color.
- Desktop: secondary button top-right of dashboard.
- Modal fields: amount, type (income/expense), category, subcategory (dynamic dropdown), date (default today), note.

### 5.7 Edit Transaction *(NEW)*

- Pencil icon on each row opens an edit modal.
- Editable: **amount, note**.
- Type and category are NOT editable in v2 (avoids re-shuffling the salary distribution cascade across categories — defer to v3).
- For salary transactions: editing the amount re-runs the distribution (delete old derived rows, insert new ones at the new ratio).

### 5.8 Recurring Transactions *(NEW)*

- Defined in Settings → Recurring.
- Per rule: `name`, `amount`, `type`, `category`, `subcategory`, `note`, `day_of_month` (1–31), `enabled`.
- **Lazy materialization, no cron:**
  - On any read API hit (`/api/transactions`, `/api/summary`, `/api/today`, `/api/accounts`), check `last_run_month` per rule.
  - If `last_run_month != current YYYY-MM`, run all enabled rules:
    - Insert a transaction with `date = YYYY-MM-DD` using `day_of_month` (clamped to last day of month for short months — e.g. day=31 in Feb becomes Feb 28/29).
    - `created_at` is the real insertion timestamp.
    - Update `last_run_month` on the rule to the current month.
- Salary recurring rules trigger the existing auto-distribution cascade.
- Generated transactions are editable/deletable like manual ones (the rule remains; only the materialized row is gone).
- Manual "Run now" button in settings (idempotent).

### 5.9 Settings Page

- Single page (or modal) with three sections:
  - **Budgets** — list of accounts with editable `monthly_budget` and `per_day_budget` toggle.
  - **Subcategories** — per-account JSON list editor (chip add/remove UI; underlying data is JSON in `accounts.subcategories`).
  - **Recurring** — list with create / edit / delete / enable-toggle / run-now.
- Logout button at the bottom.

### 5.10 Balance Semantics *(FIX: negative balance bug)*

| Account type | Card "Remaining" | "Spent / Saved" | Reset |
|---|---|---|---|
| Expense | `monthly_budget − spent_this_month` (can be negative, render red) | spent this month | Monthly |
| Income (salary, freelance) | `received_this_month` vs `monthly_budget` | received this month | Monthly |
| Savings / Investments | this month's net deposit (`SUM(amount) where date in current month`) vs `monthly_budget` | **also show all-time total** | Monthly (for the budget portion); all-time number is cumulative |

Negative remaining renders as `−Rp X` in red with the over-budget warning state.

### 5.11 Login Screen

- App logo / name centered.
- Single "Sign in with Google" button.
- Dark theme, minimal.
- Reuses existing OAuth backend.

---

## 6. Schema Changes

### 6.1 `accounts` table

```sql
ALTER TABLE accounts ADD COLUMN per_day_budget INTEGER NOT NULL DEFAULT 0;
-- subcategories assumed to already exist as TEXT (JSON-encoded array)
```

Seed updates:

| Slug | per_day_budget |
|---|---|
| food | 1 |
| groceries | 1 |
| transport | 1 |
| salary, freelance, fixed, wellness, entertainment, savings, investments | 0 |

New account row:

| Slug | Display | Type | Monthly Budget |
|---|---|---|---|
| `investments` | Investments | savings | 12.000.000 |

Updated account row:

| Slug | Display | Type | Monthly Budget |
|---|---|---|---|
| `savings` | Savings | savings | 357.000 |

### 6.2 New `recurring_transactions` table

```sql
CREATE TABLE recurring_transactions (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name TEXT NOT NULL,
    amount REAL NOT NULL,
    type TEXT NOT NULL CHECK(type IN ('income', 'expense')),
    category TEXT NOT NULL,
    subcategory TEXT,
    note TEXT,
    day_of_month INTEGER NOT NULL CHECK(day_of_month BETWEEN 1 AND 31),
    enabled INTEGER NOT NULL DEFAULT 1,
    last_run_month TEXT,                       -- YYYY-MM; NULL = never run
    created_at TEXT DEFAULT (datetime('now'))
);
```

### 6.3 Indexes (perf)

```sql
CREATE INDEX IF NOT EXISTS idx_txn_date ON transactions(date);
CREATE INDEX IF NOT EXISTS idx_txn_category_date ON transactions(category, date);
```

---

## 7. API Changes

### New endpoints

| Method | Path | Description |
|---|---|---|
| GET | `/api/today` | `{ total_allowance, days_remaining, breakdown: [{category, allowance}], over_today }` |
| PATCH | `/api/transactions/:id` | Edit amount/note. For salary: re-runs distribution. |
| GET | `/api/recurring` | List rules |
| POST | `/api/recurring` | Create rule |
| PATCH | `/api/recurring/:id` | Update rule |
| DELETE | `/api/recurring/:id` | Delete rule |
| POST | `/api/recurring/run` | Manual materialization (idempotent) |
| PATCH | `/api/accounts/:slug` | Edit `monthly_budget`, `per_day_budget`, `subcategories` |

### Behavior changes

- Any GET against `/api/transactions`, `/api/summary`, `/api/today`, or `/api/accounts` first runs recurring-rule materialization for the current month if not yet run.

---

## 8. Acceptance Criteria

- [ ] Daily allowance updates within one render after adding/deleting/editing today's transaction.
- [ ] Categories with `per_day_budget = false` do **not** appear in today's allowance.
- [ ] Negative remaining renders red, no NaN, no UI break.
- [ ] First dashboard load on day 1 of a new month auto-creates recurring transactions with their configured `date`.
- [ ] Salary recurring rule: created transaction triggers full distribution cascade.
- [ ] Editing a salary transaction's amount re-distributes proportionally; deleting reverses cleanly.
- [ ] Mobile (<768px) layout: hero allowance card + at least 2 account cards visible above the fold; charts collapsed.
- [ ] Settings page allows editing all budgets, per_day_budget flags, subcategories, and recurring rules without touching the DB.
- [ ] Period selector supports day/week/month with calendar picker, defaulting to current month.
- [ ] Three-tier color states render correctly (green / yellow / orange / red).

---

## 9. Open Questions / Deferred to v3

- "Vs. last month" delta on category cards.
- User-creatable categories.
- Edit transaction *category* (currently only amount/note).
- CSV export.
- Investment performance tracking (units, price, P&L).
