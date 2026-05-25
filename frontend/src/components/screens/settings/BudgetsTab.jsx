import { useEffect, useState } from "react"
import { patchAccount } from "../../../api"
import AccountTile from "../../ui/AccountTile"
import Toggle from "../../ui/Toggle"

function formatThousands(n) {
  return n.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ".")
}

function BudgetRow({ account, onChange }) {
  const [budget, setBudget] = useState(String(account.monthly_budget || 0))
  const [perDay, setPerDay] = useState(account.daily_budget_enabled === 1)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState(null)

  useEffect(() => {
    setBudget(String(account.monthly_budget || 0))
    setPerDay(account.daily_budget_enabled === 1)
  }, [account.monthly_budget, account.daily_budget_enabled])

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
    commit({ daily_budget_enabled: next })
  }

  const numeric = Number(budget.replace(/\D/g, "")) || 0
  const display = formatThousands(numeric)

  return (
    <div className={`flex items-center gap-2.5 p-3 bg-card border border-border rounded-[10px] ${saving ? "opacity-60" : ""}`}>
      <AccountTile id={account.slug} size={28} />
      <div className="flex-1 min-w-0">
        <div className="text-[13px] text-fg font-medium">{account.display_name}</div>
        <div className="text-[11px] text-fg-dim mt-0.5">
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
        className="w-[110px] bg-bg border border-border rounded-md py-1.5 px-2 text-fg text-[12.5px] text-right tabular-nums outline-none"
      />
      {account.type === "expense" && <Toggle on={perDay} onClick={togglePerDay} />}
    </div>
  )
}

export default function BudgetsTab({ accounts, onAccountChange }) {
  if (!accounts) return null
  const visible = accounts.filter((a) => a.type !== "income")
  return (
    <div className="flex flex-col gap-2">
      {visible.map((a) => (
        <BudgetRow key={a.slug} account={a} onChange={onAccountChange} />
      ))}
    </div>
  )
}
