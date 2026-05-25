import { useEffect, useState } from "react"
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

const FIELD_CLS = "bg-bg border border-border rounded-md py-2 px-2.5 text-fg text-[13px] outline-none"

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
    <div className={`flex items-center gap-2.5 p-3 bg-card border border-border rounded-[10px] ${busy ? "opacity-60" : ""}`}>
      <AccountTile id={rule.category} size={28} />
      <div className="flex-1 min-w-0">
        <div className="text-[13px] text-fg font-medium">{rule.name}</div>
        <div className="text-[11px] text-fg-dim mt-0.5">
          Day {rule.day_of_month} · {rule.type === "income" ? "Income" : "Expense"}
        </div>
      </div>
      <span className="text-[13px] text-fg tabular-nums">{formatIDR(rule.amount)}</span>
      <Toggle on={rule.enabled === 1} onClick={toggle} />
      <button
        onClick={remove}
        disabled={busy}
        className={`bg-transparent border-0 p-1 inline-flex ${busy ? "cursor-default" : "cursor-pointer"}`}
      >
        <Icon.Trash size={14} color="#5a6071" />
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

  return (
    <div className="p-3 bg-card border border-border rounded-[10px] flex flex-col gap-2">
      <input
        placeholder="Name (e.g. Rent)"
        value={name}
        onChange={(e) => setName(e.target.value)}
        className={`${FIELD_CLS} w-full`}
      />
      <div className="flex gap-2">
        <input
          placeholder="Amount"
          inputMode="numeric"
          value={amount.replace(/\B(?=(\d{3})+(?!\d))/g, ".")}
          onChange={(e) => setAmount(e.target.value.replace(/\D/g, ""))}
          className={`${FIELD_CLS} flex-1`}
        />
        <input
          type="number"
          min={1}
          max={31}
          value={day}
          onChange={(e) => setDay(e.target.value)}
          className={`${FIELD_CLS} w-[80px]`}
        />
      </div>
      <div className="flex gap-2">
        <select
          value={type}
          onChange={(e) => {
            setType(e.target.value)
            const first = accounts?.find((a) =>
              e.target.value === "income" ? a.type === "income" : a.type === "expense"
            )
            if (first) setCategory(first.slug)
          }}
          className={`${FIELD_CLS} flex-1`}
        >
          <option value="expense">Expense</option>
          <option value="income">Income</option>
        </select>
        <select
          value={category}
          onChange={(e) => setCategory(e.target.value)}
          className={`${FIELD_CLS} flex-[2]`}
        >
          {opts.map((a) => (
            <option key={a.slug} value={a.slug}>
              {a.display_name}
            </option>
          ))}
        </select>
      </div>
      {error && <div className="text-[11px] text-red">{error}</div>}
      <div className="flex gap-2 justify-end">
        <button
          onClick={onCancel}
          className="bg-transparent border border-border text-fg-muted rounded-lg py-1.5 px-3.5 text-[12.5px] cursor-pointer"
        >
          Cancel
        </button>
        <button
          onClick={submit}
          disabled={!valid || busy}
          className={`border-0 rounded-lg py-1.5 px-3.5 text-[12.5px] font-medium text-white ${!valid || busy ? "bg-border-hi cursor-not-allowed" : "bg-accent cursor-pointer"}`}
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
    return <div className="text-[12px] text-fg-dim p-3">Loading rules…</div>
  }

  return (
    <div className="flex flex-col gap-3">
      <div className="py-2.5 px-3 bg-card border border-border rounded-[10px] flex items-center justify-between gap-3">
        <div className="text-[12px] text-fg-muted leading-[1.4]">
          Apply due rules now (idempotent for this month).
        </div>
        <button
          onClick={runNow}
          disabled={running}
          className={`bg-accent-soft text-accent border-0 rounded-lg py-1.5 px-3 text-[12px] font-medium ${running ? "cursor-not-allowed opacity-60" : "cursor-pointer"}`}
        >
          {running ? "Running…" : "Run now"}
        </button>
      </div>

      {error && (
        <div className="text-[12px] text-red p-2">{error}</div>
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
          className="bg-transparent border border-dashed border-border rounded-[10px] p-3 text-fg-muted text-[13px] cursor-pointer w-full"
        >
          + New rule
        </button>
      )}
    </div>
  )
}
