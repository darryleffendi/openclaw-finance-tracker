import { useEffect, useState } from "react"
import { TOKENS } from "../../../lib/tokens"
import { Icon } from "../../../lib/icons"
import { formatIDR } from "../../../lib/format"
import {
  getRecurring,
  patchRecurring,
  deleteRecurring,
  createRecurring,
  runRecurring,
} from "../../../api"
import AccountTile from "../../ui/AccountTile"
import Toggle from "../../ui/Toggle"

function RuleRow({ rule, onChange, onDelete }) {
  const [busy, setBusy] = useState(false)
  const toggle = async () => {
    setBusy(true)
    try {
      const updated = await patchRecurring(rule.id, {
        enabled: rule.enabled ? 0 : 1,
      })
      onChange?.(updated)
    } finally {
      setBusy(false)
    }
  }
  const remove = async () => {
    if (!confirm(`Delete recurring rule "${rule.name}"?`)) return
    setBusy(true)
    try {
      await deleteRecurring(rule.id)
      onDelete?.(rule.id)
    } finally {
      setBusy(false)
    }
  }
  return (
    <div
      style={{
        display: "flex",
        alignItems: "center",
        gap: 10,
        padding: 12,
        background: TOKENS.card,
        border: `1px solid ${TOKENS.border}`,
        borderRadius: 10,
        opacity: busy ? 0.6 : 1,
      }}
    >
      <AccountTile id={rule.category} size={28} />
      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{ fontSize: 13, color: TOKENS.fg, fontWeight: 500 }}>
          {rule.name}
        </div>
        <div style={{ fontSize: 11, color: TOKENS.fgDim, marginTop: 2 }}>
          Day {rule.day_of_month} · {rule.type === "income" ? "Income" : "Expense"}
        </div>
      </div>
      <span
        style={{
          fontSize: 13,
          color: TOKENS.fg,
          fontVariantNumeric: "tabular-nums",
        }}
      >
        {formatIDR(rule.amount)}
      </span>
      <Toggle on={rule.enabled === 1} onClick={toggle} />
      <button
        onClick={remove}
        disabled={busy}
        style={{
          background: "transparent",
          border: "none",
          padding: 4,
          cursor: busy ? "default" : "pointer",
          display: "inline-flex",
        }}
      >
        <Icon.Trash size={14} color={TOKENS.fgDim} />
      </button>
    </div>
  )
}

function NewRuleForm({ accounts, onCreated, onCancel }) {
  const [name, setName] = useState("")
  const [amount, setAmount] = useState("")
  const [type, setType] = useState("expense")
  const [category, setCategory] = useState(
    accounts?.find((a) => a.type === "expense")?.slug || ""
  )
  const [day, setDay] = useState("1")
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState(null)

  const opts =
    accounts?.filter((a) =>
      type === "income" ? a.type === "income" : a.type === "expense"
    ) || []
  const dayNum = Math.min(31, Math.max(1, Number(day) || 1))
  const amtNum = Number(amount.replace(/\D/g, "")) || 0
  const valid = name.trim() && amtNum > 0 && category && dayNum >= 1 && dayNum <= 31

  const submit = async () => {
    if (!valid || busy) return
    setBusy(true)
    setError(null)
    try {
      const created = await createRecurring({
        name: name.trim(),
        amount: amtNum,
        type,
        category,
        day_of_month: dayNum,
        enabled: 1,
      })
      onCreated?.(created)
    } catch (e) {
      setError(e.message || "Create failed")
      setBusy(false)
    }
  }

  const field = {
    background: TOKENS.bg,
    border: `1px solid ${TOKENS.border}`,
    borderRadius: 6,
    padding: "8px 10px",
    color: TOKENS.fg,
    fontSize: 13,
    outline: "none",
    fontFamily: "inherit",
  }

  return (
    <div
      style={{
        padding: 12,
        background: TOKENS.card,
        border: `1px solid ${TOKENS.border}`,
        borderRadius: 10,
        display: "flex",
        flexDirection: "column",
        gap: 8,
      }}
    >
      <input
        placeholder="Name (e.g. Rent)"
        value={name}
        onChange={(e) => setName(e.target.value)}
        style={field}
      />
      <div style={{ display: "flex", gap: 8 }}>
        <input
          placeholder="Amount"
          inputMode="numeric"
          value={amount.replace(/\B(?=(\d{3})+(?!\d))/g, ".")}
          onChange={(e) => setAmount(e.target.value.replace(/\D/g, ""))}
          style={{ ...field, flex: 1 }}
        />
        <input
          type="number"
          min={1}
          max={31}
          value={day}
          onChange={(e) => setDay(e.target.value)}
          style={{ ...field, width: 80 }}
        />
      </div>
      <div style={{ display: "flex", gap: 8 }}>
        <select
          value={type}
          onChange={(e) => {
            setType(e.target.value)
            const first = accounts?.find((a) =>
              e.target.value === "income" ? a.type === "income" : a.type === "expense"
            )
            if (first) setCategory(first.slug)
          }}
          style={{ ...field, flex: 1 }}
        >
          <option value="expense">Expense</option>
          <option value="income">Income</option>
        </select>
        <select
          value={category}
          onChange={(e) => setCategory(e.target.value)}
          style={{ ...field, flex: 2 }}
        >
          {opts.map((a) => (
            <option key={a.slug} value={a.slug}>
              {a.display_name}
            </option>
          ))}
        </select>
      </div>
      {error && (
        <div style={{ fontSize: 11, color: TOKENS.red }}>{error}</div>
      )}
      <div style={{ display: "flex", gap: 8, justifyContent: "flex-end" }}>
        <button
          onClick={onCancel}
          style={{
            background: "transparent",
            border: `1px solid ${TOKENS.border}`,
            color: TOKENS.fgMuted,
            borderRadius: 8,
            padding: "6px 14px",
            fontSize: 12.5,
            cursor: "pointer",
            fontFamily: "inherit",
          }}
        >
          Cancel
        </button>
        <button
          onClick={submit}
          disabled={!valid || busy}
          style={{
            background: !valid || busy ? TOKENS.borderHi : "var(--accent)",
            color: "white",
            border: "none",
            borderRadius: 8,
            padding: "6px 14px",
            fontSize: 12.5,
            cursor: !valid || busy ? "not-allowed" : "pointer",
            fontFamily: "inherit",
            fontWeight: 500,
          }}
        >
          {busy ? "Creating…" : "Create"}
        </button>
      </div>
    </div>
  )
}

export default function RecurringTab({ accounts }) {
  const [rules, setRules] = useState(null)
  const [error, setError] = useState(null)
  const [running, setRunning] = useState(false)
  const [adding, setAdding] = useState(false)

  const load = () => {
    getRecurring()
      .then(setRules)
      .catch((e) => setError(e.message || "Failed to load"))
  }
  useEffect(load, [])

  const runNow = async () => {
    setRunning(true)
    try {
      await runRecurring()
      load()
    } finally {
      setRunning(false)
    }
  }

  if (rules == null) {
    return (
      <div style={{ fontSize: 12, color: TOKENS.fgDim, padding: 12 }}>
        Loading rules…
      </div>
    )
  }

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
      <div
        style={{
          padding: "10px 12px",
          background: TOKENS.card,
          border: `1px solid ${TOKENS.border}`,
          borderRadius: 10,
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          gap: 12,
        }}
      >
        <div
          style={{ fontSize: 12, color: TOKENS.fgMuted, lineHeight: 1.4 }}
        >
          Apply due rules now (idempotent for this month).
        </div>
        <button
          onClick={runNow}
          disabled={running}
          style={{
            background: "var(--accent-soft)",
            color: "var(--accent)",
            border: "none",
            borderRadius: 8,
            padding: "6px 12px",
            fontSize: 12,
            fontWeight: 500,
            cursor: running ? "not-allowed" : "pointer",
            fontFamily: "inherit",
            opacity: running ? 0.6 : 1,
          }}
        >
          {running ? "Running…" : "Run now"}
        </button>
      </div>

      {error && (
        <div style={{ fontSize: 12, color: TOKENS.red, padding: 8 }}>
          {error}
        </div>
      )}

      {rules.map((r) => (
        <RuleRow
          key={r.id}
          rule={r}
          onChange={(updated) =>
            setRules((rs) => rs.map((x) => (x.id === updated.id ? updated : x)))
          }
          onDelete={(id) => setRules((rs) => rs.filter((x) => x.id !== id))}
        />
      ))}

      {adding ? (
        <NewRuleForm
          accounts={accounts}
          onCancel={() => setAdding(false)}
          onCreated={(rule) => {
            setRules((rs) => [...(rs || []), rule])
            setAdding(false)
          }}
        />
      ) : (
        <button
          onClick={() => setAdding(true)}
          style={{
            background: "transparent",
            border: `1px dashed ${TOKENS.border}`,
            borderRadius: 10,
            padding: 12,
            color: TOKENS.fgMuted,
            fontSize: 13,
            cursor: "pointer",
            fontFamily: "inherit",
          }}
        >
          + New rule
        </button>
      )}
    </div>
  )
}
