import { useEffect, useMemo, useState } from "react"
import { TOKENS, statusFor } from "../../lib/tokens"
import { formatIDR } from "../../lib/format"
import { Icon } from "../../lib/icons"
import { getTransactions } from "../../api"

import Card from "../ui/Card"
import AccountTile from "../ui/AccountTile"
import ProgressBar from "../ui/ProgressBar"
import TxRow from "../mobile/TxRow"
import { iconBtnStyle } from "../mobile/MobileHeader"

function SectionLabel({ children }) {
  return (
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
    <div style={{ background: TOKENS.bg, color: TOKENS.fg, minHeight: "100%" }}>
      <div
        style={{
          height: 52,
          padding: "0 16px",
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          borderBottom: `1px solid ${TOKENS.border}`,
          position: "sticky",
          top: 0,
          background: TOKENS.bg,
          zIndex: 5,
        }}
      >
        <button onClick={onBack} style={iconBtnStyle()}>
          <Icon.ChevL size={20} color={TOKENS.fg} />
        </button>
        <div style={{ fontSize: 14, fontWeight: 500 }}>
          {account.display_name}
        </div>
        <div style={{ width: 32 }} />
      </div>

      <div
        style={{
          padding: "20px 16px 90px",
          display: "flex",
          flexDirection: "column",
          gap: 20,
        }}
      >
        <Card padding={20}>
          <div
            style={{
              display: "flex",
              alignItems: "center",
              gap: 12,
              marginBottom: 16,
            }}
          >
            <AccountTile id={account.slug} size={44} />
            <div>
              <div
                style={{
                  fontSize: 11,
                  color: TOKENS.fgDim,
                  letterSpacing: "0.06em",
                  textTransform: "uppercase",
                }}
              >
                {over ? "Over budget" : "Remaining"}
              </div>
              <div
                style={{
                  fontSize: 26,
                  fontWeight: 500,
                  letterSpacing: "-0.02em",
                  color: over ? TOKENS.red : TOKENS.fg,
                  fontVariantNumeric: "tabular-nums",
                  marginTop: 2,
                }}
              >
                {formatIDR(Math.abs(remaining))}
              </div>
            </div>
          </div>
          <div
            style={{ fontSize: 12, color: TOKENS.fgMuted, marginBottom: 8 }}
          >
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
            <div
              style={{
                display: "flex",
                flexDirection: "column",
                gap: 10,
                marginTop: 12,
              }}
            >
              {breakdown.map((b) => (
                <div key={b.name}>
                  <div
                    style={{
                      display: "flex",
                      justifyContent: "space-between",
                      marginBottom: 4,
                    }}
                  >
                    <span
                      style={{
                        fontSize: 12.5,
                        color: TOKENS.fg,
                        textTransform: "capitalize",
                      }}
                    >
                      {b.name}
                    </span>
                    <span
                      style={{
                        fontSize: 12.5,
                        color: TOKENS.fgMuted,
                        fontVariantNumeric: "tabular-nums",
                      }}
                    >
                      {formatIDR(b.amount)}
                    </span>
                  </div>
                  <div
                    style={{
                      height: 4,
                      background: TOKENS.border,
                      borderRadius: 2,
                      overflow: "hidden",
                    }}
                  >
                    <div
                      style={{
                        width: `${(b.amount / maxBreakdown) * 100}%`,
                        height: "100%",
                        background: color,
                        borderRadius: 2,
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
          <div style={{ marginTop: 8 }}>
            {error && (
              <div
                style={{
                  fontSize: 12,
                  color: TOKENS.red,
                  padding: 12,
                }}
              >
                Failed to load transactions.
              </div>
            )}
            {txs == null && !error ? (
              <div
                style={{
                  fontSize: 12,
                  color: TOKENS.fgDim,
                  padding: 16,
                  textAlign: "center",
                }}
              >
                Loading…
              </div>
            ) : visibleTxs.length === 0 ? (
              <div
                style={{
                  fontSize: 12,
                  color: TOKENS.fgDim,
                  padding: 16,
                  textAlign: "center",
                }}
              >
                No transactions yet
              </div>
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
