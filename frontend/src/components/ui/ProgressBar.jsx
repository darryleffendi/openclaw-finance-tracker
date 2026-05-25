import { statusFor } from "../../lib/tokens"

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
    <div className="relative" style={{ height: height + 4 }}>
      <div
        className="absolute left-0 right-0 top-0.5 bg-border overflow-hidden"
        style={{ height, borderRadius: height / 2 }}
      >
        <div
          className="h-full transition-[width] duration-400"
          style={{ width: `${pct * 100}%`, background: color, borderRadius: height / 2 }}
        />
        {over && (
          <div
            className="absolute top-0 h-full bg-red"
            style={{
              left: "100%",
              width: `${overPct * 100}%`,
              transform: "translateX(-2px)",
            }}
          />
        )}
      </div>
      {idealPct != null && (
        <div
          className="absolute top-0 w-0.5 bg-white/35 rounded-[1px]"
          style={{ left: `${idealPct * 100}%`, height: height + 4 }}
        />
      )}
    </div>
  )
}
