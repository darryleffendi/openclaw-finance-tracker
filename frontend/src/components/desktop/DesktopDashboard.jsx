import { useMemo, useState } from "react"
import { TOKENS } from "../../lib/tokens"
import { Icon } from "../../lib/icons"
import { formatIDR, formatIDRShort } from "../../lib/format"
import {
  bucketsBySlug,
  buildSparkline,
  spentForAccount,
  sumSpentToday,
} from "../../lib/dashboardData"

import Card from "../ui/Card"
import Chip from "../ui/Chip"
import Donut from "../ui/Donut"
import HeroRing from "../mobile/HeroRing"
import AccountCard from "../mobile/AccountCard"
import TxRow from "../mobile/TxRow"

const DONUT_COLORS = [
  "#818cf8",
  "#34d399",
  "#fbbf24",
  "#fb923c",
  "#f87171",
  "#22d3ee",
]

function DesktopStat({ label, value, color = TOKENS.fg, divider }) {
  return (
    <div
      className="py-[18px] px-[22px]"
      style={divider ? { borderLeft: `1px solid ${TOKENS.border}` } : undefined}
    >
      <div className="text-[11px] text-fg-dim uppercase tracking-[0.06em] font-medium">
        {label}
      </div>
      <div
        className="text-[22px] font-medium tabular-nums tracking-[-0.02em] mt-1.5"
        style={{ color }}
      >
        {value}
      </div>
    </div>
  )
}

function SectionLabel({ children, right }) {
  return (
    <div className="flex justify-between items-baseline mb-3">
      <div className="text-[11px] text-fg-dim uppercase tracking-[0.08em] font-semibold">
        {children}
      </div>
      {right}
    </div>
  )
}

export default function DesktopDashboard({
  data,
  periodLabel,
  onPeriodTap,
  onSettings,
  onAdd,
  onAccountTap,
  onTxTap,
}) {
  const { accounts, buckets, today, summary, transactions } = data
  const [filter, setFilter] = useState("all")

  const bucketMap = useMemo(() => bucketsBySlug(buckets), [buckets])

  if (!accounts) {
    return (
      <div className="bg-bg text-fg-muted min-h-screen p-16 text-center text-[13px]">
        Loading…
      </div>
    )
  }

  const expenseAccounts = accounts.filter((a) => a.type === "expense")
  const otherAccounts = accounts.filter(
    (a) => a.type !== "expense" && a.type !== "income"
  )

  const ymd = today?.date || ""
  const day = Number(ymd.split("-")[2]) || 1
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

  const totalExpense = expenseAccounts.reduce(
    (s, a) => s + spentForAccount(a, bucketMap[a.slug]),
    0
  )
  const income = summary?.income || 0
  const net = income - totalExpense

  return (
    <div className="bg-bg text-fg min-h-screen">
      {/* Top bar */}
      <div className="h-14 px-8 border-b border-border flex items-center justify-between bg-bg sticky top-0 z-[5]">
        <div className="flex items-center gap-6">
          <div className="text-[14px] font-semibold tracking-[0.01em]">
            rupiah<span className="text-accent">.</span>
          </div>
        </div>
        <button
          onClick={onPeriodTap}
          className="bg-card border border-border text-fg text-[13px] font-medium py-2 px-3.5 rounded-lg flex items-center gap-2 cursor-pointer"
        >
          <Icon.Calendar size={13} color="#8e95a4" />
          <span>{periodLabel}</span>
          <Icon.ChevD size={14} color="#8e95a4" />
        </button>
        <div className="flex gap-2">
          <button
            onClick={onAdd}
            className="bg-accent border-0 text-white text-[12.5px] font-medium py-[7px] px-3.5 rounded-lg flex items-center gap-1.5 cursor-pointer"
          >
            <Icon.Plus size={14} /> Add transaction
          </button>
          <button
            onClick={onSettings}
            className="w-9 h-9 rounded-lg bg-card border border-border cursor-pointer flex items-center justify-center"
          >
            <Icon.Settings size={16} color="#8e95a4" />
          </button>
        </div>
      </div>

      {/* Two-column body */}
      <div className="grid min-h-[calc(100vh-56px)]" style={{ gridTemplateColumns: "minmax(0,1fr) 380px" }}>
        {/* Left */}
        <div className="px-8 pt-6 pb-[60px] flex flex-col gap-6 border-r border-border">
          <HeroRing today={today} spentToday={spentToday} />

          <div className="grid grid-cols-3 bg-bg-soft border border-border rounded-xl overflow-hidden">
            <DesktopStat label="Income" value={formatIDR(income)} color={TOKENS.income} />
            <DesktopStat label="Expense" value={formatIDR(totalExpense)} divider />
            <DesktopStat
              label="Net"
              value={formatIDR(net)}
              color={net >= 0 ? TOKENS.income : TOKENS.red}
              divider
            />
          </div>

          <div>
            <SectionLabel
              right={
                <span className="text-[11.5px] text-fg-dim">{accounts.length} total</span>
              }
            >
              Accounts
            </SectionLabel>
            <div className="grid gap-3" style={{ gridTemplateColumns: "repeat(auto-fill,minmax(260px,1fr))" }}>
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
          </div>

          {donut.length > 0 && (
            <div>
              <SectionLabel>Spending breakdown</SectionLabel>
              <Card padding={20}>
                <div className="flex items-center gap-6">
                  <Donut data={donut} size={160} stroke={22} />
                  <div className="flex-1 flex flex-col gap-2">
                    {donut.map((d) => (
                      <div key={d.name} className="flex items-center gap-2 text-[12.5px]">
                        <span
                          className="w-2.5 h-2.5 rounded-[2px] shrink-0"
                          style={{ background: d.color }}
                        />
                        <span className="flex-1 text-fg-muted">{d.name}</span>
                        <span className="text-fg tabular-nums">{formatIDRShort(d.value)}</span>
                      </div>
                    ))}
                  </div>
                </div>
              </Card>
            </div>
          )}
        </div>

        {/* Right: sticky transaction rail */}
        <div className="sticky top-14 self-start bg-bg-soft flex flex-col" style={{ height: "calc(100vh - 56px)" }}>
          <div className="px-6 pt-5 pb-3 border-b border-border">
            <div className="text-[11px] text-fg-dim uppercase tracking-[0.08em] font-semibold mb-3">
              Transactions
            </div>
            <div className="flex gap-1.5 overflow-x-auto pb-1">
              {filters.map((f) => (
                <Chip
                  key={f}
                  active={filter === f}
                  onClick={() => setFilter(f)}
                >
                  {f === "all"
                    ? "All"
                    : accounts.find((a) => a.slug === f)?.display_name || f}
                </Chip>
              ))}
            </div>
          </div>
          <div className="flex-1 overflow-y-auto px-6 pb-6">
            {filteredTxs.length === 0 ? (
              <div className="text-[12px] text-fg-dim p-6 text-center">
                No transactions in this period.
              </div>
            ) : (
              filteredTxs.map((t) => (
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
