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
      style={{
        padding: "18px 22px",
        borderLeft: divider ? `1px solid ${TOKENS.border}` : "none",
      }}
    >
      <div
        style={{
          fontSize: 11,
          color: TOKENS.fgDim,
          textTransform: "uppercase",
          letterSpacing: "0.06em",
          fontWeight: 500,
        }}
      >
        {label}
      </div>
      <div
        style={{
          fontSize: 22,
          fontWeight: 500,
          color,
          fontVariantNumeric: "tabular-nums",
          letterSpacing: "-0.02em",
          marginTop: 6,
        }}
      >
        {value}
      </div>
    </div>
  )
}

function SectionLabel({ children, right }) {
  return (
    <div
      style={{
        display: "flex",
        justifyContent: "space-between",
        alignItems: "baseline",
        marginBottom: 12,
      }}
    >
      <div
        style={{
          fontSize: 11,
          color: TOKENS.fgDim,
          textTransform: "uppercase",
          letterSpacing: "0.08em",
          fontWeight: 600,
        }}
      >
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
      <div
        style={{
          background: TOKENS.bg,
          color: TOKENS.fgMuted,
          minHeight: "100vh",
          padding: 64,
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

  const spentToday = sumSpentToday(transactions)

  const totalExpense = expenseAccounts.reduce(
    (s, a) => s + spentForAccount(a, bucketMap[a.slug]),
    0
  )
  const income = summary?.income || 0
  const net = income - totalExpense

  return (
    <div
      style={{
        background: TOKENS.bg,
        color: TOKENS.fg,
        minHeight: "100vh",
        fontFamily: "inherit",
      }}
    >
      {/* Top bar */}
      <div
        style={{
          height: 56,
          padding: "0 32px",
          borderBottom: `1px solid ${TOKENS.border}`,
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          background: TOKENS.bg,
          position: "sticky",
          top: 0,
          zIndex: 5,
        }}
      >
        <div style={{ display: "flex", alignItems: "center", gap: 24 }}>
          <div
            style={{
              fontSize: 14,
              fontWeight: 600,
              letterSpacing: "0.01em",
            }}
          >
            rupiah<span style={{ color: "var(--accent)" }}>.</span>
          </div>
        </div>
        <button
          onClick={onPeriodTap}
          style={{
            background: TOKENS.card,
            border: `1px solid ${TOKENS.border}`,
            color: TOKENS.fg,
            fontSize: 13,
            fontWeight: 500,
            padding: "8px 14px",
            borderRadius: 8,
            display: "flex",
            alignItems: "center",
            gap: 8,
            cursor: "pointer",
            fontFamily: "inherit",
          }}
        >
          <Icon.Calendar size={13} color={TOKENS.fgMuted} />
          <span>{periodLabel}</span>
          <Icon.ChevD size={14} color={TOKENS.fgMuted} />
        </button>
        <div style={{ display: "flex", gap: 8 }}>
          <button
            onClick={onAdd}
            style={{
              background: "var(--accent)",
              border: "none",
              color: "white",
              fontSize: 12.5,
              fontWeight: 500,
              padding: "7px 14px",
              borderRadius: 8,
              display: "flex",
              alignItems: "center",
              gap: 6,
              cursor: "pointer",
              fontFamily: "inherit",
            }}
          >
            <Icon.Plus size={14} /> Add transaction
          </button>
          <button
            onClick={onSettings}
            style={{
              width: 36,
              height: 36,
              borderRadius: 8,
              background: TOKENS.card,
              border: `1px solid ${TOKENS.border}`,
              cursor: "pointer",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
            }}
          >
            <Icon.Settings size={16} color={TOKENS.fgMuted} />
          </button>
        </div>
      </div>

      {/* Two-column body */}
      <div
        style={{
          display: "grid",
          gridTemplateColumns: "minmax(0, 1fr) 380px",
          minHeight: "calc(100vh - 56px)",
        }}
      >
        {/* Left */}
        <div
          style={{
            padding: "24px 32px 60px",
            display: "flex",
            flexDirection: "column",
            gap: 24,
            borderRight: `1px solid ${TOKENS.border}`,
          }}
        >
          <HeroRing today={today} spentToday={spentToday} />

          <div
            style={{
              display: "grid",
              gridTemplateColumns: "1fr 1fr 1fr",
              background: TOKENS.bgSoft,
              border: `1px solid ${TOKENS.border}`,
              borderRadius: 12,
              overflow: "hidden",
            }}
          >
            <DesktopStat
              label="Income"
              value={formatIDR(income)}
              color={TOKENS.income}
            />
            <DesktopStat
              label="Expense"
              value={formatIDR(totalExpense)}
              divider
            />
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
                <span
                  style={{
                    fontSize: 11.5,
                    color: TOKENS.fgDim,
                  }}
                >
                  {accounts.length} total
                </span>
              }
            >
              Accounts
            </SectionLabel>
            <div
              style={{
                display: "grid",
                gridTemplateColumns: "repeat(auto-fill, minmax(260px, 1fr))",
                gap: 12,
              }}
            >
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
                <div
                  style={{
                    display: "flex",
                    alignItems: "center",
                    gap: 24,
                  }}
                >
                  <Donut data={donut} size={160} stroke={22} />
                  <div
                    style={{
                      flex: 1,
                      display: "flex",
                      flexDirection: "column",
                      gap: 8,
                    }}
                  >
                    {donut.map((d) => (
                      <div
                        key={d.name}
                        style={{
                          display: "flex",
                          alignItems: "center",
                          gap: 8,
                          fontSize: 12.5,
                        }}
                      >
                        <span
                          style={{
                            width: 10,
                            height: 10,
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
            </div>
          )}
        </div>

        {/* Right: sticky transaction rail */}
        <div
          style={{
            position: "sticky",
            top: 56,
            alignSelf: "start",
            height: "calc(100vh - 56px)",
            display: "flex",
            flexDirection: "column",
            background: TOKENS.bgSoft,
          }}
        >
          <div
            style={{
              padding: "20px 24px 12px",
              borderBottom: `1px solid ${TOKENS.border}`,
            }}
          >
            <div
              style={{
                fontSize: 11,
                color: TOKENS.fgDim,
                textTransform: "uppercase",
                letterSpacing: "0.08em",
                fontWeight: 600,
                marginBottom: 12,
              }}
            >
              Transactions
            </div>
            <div
              style={{
                display: "flex",
                gap: 6,
                overflowX: "auto",
                paddingBottom: 4,
              }}
            >
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
          <div
            style={{
              flex: 1,
              overflowY: "auto",
              padding: "0 24px 24px",
            }}
          >
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
