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
- Shows total allowance for today summed across all accounts where `daily_budget_enabled = true`.
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
  - **Budgets** — list of accounts with editable `monthly_budget` and `daily_budget_enabled` toggle.
  - **Subcategories** — per-account JSON list editor (chip add/remove UI; underlying data is JSON in `accounts.subcategories`).
  - **Recurring** — list with create / edit / delete / enable-toggle / run-now.
- Logout button at the bottom.

### 5.10 Balance Semantics

All monthly balance figures are sourced from the `account_buckets` table (one row per `(slug, year_month)`, with four columns: `income`, `expense`, `auto_dist_in`, `auto_dist_out`). The legacy `accounts.balance` column has been removed. Frontend reads month data via `GET /api/buckets?month=YYYY-MM`.

Per account type:

| Account type | Card "Remaining" | "Spent / Saved" | Source columns |
|---|---|---|---|
| Expense | `monthly_budget − bucket.expense` (can be negative; render red) | `bucket.expense` | `expense` |
| Income (salary, freelance) | `bucket.income` (received this month) vs `monthly_budget` | `bucket.income` | `income` |
| Savings / Investments | `bucket.income + bucket.auto_dist_in` for the month vs `monthly_budget`; **also show all-time total** | sum of `income + auto_dist_in` for the month | `income`, `auto_dist_in` |

All-time savings totals are computed via `SUM(income + auto_dist_in)` across all months for the account.

Negative "Remaining" on expense accounts renders as `−Rp X` in red with the over-budget warning state.

Auto-distribution semantics: when salary income is recorded, `distribute_within` inserts target income rows (incrementing each target's `auto_dist_in`) and one matching source mirror expense row on salary (incrementing `auto_dist_out`). The "real" income and expense columns exclude auto-distribution movement so the summary income/expense totals reflect actual external money flow, not internal transfers.

### 5.11 Login Screen

- App logo / name centered.
- Single "Sign in with Google" button.
- Dark theme, minimal.
- Reuses existing OAuth backend.

---

## 6. Schema Changes

### 6.1 `accounts` table

```sql
ALTER TABLE accounts ADD COLUMN daily_budget_enabled INTEGER NOT NULL DEFAULT 0;
-- subcategories assumed to already exist as TEXT (JSON-encoded array)
```

Seed updates:

| Slug | daily_budget_enabled |
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

### 6.3 `account_buckets` table *(already shipped as buckets refactor prerequisite)*

```sql
CREATE TABLE account_buckets (
    slug          TEXT NOT NULL,
    year_month    TEXT NOT NULL,                 -- 'YYYY-MM'
    income        REAL NOT NULL DEFAULT 0,       -- real income only
    expense       REAL NOT NULL DEFAULT 0,       -- real expense only
    auto_dist_in  REAL NOT NULL DEFAULT 0,       -- auto-distribution received
    auto_dist_out REAL NOT NULL DEFAULT 0,       -- auto-distribution source mirror
    PRIMARY KEY (slug, year_month),
    FOREIGN KEY (slug) REFERENCES accounts(slug)
);
```

Rows are created lazily on first transaction for a given `(slug, year_month)` via UPSERT in `account_bucket_repository.apply_delta`. The legacy `accounts.balance` column has been dropped.

### 6.4 Indexes (perf)

```sql
CREATE INDEX IF NOT EXISTS idx_txn_date ON transactions(date);
CREATE INDEX IF NOT EXISTS idx_txn_category_date ON transactions(category, date);
```

---

## 7. API Changes

### Already-shipped endpoints (buckets refactor)

| Method | Path | Description |
|---|---|---|
| GET | `/api/buckets?month=YYYY-MM` | `{ month, buckets: [{slug, year_month, income, expense, auto_dist_in, auto_dist_out}] }` |

### New endpoints (PRD v2) — all shipped ✓

| Method | Path | Status | Description |
|---|---|---|---|
| GET | `/api/today` | ✓ shipped | `{ total_allowance, days_remaining, breakdown, over_budget }` |
| PATCH | `/api/transactions/:id` | ✓ shipped | Edit amount/note. Salary: re-runs distribution (id changes). Auto-dist rows: 400. |
| GET | `/api/recurring` | ✓ shipped | List rules |
| POST | `/api/recurring` | ✓ shipped | Create rule |
| PATCH | `/api/recurring/:id` | ✓ shipped | Update rule |
| DELETE | `/api/recurring/:id` | ✓ shipped | Delete rule |
| POST | `/api/recurring/run` | ✓ shipped | Force-materialize all enabled rules for current month |
| PATCH | `/api/accounts/:slug` | ✓ shipped | Edit `monthly_budget`, `daily_budget_enabled`, `subcategories`, `display_name` |

### Behavior changes — shipped ✓

- Any GET against `/api/transactions`, `/api/summary`, `/api/today`, or `/api/accounts` first runs `recurring_service.materialize_if_needed()` for the current month.

---

## 8. Acceptance Criteria

**Backend (verified)**
- [x] Daily allowance updates immediately after adding/deleting a transaction (`daily_budget_enabled=1` accounts only).
- [x] Categories with `daily_budget_enabled = false` do **not** appear in today's allowance.
- [x] First API read of a new month auto-creates recurring transactions with their configured `date` (day clamped to last day of month).
- [x] Salary recurring rule triggers full auto-distribution cascade.
- [x] Editing a salary transaction's amount re-distributes proportionally; deleting reverses cleanly.
- [x] PATCH `/api/accounts/:slug` updates budget/daily_budget_enabled/subcategories.
- [x] PATCH `/api/transactions/:id` rejects auto-distribution rows with 400.
- [x] All bucket invariants hold after every write operation.

**Frontend (pending — owned separately)**
- [ ] Negative remaining renders red, no NaN, no UI break.
- [ ] Mobile (<768px) layout: hero allowance card + at least 2 account cards visible above the fold; charts collapsed.
- [ ] Settings page allows editing all budgets, daily_budget_enabled flags, subcategories, and recurring rules without touching the DB.
- [ ] Period selector supports day/week/month with calendar picker, defaulting to current month.
- [ ] Three-tier color states render correctly (green / yellow / orange / red).

---

## 9. Open Questions / Deferred to v3

- "Vs. last month" delta on category cards.
- User-creatable categories.
- Edit transaction *category* (currently only amount/note).
- CSV export.
- Investment performance tracking (units, price, P&L).
