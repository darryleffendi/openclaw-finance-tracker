Context & Prompt for Frontend Designer

---
Project Context

App: Personal Finance Tracker — a single-user web
  dashboard for Darryl (Indonesian user, currency
IDR).

Tech Stack:
- Backend: Python + Flask (port 8009), SQLite,
Google OAuth (single-user whitelist)
- Frontend: React + Vite + Tailwind CSS +
Recharts

Authentication: Google OAuth. Single allowed
user. Login at /api/auth/login,
session-cookie-based. All API routes return 401
if unauthenticated.

---
Data Model

Accounts (fixed categories, seeded once):

┌────────────┬────────────┬───────┬─────────┐
│            │  Display   │       │ Monthly │
│    Slug    │    Name    │ Type  │  Budget │
│            │            │       │  (IDR)  │
├────────────┼────────────┼───────┼─────────┤
│ salary     │ Salary     │ incom │ 19,875, │
│            │            │ e     │ 000     │
├────────────┼────────────┼───────┼─────────┤
│ freelance  │ Freelance  │ holdi │ 0       │
│            │            │ ng    │         │
├────────────┼────────────┼───────┼─────────┤
│ fixed      │ Fixed Obli │ expen │ 3,460,0 │
│            │ gations    │ se    │ 00      │
├────────────┼────────────┼───────┼─────────┤
│ food       │ Food       │ expen │ 2,100,0 │
│            │            │ se    │ 00      │
├────────────┼────────────┼───────┼─────────┤
│            │ Groceries  │ expen │         │
│ groceries  │ & Personal │ se    │ 281,000 │
│            │  Care      │       │         │
├────────────┼────────────┼───────┼─────────┤
│ transport  │ Transport  │ expen │ 300,000 │
│            │            │ se    │         │
├────────────┼────────────┼───────┼─────────┤
│ wellness   │ Wellness & │ expen │ 338,000 │
│            │  Personal  │ se    │         │
├────────────┼────────────┼───────┼─────────┤
│ entertainm │ Social &   │ expen │         │
│ ent        │ Entertainm │ se    │ 850,000 │
│            │ ent        │       │         │
├────────────┼────────────┼───────┼─────────┤
│ savings    │ Savings /  │ savin │ 12,357, │
│            │ Investment │ gs    │ 000     │
└────────────┴────────────┴───────┴─────────┘

Each account also has a balance (running total)
and optional subcategories array.

Transaction schema:
id, date (YYYY-MM-DD), amount (IDR float), type
(income|expense),
category (account slug), subcategory (optional),
note (optional), created_at

Special behavior: Inserting a salary income
transaction automatically distributes funds
proportionally across all expense/savings
accounts. Deleting a salary transaction cascades
and reverses those distributions.

---
API Endpoints

Method: GET
Path: /api/auth/login
Description: Redirect to Google OAuth
────────────────────────────────────────
Method: GET
Path: /api/auth/logout
Description: Clear session, redirect to /
────────────────────────────────────────
Method: GET
Path: /api/transactions?period=<p>
Description: List transactions. Period: today,
  this-week, this-month, last-month, all
────────────────────────────────────────
Method: GET
Path: /api/transactions?category=<slug>
Description: Filter by account
────────────────────────────────────────
Method: POST
Path: /api/transactions
Description: Create transaction {amount, type,
  category, subcategory?, note?, date?}
────────────────────────────────────────
Method: DELETE
Path: /api/transactions/:id
Description: Delete (cascades salary
  distributions)
────────────────────────────────────────
Method: GET
Path: /api/summary?period=<p>
Description: Returns {income, expense, balance,
  transaction_count, accounts[]}
────────────────────────────────────────
Method: GET
Path: /api/accounts
Description: All accounts with balance, budget,
  subcategories
────────────────────────────────────────
Method: POST
Path: /api/distribute
Description: Manual distribution {amount,
  source_account?}

---
Current Frontend State (minimal, functional)

- Dark theme (bg-gray-950), max-w-4xl centered
layout
- Period filter tabs (today / this-week /
this-month / last-month / all)
- Summary card (income, expense, balance)
- Charts (Recharts — currently minimal)
- Transaction list with delete
- Add Transaction form (inline toggle)
- No login/logout UI yet — needs to be added

---
Designer Prompt

▎ Design a dashboard UI for a personal finance
▎ tracker app.
▎
▎ User: Single person (Darryl), Indonesian,
▎ currency IDR. Accessed via web browser only.
▎
▎ Core screens needed:
▎ 1. Login screen — Google Sign-In button only.
▎ Clean, minimal.
▎ 2. Dashboard — The main view. Should show:
▎   - Period selector (Today / This Week / This
▎ Month / Last Month / All)
▎   - Summary bar: total income, total expense,
▎ net balance for the selected period
▎   - Account cards: each of the 9 accounts
▎ (salary, freelance, food, etc.) showing current
▎  balance and % of monthly budget used — styled
▎ differently for income vs expense vs savings
▎ types
▎   - Charts: spending breakdown by account
▎ (donut or bar), income vs expense over time
▎   - Transaction list: date, category,
▎ subcategory, note, amount — with delete action
▎   - "Add Transaction" form/modal: fields for
▎ amount, type (income/expense), category
▎ (dropdown from accounts), subcategory (dynamic
▎ dropdown based on category), note, date
▎
▎ Design direction:
▎ - Dark theme (current base: gray-950
▎ background, indigo accents)
▎ - Clean and data-dense but not cluttered — this
▎  is a personal tool, not a SaaS product
▎ - Mobile-aware but desktop-first (used mainly
▎ on desktop browser)
▎ - IDR amounts should be formatted as Rp
▎ 2.100.000 (Indonesian locale: dots as thousands
▎  separators)
▎ - Highlight when an account's balance exceeds
▎ its monthly budget (over-budget state)
▎ - The salary → auto-distribution flow should be
▎  visually surfaced somewhere (e.g. a note or
▎ badge on relevant transactions)
▎
▎ Constraints:
▎ - No routing needed — single-page app
▎ - No user management (single user, auth handled
▎  by Google OAuth)
▎ - Component library: Tailwind CSS + Recharts
▎ (already installed)


