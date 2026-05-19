import { useEffect, useState, useCallback } from "react"
import {
  getAccounts,
  getBuckets,
  getToday,
  getSummary,
  getTransactions,
} from "../api"
import { currentYearMonth, ymdToday } from "./format"

// Aggregate everything the mobile dashboard needs in a single hook.
// Triggers a refresh when period changes or when refresh() is called.
export function useDashboardData(period = "this-month", month) {
  const [accounts, setAccounts] = useState(null)
  const [buckets, setBuckets] = useState(null)
  const [today, setToday] = useState(null)
  const [summary, setSummary] = useState(null)
  const [transactions, setTransactions] = useState(null)
  const [error, setError] = useState(null)
  const [loading, setLoading] = useState(true)

  const refresh = useCallback(() => {
    const ym = month || currentYearMonth()
    setLoading(true)
    setError(null)
    Promise.all([
      getAccounts(),
      getBuckets(ym),
      getToday(),
      getSummary(period),
      getTransactions({ period }),
    ])
      .then(([a, b, t, s, tx]) => {
        setAccounts(a)
        setBuckets(b)
        setToday(t)
        setSummary(s)
        setTransactions(tx)
        setLoading(false)
      })
      .catch((e) => {
        setError(e)
        setLoading(false)
      })
  }, [period, month])

  useEffect(refresh, [refresh])

  return {
    accounts,
    buckets,
    today,
    summary,
    transactions,
    error,
    loading,
    refresh,
  }
}

// Quick helper: total of today's expense transactions (for HeroRing's spentToday).
export function sumSpentToday(transactions) {
  if (!transactions) return 0
  const today = ymdToday()
  return transactions
    .filter(
      (t) =>
        t.date === today &&
        t.type === "expense" &&
        t.note !== "auto-distribution from salary"
    )
    .reduce((s, t) => s + t.amount, 0)
}

// Build a slug → bucket map from /api/buckets response.
export function bucketsBySlug(bucketsResponse) {
  const out = {}
  for (const b of bucketsResponse?.buckets || []) {
    out[b.slug] = b
  }
  return out
}

// Derive "spent this month" for an account.
// - expense: bucket.expense
// - income:  bucket.income
// - savings: bucket.income + bucket.auto_dist_in
// - holding: bucket.income + bucket.auto_dist_in
export function spentForAccount(account, bucket) {
  if (!bucket) return 0
  if (account.type === "expense") return bucket.expense || 0
  if (account.type === "income") return bucket.income || 0
  return (bucket.income || 0) + (bucket.auto_dist_in || 0)
}

// Cumulative daily expense for the last `days` days, for sparklines.
// Filters transactions to a single category, sorts by date, accumulates.
export function buildSparkline(transactions, categorySlug, days = 12) {
  if (!transactions) return []
  const end = new Date()
  const start = new Date(end)
  start.setDate(end.getDate() - (days - 1))

  const byDay = new Array(days).fill(0)
  for (const t of transactions) {
    if (t.category !== categorySlug) continue
    if (t.type !== "expense") continue
    if (t.note === "auto-distribution from salary") continue
    const d = new Date(t.date)
    const idx = Math.floor((d - start) / 86_400_000)
    if (idx >= 0 && idx < days) byDay[idx] += t.amount
  }
  let acc = 0
  return byDay.map((v) => (acc += v))
}
