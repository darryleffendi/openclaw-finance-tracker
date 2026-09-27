// Period model for the dashboard: a selected date range plus how it was chosen.
//   { mode, start, end, label }
//   mode  — "date" | "week" | "month" | "range" | "all"
//   start/end — "YYYY-MM-DD" inclusive, or null/null for all time
//   label — short display string for the header button
import { daysInMonth } from "./format"

const SHORT_MONTHS = [
  "Jan", "Feb", "Mar", "Apr", "May", "Jun",
  "Jul", "Aug", "Sep", "Oct", "Nov", "Dec",
]

// ── Date <-> YYYY-MM-DD (local, no timezone drift) ─────────────────────────
export function toYmd(date) {
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}-${String(date.getDate()).padStart(2, "0")}`
}

export function fromYmd(ymd) {
  const [y, m, d] = ymd.split("-").map(Number)
  return new Date(y, m - 1, d)
}

function addDays(date, n) {
  const d = new Date(date)
  d.setDate(d.getDate() + n)
  return d
}

// Monday-based start of the week containing `date`.
function startOfWeek(date) {
  const dow = date.getDay() // 0=Sun..6=Sat
  return addDays(date, -((dow + 6) % 7))
}

// ── Label formatting ───────────────────────────────────────────────────────
function fmtDay(ymd, withYear) {
  const d = fromYmd(ymd)
  const base = `${d.getDate()} ${SHORT_MONTHS[d.getMonth()]}`
  return withYear ? `${base} ${d.getFullYear()}` : base
}

function rangeLabel(start, end) {
  const a = fromYmd(start)
  const b = fromYmd(end)
  const sameYear = a.getFullYear() === b.getFullYear()
  if (a.getMonth() === b.getMonth() && sameYear) {
    return `${a.getDate()}–${b.getDate()} ${SHORT_MONTHS[a.getMonth()]}`
  }
  return `${fmtDay(start, !sameYear)} – ${fmtDay(end, true)}`
}

// ── Constructors ───────────────────────────────────────────────────────────
export function makeDate(ymd) {
  const now = new Date()
  const withYear = fromYmd(ymd).getFullYear() !== now.getFullYear()
  return { mode: "date", start: ymd, end: ymd, label: fmtDay(ymd, withYear) }
}

export function makeWeek(ymd) {
  const start = startOfWeek(fromYmd(ymd))
  const end = addDays(start, 6)
  return {
    mode: "week",
    start: toYmd(start),
    end: toYmd(end),
    label: rangeLabel(toYmd(start), toYmd(end)),
  }
}

// monthIndex is 0-based
export function makeMonth(year, monthIndex) {
  const start = `${year}-${String(monthIndex + 1).padStart(2, "0")}-01`
  const last = daysInMonth(year, monthIndex + 1)
  const end = `${year}-${String(monthIndex + 1).padStart(2, "0")}-${String(last).padStart(2, "0")}`
  return {
    mode: "month",
    start,
    end,
    label: `${SHORT_MONTHS[monthIndex]} ${year}`,
  }
}

export function makeRange(a, b) {
  const [start, end] = fromYmd(a) <= fromYmd(b) ? [a, b] : [b, a]
  return { mode: "range", start, end, label: rangeLabel(start, end) }
}

export function presetToday() {
  return { ...makeDate(toYmd(new Date())), label: "Today" }
}

export function presetThisMonth() {
  const now = new Date()
  return { ...makeMonth(now.getFullYear(), now.getMonth()), label: "This month" }
}

export function presetAllTime() {
  return { mode: "all", start: null, end: null, label: "All time" }
}

export function defaultPeriod() {
  return presetThisMonth()
}

// ── Derived helpers ────────────────────────────────────────────────────────
export function rangeDays(start, end) {
  return Math.round((fromYmd(end) - fromYmd(start)) / 86_400_000) + 1
}

// Prorate a monthly budget to the selected range length. Returns null for all
// time (unbounded → no budget framing). A whole-month selection returns the
// full monthly budget (rangeDays === daysInMonth).
export function proratedBudget(monthlyBudget, period) {
  if (!period.start || !period.end) return null
  const [y, m] = period.start.split("-").map(Number)
  const daily = monthlyBudget / daysInMonth(y, m)
  return daily * rangeDays(period.start, period.end)
}

// Days elapsed within the range as of `todayYmd`, for the progress-bar pace tick.
// Returns { elapsed, total }; both null for all time.
export function rangePace(period, todayYmd) {
  if (!period.start || !period.end) return { elapsed: null, total: null }
  const total = rangeDays(period.start, period.end)
  const t = fromYmd(todayYmd)
  if (t < fromYmd(period.start)) return { elapsed: 0, total }
  if (t > fromYmd(period.end)) return { elapsed: total, total }
  return { elapsed: rangeDays(period.start, todayYmd), total }
}
