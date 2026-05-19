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
      style={{
        display: "flex",
        alignItems: "center",
        gap: 12,
        padding: "12px 4px",
        borderBottom: `1px solid ${TOKENS.border}`,
        cursor: onTap ? "pointer" : "default",
      }}
    >
      <AccountTile id={tx.category} size={32} />
      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
          <span
            style={{
              fontSize: 13.5,
              color: TOKENS.fg,
              fontWeight: 500,
              textTransform: tx.subcategory ? "capitalize" : "none",
            }}
          >
            {subOrDefault}
          </span>
          {recurring && <Icon.Repeat size={11} color={TOKENS.fgDim} />}
        </div>
        <div
          style={{
            fontSize: 11.5,
            color: TOKENS.fgMuted,
            marginTop: 2,
            overflow: "hidden",
            textOverflow: "ellipsis",
            whiteSpace: "nowrap",
          }}
        >
          {meta}
          {distributed && (
            <span
              style={{
                marginLeft: 6,
                fontSize: 10.5,
                padding: "1px 6px",
                borderRadius: 4,
                background: "var(--accent-soft)",
                color: "var(--accent)",
                fontWeight: 500,
              }}
            >
              ↪ auto-distributed
            </span>
          )}
        </div>
      </div>
      <span
        style={{
          fontSize: 13.5,
          fontWeight: 500,
          color: isIncome ? TOKENS.income : TOKENS.fg,
          fontVariantNumeric: "tabular-nums",
          letterSpacing: "-0.01em",
          whiteSpace: "nowrap",
        }}
      >
        {isIncome
          ? formatIDR(signedAmount, { signed: true })
          : formatIDR(signedAmount)}
      </span>
    </div>
  )
}
