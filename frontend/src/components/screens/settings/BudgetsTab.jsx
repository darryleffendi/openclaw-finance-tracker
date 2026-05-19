import { useEffect, useState } from "react"
import { TOKENS } from "../../../lib/tokens"
import { patchAccount } from "../../../api"
import AccountTile from "../../ui/AccountTile"
import Toggle from "../../ui/Toggle"

function formatThousands(n) {
  return n.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ".")
}

function BudgetRow({ account, onChange }) {
  const [budget, setBudget] = useState(String(account.monthly_budget || 0))
  const [perDay, setPerDay] = useState(account.per_day_budget === 1)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState(null)

  useEffect(() => {
    setBudget(String(account.monthly_budget || 0))
    setPerDay(account.per_day_budget === 1)
  }, [account.monthly_budget, account.per_day_budget])

  const commit = async (patch) => {
    setSaving(true)
    setError(null)
    try {
      const updated = await patchAccount(account.slug, patch)
      onChange?.(updated)
    } catch (e) {
      setError(e.message || "Save failed")
    } finally {
      setSaving(false)
    }
  }

  const commitBudget = () => {
    const next = Number(budget.replace(/\D/g, ""))
    if (Number.isFinite(next) && next !== account.monthly_budget) {
      commit({ monthly_budget: next })
    }
  }

  const togglePerDay = () => {
    const next = perDay ? 0 : 1
    setPerDay(!perDay)
    commit({ per_day_budget: next })
  }

  const numeric = Number(budget.replace(/\D/g, "")) || 0
  const display = formatThousands(numeric)

  return (
    <div
      style={{
        display: "flex",
        alignItems: "center",
        gap: 10,
        padding: "12px 12px",
        background: TOKENS.card,
        border: `1px solid ${TOKENS.border}`,
        borderRadius: 10,
        opacity: saving ? 0.6 : 1,
      }}
    >
      <AccountTile id={account.slug} size={28} />
      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{ fontSize: 13, color: TOKENS.fg, fontWeight: 500 }}>
          {account.display_name}
        </div>
        <div style={{ fontSize: 11, color: TOKENS.fgDim, marginTop: 2 }}>
          {error
            ? error
            : account.type === "expense"
              ? perDay
                ? "Per-day budget on"
                : "Monthly only"
              : account.type}
        </div>
      </div>
      <input
        value={display}
        onChange={(e) => setBudget(e.target.value.replace(/\D/g, ""))}
        onBlur={commitBudget}
        onKeyDown={(e) => e.key === "Enter" && e.currentTarget.blur()}
        style={{
          width: 110,
          background: TOKENS.bg,
          border: `1px solid ${TOKENS.border}`,
          borderRadius: 6,
          padding: "6px 8px",
          color: TOKENS.fg,
          fontSize: 12.5,
          textAlign: "right",
          fontVariantNumeric: "tabular-nums",
          outline: "none",
          fontFamily: "inherit",
        }}
      />
      {account.type === "expense" && <Toggle on={perDay} onClick={togglePerDay} />}
    </div>
  )
}

export default function BudgetsTab({ accounts, onAccountChange }) {
  if (!accounts) return null
  const visible = accounts.filter((a) => a.type !== "income")
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
      {visible.map((a) => (
        <BudgetRow key={a.slug} account={a} onChange={onAccountChange} />
      ))}
    </div>
  )
}
