import { TOKENS, statusFor } from "../../lib/tokens"
import { formatIDR } from "../../lib/format"
import { Icon } from "../../lib/icons"
import Card from "../ui/Card"
import AccountTile from "../ui/AccountTile"
import ProgressBar from "../ui/ProgressBar"
import Sparkline from "../ui/Sparkline"

function accountTypeLabel(t) {
  if (t === "income") return "Income"
  if (t === "savings") return "Savings"
  if (t === "holding") return "Holding"
  return "Expense"
}

export default function AccountCard({
  account,
  spent,
  sparkValues,
  dayOfMonth,
  daysInMonth,
  onTap,
  recurring,
}) {
  const budget = account.monthly_budget || 0
  const remaining = budget - spent
  const over = remaining < 0
  const color = statusFor(remaining, Math.max(1, budget))
  const isIncome = account.type === "income"
  const isSavings = account.type === "savings"
  const isHolding = account.type === "holding"

  let bigNumber, bigColor, bigLabel
  if (isIncome) {
    bigNumber = formatIDR(spent)
    bigColor = TOKENS.income
    bigLabel = "received"
  } else if (over) {
    bigNumber = `Over by ${formatIDR(Math.abs(remaining))}`
    bigColor = TOKENS.red
    bigLabel = `Spent ${formatIDR(spent)} of ${formatIDR(budget)}`
  } else if (isSavings || isHolding) {
    bigNumber = formatIDR(spent)
    bigColor = isSavings ? "var(--accent)" : TOKENS.fg
    bigLabel = `${formatIDR(budget)} target`
  } else {
    bigNumber = `${formatIDR(remaining)} left`
    bigColor = TOKENS.fg
    bigLabel = `Spent ${formatIDR(spent)} of ${formatIDR(budget)}`
  }

  const showSpark =
    !isIncome && !isSavings && !isHolding && sparkValues && sparkValues.length > 1

  return (
    <Card
      padding={14}
      onClick={onTap}
      style={{
        cursor: onTap ? "pointer" : "default",
        background: over ? "rgba(248,113,113,0.05)" : TOKENS.card,
        borderColor: over ? "rgba(248,113,113,0.25)" : TOKENS.border,
      }}
    >
      <div
        style={{
          display: "flex",
          alignItems: "flex-start",
          gap: 12,
          marginBottom: 12,
        }}
      >
        <AccountTile id={account.slug} size={36} />
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
            <span
              style={{
                fontSize: 13,
                fontWeight: 500,
                color: TOKENS.fg,
              }}
            >
              {account.display_name}
            </span>
            {recurring && <Icon.Repeat size={11} color={TOKENS.fgDim} />}
          </div>
          <div
            style={{
              fontSize: 11,
              color: TOKENS.fgDim,
              marginTop: 2,
              letterSpacing: "0.02em",
            }}
          >
            {accountTypeLabel(account.type)}
            {account.subcategories && account.subcategories.length > 0 &&
              ` · ${account.subcategories.length} subcategories`}
          </div>
        </div>
        {showSpark && (
          <Sparkline
            values={sparkValues}
            color={over ? TOKENS.red : color}
          />
        )}
      </div>
      <div
        style={{
          fontSize: 19,
          fontWeight: 500,
          color: bigColor,
          fontVariantNumeric: "tabular-nums",
          letterSpacing: "-0.02em",
          marginBottom: 4,
        }}
      >
        {bigNumber}
      </div>
      <div
        style={{
          fontSize: 11.5,
          color: TOKENS.fgMuted,
          marginBottom: 10,
        }}
      >
        {bigLabel}
      </div>
      {!isIncome && (
        <ProgressBar
          spent={spent}
          budget={budget}
          dayOfMonth={dayOfMonth}
          daysInMonth={daysInMonth}
        />
      )}
    </Card>
  )
}
