import { useState, useMemo } from "react"
import { TOKENS } from "../../lib/tokens"
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
    <div
      style={{
        fontSize: 11,
        color: TOKENS.fgDim,
        textTransform: "uppercase",
        letterSpacing: "0.08em",
        fontWeight: 600,
        marginTop: 4,
      }}
    >
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
      <div
        style={{
          background: TOKENS.bg,
          color: TOKENS.fgMuted,
          minHeight: "100%",
          padding: 32,
          textAlign: "center",
          fontSize: 13,
        }}
      >
        Loading…
      </div>
    )
  }

  const expenseAccounts = accounts.filter((a) => a.type === "expense")
  const otherAccounts = accounts.filter(
    (a) => a.type !== "expense" && a.type !== "income"
  )

  // Today's day-of-month and total days, for the per-card ideal-pace tick.
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

  const spentToday = sumSpentToday(transactions)

  return (
    <div
      style={{
        background: TOKENS.bg,
        color: TOKENS.fg,
        minHeight: "100%",
        display: "flex",
        flexDirection: "column",
        position: "relative",
      }}
    >
      <MobileHeader
        periodLabel={periodLabel}
        onPeriodTap={onPeriodTap}
        onSettings={onSettings}
        onAdd={onAdd}
      />
      <div
        style={{
          padding: "16px 16px 90px",
          display: "flex",
          flexDirection: "column",
          gap: 16,
        }}
      >
        <HeroRing today={today} spentToday={spentToday} />
        <SummaryStrip summary={summary} />

        <SectionLabel>Accounts</SectionLabel>
        <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
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
          style={{
            background: "transparent",
            border: `1px solid ${TOKENS.border}`,
            borderRadius: 10,
            padding: "10px 14px",
            cursor: "pointer",
            color: TOKENS.fgMuted,
            fontSize: 13,
            fontWeight: 500,
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            fontFamily: "inherit",
          }}
        >
          <span>{chartsOpen ? "Hide" : "Show"} charts</span>
          {chartsOpen ? <Icon.ChevU size={16} /> : <Icon.ChevD size={16} />}
        </button>
        {chartsOpen && donut.length > 0 && (
          <Card padding={16}>
            <div
              style={{
                fontSize: 11.5,
                color: TOKENS.fgDim,
                textTransform: "uppercase",
                letterSpacing: "0.06em",
                fontWeight: 600,
                marginBottom: 12,
              }}
            >
              Spending by category
            </div>
            <div style={{ display: "flex", alignItems: "center", gap: 16 }}>
              <Donut data={donut} size={120} stroke={18} />
              <div
                style={{
                  flex: 1,
                  display: "flex",
                  flexDirection: "column",
                  gap: 6,
                }}
              >
                {donut.slice(0, 5).map((d) => (
                  <div
                    key={d.name}
                    style={{
                      display: "flex",
                      alignItems: "center",
                      gap: 6,
                      fontSize: 11.5,
                    }}
                  >
                    <span
                      style={{
                        width: 8,
                        height: 8,
                        borderRadius: 2,
                        background: d.color,
                      }}
                    />
                    <span style={{ flex: 1, color: TOKENS.fgMuted }}>
                      {d.name}
                    </span>
                    <span
                      style={{
                        color: TOKENS.fg,
                        fontVariantNumeric: "tabular-nums",
                      }}
                    >
                      {formatIDRShort(d.value)}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          </Card>
        )}

        <SectionLabel>Transactions</SectionLabel>
        <div
          style={{
            display: "flex",
            gap: 6,
            overflowX: "auto",
            paddingBottom: 4,
            marginLeft: -16,
            marginRight: -16,
            padding: "0 16px 4px",
          }}
        >
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
            <div
              style={{
                fontSize: 12,
                color: TOKENS.fgDim,
                padding: 24,
                textAlign: "center",
              }}
            >
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
        style={{
          position: "fixed",
          right: 18,
          bottom: 24,
          width: 52,
          height: 52,
          borderRadius: 26,
          border: "none",
          background: "var(--accent)",
          color: "white",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          boxShadow: "0 8px 20px var(--accent-glow)",
          cursor: "pointer",
          zIndex: 10,
        }}
      >
        <Icon.Plus size={22} />
      </button>
    </div>
  )
}
