import { useState, useMemo } from "react"
import { Icon } from "../../lib/icons"
import { formatIDRShort } from "../../lib/format"
import {
  bucketsBySlug,
  buildSparkline,
  spentForAccount,
  sumSpentToday,
} from "../../lib/dashboardData"

import Card from "../ui/Card"
import Chip from "../ui/Chip"
import Donut from "../ui/Donut"

import MobileHeader from "./MobileHeader"
import HeroRing from "./HeroRing"
import SummaryStrip from "./SummaryStrip"
import AccountCard from "./AccountCard"
import TxRow from "./TxRow"

const DONUT_COLORS = [
  "#818cf8",
  "#34d399",
  "#fbbf24",
  "#fb923c",
  "#f87171",
  "#22d3ee",
]

function SectionLabel({ children }) {
  return (
    <div className="text-[11px] text-fg-dim uppercase tracking-[0.08em] font-semibold mt-1">
      {children}
    </div>
  )
}

export default function MobileDashboard({
  data,
  periodLabel,
  onPeriodTap,
  onSettings,
  onAdd,
  onAccountTap,
  onTxTap,
}) {
  const { accounts, buckets, today, summary, transactions } = data
  const [chartsOpen, setChartsOpen] = useState(false)
  const [filter, setFilter] = useState("all")

  const bucketMap = useMemo(() => bucketsBySlug(buckets), [buckets])

  if (!accounts) {
    return (
      <div className="bg-bg text-fg-muted min-h-full p-8 text-center text-[13px]">
        Loading…
      </div>
    )
  }

  const expenseAccounts = accounts.filter((a) => a.type === "expense")
  const otherAccounts = accounts.filter(
    (a) => a.type !== "expense" && a.type !== "income"
  )

  const ymd = today?.date || ""
  const [, , dStr] = ymd.split("-")
  const day = Number(dStr)
  const totalDays = day + (today?.days_remaining ?? 1) - 1

  const visibleTxs = (transactions || []).filter(
    (t) => t.note !== "auto-distribution from salary"
  )
  const filteredTxs =
    filter === "all" ? visibleTxs : visibleTxs.filter((t) => t.category === filter)

  const filters = ["all", ...expenseAccounts.slice(0, 5).map((a) => a.slug)]

  const donut = expenseAccounts
    .map((a, i) => ({
      name: a.display_name,
      value: spentForAccount(a, bucketMap[a.slug]),
      color: DONUT_COLORS[i % DONUT_COLORS.length],
    }))
    .filter((d) => d.value > 0)

  const spentToday = sumSpentToday(transactions, accounts)

  return (
    <div className="bg-bg text-fg min-h-full flex flex-col relative">
      <MobileHeader
        periodLabel={periodLabel}
        onPeriodTap={onPeriodTap}
        onSettings={onSettings}
        onAdd={onAdd}
      />
      <div className="px-4 pt-4 pb-[90px] flex flex-col gap-4">
        <HeroRing today={today} spentToday={spentToday} />
        <SummaryStrip summary={summary} />

        <SectionLabel>Accounts</SectionLabel>
        <div className="flex flex-col gap-2.5">
          {expenseAccounts.map((a) => {
            const spent = spentForAccount(a, bucketMap[a.slug])
            const sparkValues = buildSparkline(transactions, a.slug)
            return (
              <AccountCard
                key={a.slug}
                account={a}
                spent={spent}
                sparkValues={sparkValues}
                dayOfMonth={day}
                daysInMonth={totalDays}
                onTap={() => onAccountTap && onAccountTap(a.slug)}
              />
            )
          })}
          {otherAccounts.map((a) => {
            const spent = spentForAccount(a, bucketMap[a.slug])
            return (
              <AccountCard
                key={a.slug}
                account={a}
                spent={spent}
                dayOfMonth={day}
                daysInMonth={totalDays}
              />
            )
          })}
        </div>

        <button
          onClick={() => setChartsOpen(!chartsOpen)}
          className="bg-transparent border border-border rounded-[10px] py-2.5 px-3.5 cursor-pointer text-fg-muted text-[13px] font-medium flex items-center justify-between"
        >
          <span>{chartsOpen ? "Hide" : "Show"} charts</span>
          {chartsOpen ? <Icon.ChevU size={16} /> : <Icon.ChevD size={16} />}
        </button>
        {chartsOpen && donut.length > 0 && (
          <Card padding={16}>
            <div className="text-[11.5px] text-fg-dim uppercase tracking-[0.06em] font-semibold mb-3">
              Spending by category
            </div>
            <div className="flex items-center gap-4">
              <Donut data={donut} size={120} stroke={18} />
              <div className="flex-1 flex flex-col gap-1.5">
                {donut.slice(0, 5).map((d) => (
                  <div key={d.name} className="flex items-center gap-1.5 text-[11.5px]">
                    <span
                      className="w-2 h-2 rounded-[2px] shrink-0"
                      style={{ background: d.color }}
                    />
                    <span className="flex-1 text-fg-muted">{d.name}</span>
                    <span className="text-fg tabular-nums">{formatIDRShort(d.value)}</span>
                  </div>
                ))}
              </div>
            </div>
          </Card>
        )}

        <SectionLabel>Transactions</SectionLabel>
        <div className="flex gap-1.5 overflow-x-auto pb-1 -mx-4 px-4">
          {filters.map((f) => (
            <Chip key={f} active={filter === f} onClick={() => setFilter(f)}>
              {f === "all"
                ? "All"
                : accounts.find((a) => a.slug === f)?.display_name || f}
            </Chip>
          ))}
        </div>
        <div>
          {filteredTxs.length === 0 ? (
            <div className="text-[12px] text-fg-dim p-6 text-center">
              No transactions in this period.
            </div>
          ) : (
            filteredTxs.map((t) => (
              <TxRow key={t.id} tx={t} onTap={onTxTap ? () => onTxTap(t) : undefined} />
            ))
          )}
        </div>
      </div>

      <button
        onClick={onAdd}
        className="fixed right-[18px] bottom-6 w-[52px] h-[52px] rounded-[26px] border-0 bg-accent text-white flex items-center justify-center shadow-[0_8px_20px_var(--accent-glow)] cursor-pointer z-10"
      >
        <Icon.Plus size={22} />
      </button>
    </div>
  )
}
