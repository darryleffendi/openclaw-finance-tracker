import { TOKENS } from "../../lib/tokens"
import { formatIDR, formatLongDate, ymdToday } from "../../lib/format"
import Card from "../ui/Card"
import AllowanceRing from "../ui/AllowanceRing"

function Stat({ label, value, color }) {
  return (
    <div>
      <div className="text-[10.5px] text-fg-dim uppercase tracking-[0.06em]">
        {label}
      </div>
      <div
        className="text-[14px] font-medium tabular-nums mt-0.5"
        style={{ color }}
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

  const [, , dStr] = (today.date || ymdToday()).split("-")
  const day = Number(dStr)
  const totalDays = day + today.days_remaining - 1

  return (
    <Card padding={20} style={{ borderColor: TOKENS.borderHi }}>
      <div className="text-[11.5px] text-fg-dim uppercase tracking-[0.08em] font-semibold mb-[14px]">
        Today · {formatLongDate(today.date || ymdToday())}
      </div>
      <div className="flex items-center gap-[18px]">
        <div className="relative w-[132px] h-[132px] shrink-0">
          <AllowanceRing
            size={132}
            dayOfMonth={day}
            daysInMonth={totalDays}
            spentPct={spentPct}
            color={color}
          />
          <div className="absolute inset-0 flex flex-col items-center justify-center">
            <div className="text-[10px] text-fg-dim tracking-[0.05em] uppercase">
              {over ? "Over by" : "Left"}
            </div>
            <div
              className="text-[18px] font-semibold tabular-nums mt-0.5"
              style={{ color: over ? TOKENS.red : TOKENS.fg }}
            >
              {formatIDR(Math.abs(remaining))}
            </div>
          </div>
        </div>
        <div className="flex-1 flex flex-col gap-2.5">
          <Stat label="Allowance" value={formatIDR(allowance)} color={TOKENS.fg} />
          <Stat
            label="Spent today"
            value={formatIDR(spentToday)}
            color={over ? TOKENS.red : TOKENS.fg}
          />
          <div className="h-px bg-border" />
          <div className="text-[10px] text-fg-dim tracking-[0.05em] uppercase">
            Day {day} of {totalDays}
          </div>
        </div>
      </div>
    </Card>
  )
}
