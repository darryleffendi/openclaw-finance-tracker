import { TOKENS } from "../../lib/tokens"
import { formatIDRShort } from "../../lib/format"

function SummaryItem({ label, value, color }) {
  return (
    <div className="py-1">
      <div className="text-[10.5px] text-fg-dim uppercase tracking-[0.06em] font-medium">
        {label}
      </div>
      <div
        className="text-[19px] font-medium tabular-nums tracking-[-0.02em] mt-1"
        style={{ color }}
      >
        Rp {value}
      </div>
    </div>
  )
}

export default function SummaryStrip({ summary }) {
  if (!summary)
    return <div className="h-14 px-1" />
  const { income = 0, expense = 0, balance = 0 } = summary
  return (
    <div className="grid grid-cols-3 px-1">
      <SummaryItem
        label="Income"
        value={formatIDRShort(income)}
        color={TOKENS.income}
      />
      <SummaryItem
        label="Expense"
        value={formatIDRShort(expense)}
        color={TOKENS.fg}
      />
      <SummaryItem
        label="Net"
        value={formatIDRShort(balance)}
        color={balance >= 0 ? TOKENS.income : TOKENS.red}
      />
    </div>
  )
}
