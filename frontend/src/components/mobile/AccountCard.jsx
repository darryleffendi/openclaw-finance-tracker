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
      className={onTap ? "cursor-pointer" : "cursor-default"}
      style={over ? {
        background: "rgba(248,113,113,0.05)",
        borderColor: "rgba(248,113,113,0.25)",
      } : undefined}
    >
      <div className="flex items-start gap-3 mb-3">
        <AccountTile id={account.slug} size={36} />
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-1.5">
            <span className="text-[13px] font-medium text-fg">
              {account.display_name}
            </span>
            {recurring && <Icon.Repeat size={11} color="#5a6071" />}
          </div>
          <div className="text-[11px] text-fg-dim mt-0.5 tracking-[0.02em]">
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
        className="text-[19px] font-medium tabular-nums tracking-[-0.02em] mb-1"
        style={{ color: bigColor }}
      >
        {bigNumber}
      </div>
      <div className="text-[11.5px] text-fg-muted mb-2.5">
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
