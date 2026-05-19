import { TOKENS } from "../../lib/tokens"
import { formatIDR, formatLongDate, ymdToday } from "../../lib/format"
import Card from "../ui/Card"
import AllowanceRing from "../ui/AllowanceRing"

function Stat({ label, value, color = TOKENS.fg }) {
  return (
    <div>
      <div
        style={{
          fontSize: 10.5,
          color: TOKENS.fgDim,
          textTransform: "uppercase",
          letterSpacing: "0.06em",
        }}
      >
        {label}
      </div>
      <div
        style={{
          fontSize: 14,
          fontWeight: 500,
          color,
          fontVariantNumeric: "tabular-nums",
          marginTop: 2,
        }}
      >
        {value}
      </div>
    </div>
  )
}

export default function HeroRing({ today, spentToday }) {
  if (!today) return <Card style={{ height: 172 }} />

  const allowance = today.total_allowance
  const over = today.over_budget || spentToday > allowance
  const remaining = allowance - spentToday
  const spentPct = allowance > 0 ? Math.min(1, spentToday / allowance) : 0
  const color = over
    ? TOKENS.red
    : spentPct > 0.7
      ? TOKENS.orange
      : "var(--accent)"

  // Derive day-of-month from today.date or current date.
  const [, , dStr] = (today.date || ymdToday()).split("-")
  const day = Number(dStr)
  const totalDays = day + today.days_remaining - 1

  return (
    <Card padding={20} style={{ borderColor: TOKENS.borderHi }}>
      <div
        style={{
          fontSize: 11.5,
          color: TOKENS.fgDim,
          textTransform: "uppercase",
          letterSpacing: "0.08em",
          fontWeight: 600,
          marginBottom: 14,
        }}
      >
        Today · {formatLongDate(today.date || ymdToday())}
      </div>
      <div style={{ display: "flex", alignItems: "center", gap: 18 }}>
        <div
          style={{
            position: "relative",
            width: 132,
            height: 132,
            flexShrink: 0,
          }}
        >
          <AllowanceRing
            size={132}
            dayOfMonth={day}
            daysInMonth={totalDays}
            spentPct={spentPct}
            color={color}
          />
          <div
            style={{
              position: "absolute",
              inset: 0,
              display: "flex",
              flexDirection: "column",
              alignItems: "center",
              justifyContent: "center",
            }}
          >
            <div
              style={{
                fontSize: 10,
                color: TOKENS.fgDim,
                letterSpacing: "0.05em",
                textTransform: "uppercase",
              }}
            >
              {over ? "Over by" : "Left"}
            </div>
            <div
              style={{
                fontSize: 18,
                fontWeight: 600,
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
          style={{
            flex: 1,
            display: "flex",
            flexDirection: "column",
            gap: 10,
          }}
        >
          <Stat label="Allowance" value={formatIDR(allowance)} />
          <Stat
            label="Spent today"
            value={formatIDR(spentToday)}
            color={over ? TOKENS.red : TOKENS.fg}
          />
          <div style={{ height: 1, background: TOKENS.border }} />
          <div
            style={{
              fontSize: 10,
              color: TOKENS.fgDim,
              letterSpacing: "0.05em",
              textTransform: "uppercase",
            }}
          >
            Day {day} of {totalDays}
          </div>
        </div>
      </div>
    </Card>
  )
}
