# Personal Finance Tracker — API Specification

**Base URL:** `http://localhost:8009` (production: your reverse-proxy domain)  
**Format:** All request and response bodies are `application/json`  
**Auth:** Session cookie (`session` cookie set after Google OAuth flow). All `/api/*` routes except the auth flow return `401` if unauthenticated.  
**Currency:** Indonesian Rupiah (IDR), stored and returned as plain float. Display with dots as thousand separators: `Rp 2.100.000`.  
**Dates:** `YYYY-MM-DD` strings (e.g. `"2026-05-19"`).  
**Months:** `YYYY-MM` strings (e.g. `"2026-05"`).

---

## Authentication

### `GET /api/auth/login`
Redirects browser to Google OAuth consent screen. Navigate the user here to start login.

**Response:** `302` redirect to Google.

---

### `GET /api/auth/callback`
OAuth callback — handled by the backend automatically. After success, sets a session cookie and redirects to `/`.  
Do not call this directly from the frontend; it's used by Google's OAuth redirect.

---

### `GET /api/auth/logout`
Clears the session and redirects to `/`.

**Response:** `302` redirect to `/`.

---

## Accounts

### `GET /api/accounts`
Returns all accounts in display order. Also triggers lazy materialization of any due recurring transactions.

**Response** `200`:
```json
[
  {
    "slug": "salary",
    "display_name": "Salary",
    "type": "income",
    "monthly_budget": 19875000.0,
    "per_day_budget": 0,
    "subcategories": [],
    "sort_order": 1,
    "created_at": "2026-04-07 17:57:10"
  },
  {
    "slug": "food",
    "display_name": "Food",
    "type": "expense",
    "monthly_budget": 2100000.0,
    "per_day_budget": 1,
    "subcategories": ["dine", "gofood", "grabfood", "snack"],
    "sort_order": 4,
    "created_at": "2026-04-07 17:57:10"
  }
]
```

**Account types:**

| `type` | Meaning |
|---|---|
| `income` | Receives salary/freelance income |
| `expense` | Regular spending category |
| `savings` | Savings or investment account |
| `holding` | Intermediate holding (freelance funds) |

**`per_day_budget`:** `1` = this account contributes to the Today's Allowance hero card; `0` = excluded. Currently `1` for: food, groceries, transport.

**All accounts (in sort order):**

| slug | display_name | type |
|---|---|---|
| `salary` | Salary | income |
| `freelance` | Freelance | holding |
| `fixed` | Fixed Obligations | expense |
| `food` | Food | expense |
| `groceries` | Groceries & Personal Care | expense |
| `transport` | Transport | expense |
| `wellness` | Wellness & Personal | expense |
| `entertainment` | Social & Entertainment | expense |
| `savings` | Savings | savings |
| `investments` | Investments | savings |

> **Note:** `GET /api/accounts` returns no balance. Balances come from `/api/buckets`.

---

### `PATCH /api/accounts/:slug`
Partial update of an account. Supply any subset of editable fields.

**Request body** (all fields optional, supply at least one):
```json
{
  "monthly_budget": 2500000,
  "per_day_budget": 1,
  "subcategories": ["dine", "gofood", "grabfood"],
  "display_name": "Food & Drink"
}
```

**Response** `200` — updated account object (same shape as `GET /api/accounts` items).

**Errors:**
- `400` — no recognised fields supplied, or validation error
- `404` — slug not found

---

## Buckets (monthly balances)

Monthly aggregated balances keyed by `(slug, year_month)`. This is the primary source for per-account balance data on the dashboard.

### `GET /api/buckets?month=YYYY-MM`

`month` defaults to the current month if omitted.

**Response** `200`:
```json
{
  "month": "2026-05",
  "buckets": [
    {
      "slug": "food",
      "year_month": "2026-05",
      "income": 0.0,
      "expense": 1220500.0,
      "auto_dist_in": 1303779.0,
      "auto_dist_out": 0.0
    },
    {
      "slug": "salary",
      "year_month": "2026-05",
      "income": 12222000.0,
      "expense": 0.0,
      "auto_dist_in": 0.0,
      "auto_dist_out": 12222000.0
    }
  ]
}
```

**Bucket columns:**

| field | meaning |
|---|---|
| `income` | Real income received this month (excludes auto-distribution) |
| `expense` | Real expenses paid this month (excludes auto-distribution mirror) |
| `auto_dist_in` | Amount received via salary auto-distribution |
| `auto_dist_out` | Amount paid out via salary auto-distribution (source account only) |

**How to compute per-account balance for the dashboard:**

| Account type | "Remaining" formula | "Spent/Saved" |
|---|---|---|
| `expense` | `monthly_budget − bucket.expense` (negative = over budget) | `bucket.expense` |
| `income` | `bucket.income` (received this month) | `bucket.income` |
| `savings` | `bucket.income + bucket.auto_dist_in` (net deposits this month) | same |

**All-time savings total:** Sum `income + auto_dist_in` across all months for that slug.

**Budget remaining for `per_day_budget` accounts:** `monthly_budget − bucket.expense`

> Bucket rows are created on first transaction for a `(slug, month)` pair. An account with no activity in a month will have no bucket row for that month — treat missing rows as all zeros.

---

## Today's Allowance

### `GET /api/today`
Computes today's daily spending allowance across all accounts with `per_day_budget = 1`. Also triggers lazy recurring materialization.

**Formula per account:** `(monthly_budget − bucket.expense) / days_remaining_in_month` (days inclusive of today).

**Response** `200`:
```json
{
  "date": "2026-05-19",
  "days_remaining": 13,
  "total_allowance": 87193,
  "over_budget": false,
  "breakdown": [
    {
      "category": "food",
      "display_name": "Food",
      "monthly_budget": 2100000.0,
      "spent_this_month": 1220500.0,
      "remaining_in_month": 879500.0,
      "daily_allowance": 67654
    },
    {
      "category": "groceries",
      "display_name": "Groceries & Personal Care",
      "monthly_budget": 281000.0,
      "spent_this_month": 106000.0,
      "remaining_in_month": 175000.0,
      "daily_allowance": 13462
    },
    {
      "category": "transport",
      "display_name": "Transport",
      "monthly_budget": 300000.0,
      "spent_this_month": 221000.0,
      "remaining_in_month": 79000.0,
      "daily_allowance": 6077
    }
  ]
}
```

**Fields:**
- `total_allowance` — sum of all `daily_allowance` values; negative means over budget
- `over_budget` — `true` when `total_allowance < 0`
- `days_remaining` — calendar days left in the month, including today
- `breakdown` — only accounts where `per_day_budget = 1`

> If no accounts have `per_day_budget = 1`, `breakdown` is empty and `total_allowance` is `0`.

---

## Transactions

### `GET /api/transactions`
List transactions. Also triggers lazy recurring materialization.

**Query params:**

| param | values | default | effect |
|---|---|---|---|
| `period` | `today`, `this-week`, `this-month`, `last-month`, `all` | `this-month` | Filter by date range |
| `category` | account slug | — | Filter by category (overrides `period`) |

**Response** `200` — array of transaction objects, ordered by date DESC, id DESC:
```json
[
  {
    "id": 178,
    "date": "2026-05-13",
    "amount": 15000.0,
    "type": "expense",
    "category": "food",
    "subcategory": "snack",
    "note": "coffee",
    "created_at": "2026-05-13 09:07:21"
  }
]
```

**Special rows:**  
Auto-distribution rows have `note = "auto-distribution from salary"`. These are internal transfers generated when a salary income is recorded. They should typically be displayed with a badge rather than as regular transactions, and cannot be edited directly via `PATCH`.

---

### `POST /api/transactions`
Create a transaction.

**Request body:**
```json
{
  "amount": 50000,
  "type": "expense",
  "category": "food",
  "subcategory": "gofood",
  "note": "lunch",
  "date": "2026-05-19"
}
```

| field | required | notes |
|---|---|---|
| `amount` | yes | positive float, IDR |
| `type` | yes | `"income"` or `"expense"` |
| `category` | yes | account slug |
| `subcategory` | no | free text; should match account's `subcategories` list |
| `note` | no | free text description |
| `date` | no | `YYYY-MM-DD`; defaults to today |

**Response** `201`:
```json
{ "success": true, "id": 181 }
```

If `category = "salary"` and `type = "income"`, salary auto-distribution fires and the response includes:
```json
{
  "success": true,
  "id": 181,
  "distributions": [
    { "account": "fixed", "amount": 2148132 },
    { "account": "food", "amount": 1303779 },
    { "account": "groceries", "amount": 174458 },
    { "account": "transport", "amount": 186254 },
    { "account": "wellness", "amount": 209846 },
    { "account": "entertainment", "amount": 527720 },
    { "account": "savings", "amount": 7671811 }
  ]
}
```

---

### `PATCH /api/transactions/:id`
Edit a transaction's `amount` and/or `note`. Type and category are immutable.

**Request body** (supply at least one):
```json
{ "amount": 75000, "note": "updated note" }
```

**Response** `200`:
```json
{
  "new_id": 181,
  "old_id": 181,
  "salary_redistributed": false
}
```

**Salary amount edits:** When editing the `amount` of a salary income transaction, the backend cascade-deletes the old row and all its auto-distribution rows, then reinserts with the new amount. The `new_id` will differ from `old_id`. Refresh your transaction list after this call.

```json
{
  "new_id": 205,
  "old_id": 181,
  "salary_redistributed": true,
  "distributions": [...]
}
```

**Errors:**
- `400` — no fields supplied, or row is an auto-distribution row (edit the parent salary transaction instead)
- `404` — transaction not found

---

### `DELETE /api/transactions/:id`
Delete a transaction. If the deleted row is a salary income, all its auto-distribution rows are cascade-deleted and all bucket values reversed.

**Response** `200`:
```json
{ "success": true, "id": 181 }
```

**Error** `404`:
```json
{ "success": false, "error": "Not found" }
```

---

## Summary

### `GET /api/summary`
Aggregate income/expense totals for a period. Also triggers lazy recurring materialization.

**Query params:**

| param | values | default |
|---|---|---|
| `period` | `today`, `this-week`, `this-month`, `last-month`, `all` | `this-month` |

`this-month` and `last-month` are served from the buckets table (fast). Other periods aggregate from the transactions table.

Auto-distribution rows are **excluded** from totals — `income` and `expense` reflect real external money flow only.

**Response** `200`:
```json
{
  "period": "this-month",
  "income": 12222000.0,
  "expense": 5884100.0,
  "balance": 6337900.0,
  "transaction_count": 47,
  "accounts": [ ... ]
}
```

`accounts` is the same array as `GET /api/accounts` (no balance included).

---

## Recurring Transactions

Rules that auto-create a transaction on a configurable day each month. Materialization happens lazily on the first read of each month (via `GET /api/transactions`, `/api/summary`, `/api/accounts`, or `/api/today`).

### Rule object shape
```json
{
  "id": 1,
  "name": "Rent",
  "amount": 2200000.0,
  "type": "expense",
  "category": "fixed",
  "subcategory": null,
  "note": "monthly rent",
  "day_of_month": 25,
  "enabled": 1,
  "last_run_month": "2026-05",
  "created_at": "2026-05-19 10:00:00"
}
```

`day_of_month` is clamped to the last day of short months (e.g. `31` → `28` in February).  
`enabled`: `1` = active, `0` = paused.  
`last_run_month`: the most recent month the rule materialized; `null` if never run.

---

### `GET /api/recurring`
**Response** `200` — array of rule objects.

---

### `POST /api/recurring`
Create a rule.

**Request body:**
```json
{
  "name": "Rent",
  "amount": 2200000,
  "type": "expense",
  "category": "fixed",
  "day_of_month": 25,
  "subcategory": null,
  "note": "monthly rent",
  "enabled": 1
}
```

| field | required |
|---|---|
| `name` | yes |
| `amount` | yes |
| `type` | yes — `"income"` or `"expense"` |
| `category` | yes |
| `day_of_month` | yes — integer 1–31 |
| `subcategory` | no |
| `note` | no |
| `enabled` | no — defaults to `1` |

**Response** `201` — the created rule object.

**Errors:** `400` if required fields are missing.

---

### `PATCH /api/recurring/:id`
Update a rule. Supply any subset of: `name`, `amount`, `type`, `category`, `subcategory`, `note`, `day_of_month`, `enabled`.

**Request body example** (enable/disable toggle):
```json
{ "enabled": 0 }
```

**Response** `200` — updated rule object.

**Errors:** `400` if no fields supplied; `404` if not found.

---

### `DELETE /api/recurring/:id`
Delete a rule. Does not delete already-materialized transactions.

**Response** `200`:
```json
{ "success": true, "id": 1 }
```

**Error** `404`.

---

### `POST /api/recurring/run`
Force-materializes all enabled rules for the current month, regardless of `last_run_month`. Idempotent per-month — safe to call any time.

**Response** `200`:
```json
{
  "materialized": 2,
  "transactions": [
    { "rule_id": 1, "name": "Rent", "txn_id": 182 },
    { "rule_id": 2, "name": "Salary", "txn_id": 183 }
  ]
}
```

If a salary rule materializes, auto-distribution fires automatically (same as a manual salary insert). `materialized` counts how many rules ran.

---

## Distribute (manual)

### `POST /api/distribute`
Manually distribute a lump sum across expense/savings accounts by budget proportions. Used for freelance income. Does **not** create an income row on the source account — call this after you've already recorded the freelance income transaction.

**Request body:**
```json
{
  "amount": 2000000,
  "source_account": "freelance"
}
```

`source_account` defaults to `"freelance"` if omitted.

**Response** `201`:
```json
{
  "source": "freelance",
  "total": 2000000.0,
  "distributions": [
    { "account": "fixed", "amount": 351672 },
    { "account": "food", "amount": 213395 }
  ]
}
```

---

## Common error shapes

All error responses have the same shape:
```json
{ "error": "Human-readable error message" }
```

| Status | Meaning |
|---|---|
| `400` | Bad request (missing or invalid fields) |
| `401` | Not authenticated — redirect to `/api/auth/login` |
| `403` | Authenticated but not in the allowed-email list |
| `404` | Resource not found |

---

## Data model notes

### Balance / remaining — how to build each card

**Expense category card:**
- Remaining: `monthly_budget − bucket.expense` (can be negative = over budget)
- Spent: `bucket.expense`
- Progress bar %: `bucket.expense / monthly_budget * 100`

**Income category card (salary, freelance):**
- Received this month: `bucket.income`
- Compared against: `monthly_budget` (expected salary)

**Savings / investments card:**
- This month: `bucket.income + bucket.auto_dist_in`
- All-time total: `SUM(income + auto_dist_in)` across all months → call `GET /api/buckets` for each month, or use a dedicated endpoint when added

**Today's allowance hero:**
- Use `GET /api/today` directly; it does all the math
- Only accounts with `per_day_budget = 1` appear in `breakdown`

### Salary auto-distribution badge
Transactions where `note === "auto-distribution from salary"` are internal transfers, not real user expenses. Show them in the transaction list with a badge/indicator rather than as normal rows. They cannot be PATCH-edited — the parent salary row is the edit target.

### Recurring transaction badge
Transactions auto-created by recurring rules have their `note` prefixed with `"recurring: "` (e.g. `"recurring: Rent"`) unless the rule specifies a custom note.

### IDR formatting
Format amounts as `Rp X.XXX.XXX` (dots as thousands separators, no decimals):
```js
new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', maximumFractionDigits: 0 }).format(amount)
// → "Rp 2.100.000"
```

---

## Typical dashboard load sequence

```
1. GET /api/auth/login          — if not authenticated (401 on any call)
2. GET /api/accounts            — account metadata (slugs, types, budgets, per_day_budget)
3. GET /api/buckets?month=YYYY-MM  — monthly balances for all accounts
4. GET /api/today               — hero card: daily allowance
5. GET /api/summary?period=this-month  — top summary bar
6. GET /api/transactions?period=this-month  — transaction list
7. GET /api/recurring           — settings: recurring rules list
```

Calls 3–7 can fire in parallel once 2 resolves (accounts needed for display names, but not a hard data dependency for 3–7).

---

## Server info

- Port: `8009`
- Auth: session cookie (SameSite, HttpOnly); include `credentials: 'include'` in every `fetch` call
- CORS: allowed origins configured in `backend/config.py` (`CORS_ORIGINS`); currently `http://localhost:5179`
