// Typed wrappers for the Flask backend (see docs/api-spec.md).
// All calls go through apiFetch which redirects to /api/auth/login on 401.

const BASE = "/api"

export class UnauthorizedError extends Error {
  constructor() {
    super("Unauthorized")
    this.name = "UnauthorizedError"
  }
}

export async function apiFetch(url, options = {}) {
  const res = await fetch(url, { credentials: "include", ...options })
  if (res.status === 401) {
    throw new UnauthorizedError()
  }
  return res
}

async function getJson(path) {
  const r = await apiFetch(`${BASE}${path}`)
  if (!r.ok) throw new Error(`GET ${path} → ${r.status}`)
  return r.json()
}

async function sendJson(method, path, body) {
  const r = await apiFetch(`${BASE}${path}`, {
    method,
    headers: { "Content-Type": "application/json" },
    body: body == null ? undefined : JSON.stringify(body),
  })
  if (!r.ok) {
    const err = await r.json().catch(() => ({ error: r.statusText }))
    throw new Error(err.error || `${method} ${path} → ${r.status}`)
  }
  return r.json()
}

// ── Accounts ───────────────────────────────────────────────────────
export const getAccounts = () => getJson("/accounts")
export const patchAccount = (slug, patch) =>
  sendJson("PATCH", `/accounts/${slug}`, patch)

// ── Buckets ────────────────────────────────────────────────────────
export const getBuckets = (month) =>
  getJson(`/buckets${month ? `?month=${month}` : ""}`)

// ── Today's allowance ──────────────────────────────────────────────
export const getToday = () => getJson("/today")

// ── Summary ────────────────────────────────────────────────────────
export const getSummary = (period = "this-month") =>
  getJson(`/summary?period=${period}`)

// ── Transactions ───────────────────────────────────────────────────
export function getTransactions({ period, category } = {}) {
  const qs = new URLSearchParams()
  if (category) qs.set("category", category)
  else if (period) qs.set("period", period)
  return getJson(`/transactions${qs.toString() ? `?${qs}` : ""}`)
}

export const createTransaction = (tx) => sendJson("POST", "/transactions", tx)
export const patchTransaction = (id, patch) =>
  sendJson("PATCH", `/transactions/${id}`, patch)
export const deleteTransaction = (id) =>
  sendJson("DELETE", `/transactions/${id}`)

// ── Recurring ──────────────────────────────────────────────────────
export const getRecurring = () => getJson("/recurring")
export const createRecurring = (rule) => sendJson("POST", "/recurring", rule)
export const patchRecurring = (id, patch) =>
  sendJson("PATCH", `/recurring/${id}`, patch)
export const deleteRecurring = (id) => sendJson("DELETE", `/recurring/${id}`)
export const runRecurring = () => sendJson("POST", "/recurring/run")

// ── Distribute ─────────────────────────────────────────────────────
export const distribute = (body) => sendJson("POST", "/distribute", body)
