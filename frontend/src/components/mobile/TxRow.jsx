import { TOKENS } from "../../lib/tokens"
import { formatIDR, formatLongDate } from "../../lib/format"
import { Icon } from "../../lib/icons"
import AccountTile from "../ui/AccountTile"

export default function TxRow({ tx, onTap }) {
  const isIncome = tx.type === "income"
  const signedAmount = isIncome ? tx.amount : -tx.amount
  const recurring = tx.note && tx.note.startsWith("recurring:")
  const distributed =
    tx.category === "salary" && tx.type === "income"
  const subOrDefault = tx.subcategory || (isIncome ? "Income" : "Expense")
  const noteClean = recurring
    ? tx.note.replace(/^recurring:\s*/i, "")
    : tx.note || ""
  const dateLabel = formatLongDate(tx.date)
  const meta = noteClean ? `${noteClean} · ${dateLabel}` : dateLabel

  return (
    <div
      onClick={onTap}
      className={`flex items-center gap-3 py-3 px-1 border-b border-border ${onTap ? "cursor-pointer" : "cursor-default"}`}
    >
      <AccountTile id={tx.category} size={32} />
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-1.5">
          <span
            className={`text-[13.5px] text-fg font-medium ${tx.subcategory ? "capitalize" : ""}`}
          >
            {subOrDefault}
          </span>
          {recurring && <Icon.Repeat size={11} color="#5a6071" />}
        </div>
        <div className="text-[11.5px] text-fg-muted mt-0.5 overflow-hidden text-ellipsis whitespace-nowrap">
          {meta}
          {distributed && (
            <span className="ml-1.5 text-[10.5px] py-px px-1.5 rounded bg-accent-soft text-accent font-medium">
              ↪ auto-distributed
            </span>
          )}
        </div>
      </div>
      <span
        className="text-[13.5px] font-medium tabular-nums tracking-[-0.01em] whitespace-nowrap"
        style={{ color: isIncome ? TOKENS.income : TOKENS.fg }}
      >
        {isIncome
          ? formatIDR(signedAmount, { signed: true })
          : formatIDR(signedAmount)}
      </span>
    </div>
  )
}
