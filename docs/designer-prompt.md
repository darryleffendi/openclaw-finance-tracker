# Designer Prompt — Personal Finance Tracker v2

> Hand this prompt to Claude design (or any AI design tool). It contains everything needed to produce mockups for the v2 redesign.

---

## Context

Design a **mobile-first, dark-themed personal finance dashboard** for a single user (Darryl, Indonesian, currency IDR). Aesthetic and information density should feel like **Monarch** — clean, modern, generous whitespace, soft card shadows, friendly iconography, dark navy/black background, vibrant accents for positive/negative states.

The user logs transactions primarily via Telegram (outside this app); the dashboard is mostly used to **check budgets and decide whether they can spend money today**. Read-mostly.

---

## User & device

- **Single user.** No user list, no avatars, no sharing.
- **Primary device: mobile browser** (iPhone-sized). Used multiple times per day for quick "can I spend this?" checks.
- **Secondary device: desktop browser**. Used weekly for review and to edit settings.
- Authenticated via Google OAuth (single-account whitelist) — login screen shows only a "Sign in with Google" button.

---

## Currency & locale

- **All amounts in IDR**, formatted as `Rp 2.100.000` (Indonesian: dots as thousands separators, no decimals).
- Negative values: `−Rp 50.000`, in red.
- Dates in user-friendly form (e.g. "Mon 4 May") in transaction lists; ISO in modal inputs.

---

## Screens to design

### 1. Login

Minimal. Dark gray-950 background. Centered: app name/logo + tagline ("Your money, at a glance") + a single "Sign in with Google" button.

### 2. Dashboard (the main view)

**Order top-to-bottom on mobile:**

1. **Header bar** — App name (small) on left, period selector center (e.g. "May 2026" with chevrons + tap to open calendar picker), settings gear + add button on right.
2. **"Today's allowance" hero card** *(only when period = current month)*:
   - Large headline: `Rp 89.000 left to spend today`
   - Sub-line: `Across food, groceries, transport`
   - Small expand chevron → reveals per-category breakdown (food: Rp 70k, groceries: Rp 9k, transport: Rp 10k).
   - When over today's allowance: hero reads `Rp 25.000 over today's allowance` in red, with a soft note "Tomorrow's allowance will be reduced."
3. **Summary strip** — Income / Expense / Net for selected period. Three values in a row, light typography, no card chrome.
4. **Account cards** — One per account, full-width on mobile. Each card:
   - Account name + small type icon (income / expense / savings)
   - Big remaining number (e.g. `Rp 1.420.000 left`)
   - Sub-line: `Spent Rp 680.000 of Rp 2.100.000`
   - Progress bar with three-tier color:
     - Green `>40%` remaining
     - Yellow `10–40%`
     - Orange `0–10%`
     - Red — negative (over budget); progress bar fills past 100% with red, label "Over by Rp X"
   - Tiny "↻ recurring" or "N subcategories" hint if relevant
5. **Charts (collapsed by default on mobile)** — "Show charts" toggle expands:
   - Donut: spending breakdown by expense category for selected period
   - Bar: income vs. expense, last 6 months
6. **Transaction list** — Filter chips (All / Food / Transport / …) at top, then rows:
   - Row layout: small category icon + (subcategory · note) + amount on right
   - Pencil + trash icons on hover (desktop) / always visible (mobile)
   - Salary rows show a subtle "Distributed across 8 accounts" badge
   - Recurring-generated rows show a small `↻` badge

**Desktop layout (≥1024px):** two-column.
- Left (60%): hero card → summary → account cards (3-col grid) → charts.
- Right (40%): sticky transaction list.

### 3. Category detail (tap on an account card)

- Header: account name + remaining + progress bar (same component as card, larger).
- Subcategory breakdown: small horizontal bars showing which subcategories took the most.
- Filtered transaction list for this category.
- Edit budget shortcut at top right.

### 4. Add Transaction modal

- Triggered by FAB (mobile, bottom-right) or top-right button (desktop).
- Fields: amount (large numeric input with "Rp" prefix), type toggle (income / expense), category dropdown, subcategory dropdown (dynamic — populated from selected category's subcategory list), date (defaults today), note (optional, single line).
- Primary action: "Add transaction." Secondary: "Cancel."

### 5. Edit Transaction modal

- Same shape as Add, but only **amount** and **note** are editable. Type and category are read-only with a small "non-editable in v2" hint.
- For salary transactions, show a banner: "Editing this amount will re-distribute the salary across all expense and savings accounts."

### 6. Settings page

Three sections, tab- or accordion-style:

- **Budgets**
  - Table/list of all 10 accounts.
  - Inline-edit `monthly_budget` (numeric IDR input).
  - Toggle for `per_day_budget` (with a small "?" tooltip: "When on, this account contributes to today's allowance.").
- **Subcategories**
  - Per-account chip editor. Add a chip = type + Enter; remove a chip = click the ×.
- **Recurring**
  - List of rules. Each rule shows: name, amount, category, day-of-month, on/off toggle.
  - Tap rule → edit modal (all fields).
  - "+ New rule" button.
  - "Run now" button at top with a one-line explainer.
- Footer: logout button, app version.

### 7. Calendar period picker

Triggered by tapping the period in the header. Three tabs: **Day / Week / Month**.
- Day: classic calendar grid, single date.
- Week: same grid, hover/tap highlights the entire week (Mon–Sun).
- Month: month-grid (3×4) with year stepper.
- Bottom of picker: "← Previous" / "Today" / "Next →" shortcuts.

---

## Visual direction

- **Background:** very dark navy/charcoal (e.g. `#0a0d12` or `gray-950`).
- **Cards:** slightly lighter panel (`gray-900` or with a hint of blue), soft 1px border (`gray-800`), large rounded corners (`rounded-2xl`), subtle shadow.
- **Typography:** Inter or similar geometric sans. Numerical amounts use tabular figures. Strong size hierarchy (hero number ≈ 32–40px, card "remaining" ≈ 24px, body 14–15px).
- **Primary accent:** vibrant indigo (e.g. `indigo-500`).
- **Status colors:**
  - Green for healthy / income (e.g. `emerald-400`)
  - Yellow for "starting to watch" (`amber-400`)
  - Orange for "almost out" (`orange-500`)
  - Red for "over budget" (`red-500`)
- **Income vs expense semantics:** income amounts in green, expense in default white / soft, savings in indigo, over-budget always red.
- **Icons:** lucide-react (already common with Tailwind). Small, consistent stroke width.
- **Whitespace:** generous. Don't pack rows tightly. Aim for a calm, glanceable feel.

---

## Behavior callouts

- **Salary auto-distribution** must be visually surfaced — when a salary transaction appears in the list, show a "Distributed across N accounts" badge that on tap lists the derived rows.
- **Recurring transactions** should carry a small `↻` icon so the user can recognize auto-created ones at a glance.
- **Over-budget state** is the single most attention-grabbing visual — red progress bar, red number, and ideally a small caret/icon. But don't overdo it; the rest of the UI should remain calm.
- **Today's allowance card** is the single most-glanced piece of UI. Make it the obvious focal point on first load.

---

## Constraints

- Single-page app (no routing); modal/drawer overlays for detail views and forms.
- Tech: React + Vite + Tailwind + Recharts. lucide-react icons. No additional component library required.
- No keyboard shortcuts assumed (but a quick-add shortcut on desktop would be a nice-to-have).
- Avoid skeuomorphism, gradients-as-decoration, or playful illustrations. Tone is calm, grown-up, data-respecting.

---

## Out of scope (do not design)

- Multi-user / household / sharing UI.
- Bank sync / transaction import flows.
- Investment performance charts (P&L, holdings).
- Year-over-year comparisons.
- CSV export.
- Custom user-created categories (account list is fixed).

---

## Reference

The product ethos to match: **Monarch Money** (monarchmoney.com). Clean, dense, dark, calm, numerical, modern.
