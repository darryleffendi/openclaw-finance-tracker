import { TOKENS, statusFor } from "../../lib/tokens"

// Variant C — track + fill + ideal-pace tick (day-of-month position).
export default function ProgressBar({
  spent,
  budget,
  height = 6,
  dayOfMonth,
  daysInMonth,
}) {
  const safeBudget = Math.max(1, budget)
  const over = spent > budget
  const pct = Math.min(1, spent / safeBudget)
  const overPct = over ? Math.min(1, (spent - safeBudget) / safeBudget) : 0
  const remaining = budget - spent
  const color = statusFor(remaining, safeBudget)
  const idealPct =
    dayOfMonth && daysInMonth ? Math.min(1, dayOfMonth / daysInMonth) : null

  return (
    <div style={{ position: "relative", height: height + 4 }}>
      <div
        style={{
          position: "absolute",
          left: 0,
          right: 0,
          top: 2,
          height,
          background: TOKENS.border,
          borderRadius: height / 2,
          overflow: "hidden",
        }}
      >
        <div
          style={{
            width: `${pct * 100}%`,
            height: "100%",
            background: color,
            borderRadius: height / 2,
            transition: "width .4s",
          }}
        />
        {over && (
          <div
            style={{
              position: "absolute",
              left: "100%",
              top: 0,
              height: "100%",
              width: `${overPct * 100}%`,
              background: TOKENS.red,
              transform: "translateX(-2px)",
            }}
          />
        )}
      </div>
      {idealPct != null && (
        <div
          style={{
            position: "absolute",
            left: `${idealPct * 100}%`,
            top: 0,
            width: 2,
            height: height + 4,
            background: "rgba(255,255,255,.35)",
            borderRadius: 1,
          }}
        />
      )}
    </div>
  )
}
