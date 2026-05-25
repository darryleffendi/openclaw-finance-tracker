import { useEffect, useMemo, useState } from "react"
import { TOKENS, statusFor } from "../../lib/tokens"
import { formatIDR } from "../../lib/format"
import { Icon } from "../../lib/icons"
import { getTransactions } from "../../api"

import Card from "../ui/Card"
import AccountTile from "../ui/AccountTile"
import ProgressBar from "../ui/ProgressBar"
import TxRow from "../mobile/TxRow"
import { ICON_BTN_BASE } from "../mobile/MobileHeader"

function SectionLabel({ children }) {
  return (
    <div className="text-[11px] text-fg-dim uppercase tracking-[0.08em] font-semibold">
      {children}
    </div>
  )
}

export default function CategoryDetail({
  account,
  spent,
  dayOfMonth,
  daysInMonth,
  onBack,
  onTxTap,
}) {
  const [txs, setTxs] = useState(null)
  const [error, setError] = useState(null)

  useEffect(() => {
    let cancel = false
    getTransactions({ category: account.slug })
      .then((rows) => {
        if (!cancel) setTxs(rows)
      })
      .catch((e) => {
        if (!cancel) setError(e)
      })
    return () => {
      cancel = true
    }
  }, [account.slug])

  const visibleTxs = useMemo(
    () =>
      (txs || []).filter(
        (t) => t.note !== "auto-distribution from salary"
      ),
    [txs]
  )

  const breakdown = useMemo(() => {
    const sums = new Map()
    for (const t of visibleTxs) {
      if (t.type !== "expense") continue
      const key = t.subcategory || "Other"
      sums.set(key, (sums.get(key) || 0) + t.amount)
    }
    return [...sums.entries()]
      .map(([name, amount]) => ({ name, amount }))
      .sort((a, b) => b.amount - a.amount)
  }, [visibleTxs])

  const budget = account.monthly_budget || 0
  const remaining = budget - spent
  const over = remaining < 0
  const color = statusFor(remaining, Math.max(1, budget))
  const maxBreakdown = Math.max(1, ...breakdown.map((b) => b.amount))

  return (
    <div className="bg-bg text-fg min-h-full">
      <div className="h-[52px] px-4 flex items-center justify-between border-b border-border sticky top-0 bg-bg z-[5]">
        <button onClick={onBack} className={`${ICON_BTN_BASE} bg-transparent`}>
          <Icon.ChevL size={20} color="#e7eaf0" />
        </button>
        <div className="text-[14px] font-medium">{account.display_name}</div>
        <div className="w-8" />
      </div>

      <div className="px-4 pt-5 pb-[90px] flex flex-col gap-5">
        <Card padding={20}>
          <div className="flex items-center gap-3 mb-4">
            <AccountTile id={account.slug} size={44} />
            <div>
              <div className="text-[11px] text-fg-dim tracking-[0.06em] uppercase">
                {over ? "Over budget" : "Remaining"}
              </div>
              <div
                className="text-[26px] font-medium tracking-[-0.02em] tabular-nums mt-0.5"
                style={{ color: over ? TOKENS.red : TOKENS.fg }}
              >
                {formatIDR(Math.abs(remaining))}
              </div>
            </div>
          </div>
          <div className="text-[12px] text-fg-muted mb-2">
            Spent {formatIDR(spent)} of {formatIDR(budget)}
          </div>
          <ProgressBar
            spent={spent}
            budget={budget}
            height={8}
            dayOfMonth={dayOfMonth}
            daysInMonth={daysInMonth}
          />
        </Card>

        {breakdown.length > 0 && (
          <div>
            <SectionLabel>Subcategories</SectionLabel>
            <div className="flex flex-col gap-2.5 mt-3">
              {breakdown.map((b) => (
                <div key={b.name}>
                  <div className="flex justify-between mb-1">
                    <span className="text-[12.5px] text-fg capitalize">{b.name}</span>
                    <span className="text-[12.5px] text-fg-muted tabular-nums">
                      {formatIDR(b.amount)}
                    </span>
                  </div>
                  <div className="h-1 bg-border rounded-[2px] overflow-hidden">
                    <div
                      className="h-full rounded-[2px]"
                      style={{
                        width: `${(b.amount / maxBreakdown) * 100}%`,
                        background: color,
                      }}
                    />
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        <div>
          <SectionLabel>Transactions</SectionLabel>
          <div className="mt-2">
            {error && (
              <div className="text-[12px] text-red p-3">
                Failed to load transactions.
              </div>
            )}
            {txs == null && !error ? (
              <div className="text-[12px] text-fg-dim p-4 text-center">Loading…</div>
            ) : visibleTxs.length === 0 ? (
              <div className="text-[12px] text-fg-dim p-4 text-center">No transactions yet</div>
            ) : (
              visibleTxs.map((t) => (
                <TxRow
                  key={t.id}
                  tx={t}
                  onTap={onTxTap ? () => onTxTap(t) : undefined}
                />
              ))
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
