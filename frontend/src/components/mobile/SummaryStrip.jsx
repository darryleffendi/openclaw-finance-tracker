import { TOKENS } from "../../lib/tokens"
import { formatIDRShort } from "../../lib/format"

function SummaryItem({ label, value, color }) {
  return (
    <div style={{ padding: "4px 0" }}>
      <div
        style={{
          fontSize: 10.5,
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
          fontSize: 19,
          fontWeight: 500,
          color,
          fontVariantNumeric: "tabular-nums",
          letterSpacing: "-0.02em",
          marginTop: 4,
        }}
      >
        Rp {value}
      </div>
    </div>
  )
}

export default function SummaryStrip({ summary }) {
  if (!summary)
    return <div style={{ height: 56, padding: "0 4px" }} />
  const { income = 0, expense = 0, balance = 0 } = summary
  return (
    <div
      style={{
        display: "grid",
        gridTemplateColumns: "1fr 1fr 1fr",
        padding: "0 4px",
      }}
    >
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
