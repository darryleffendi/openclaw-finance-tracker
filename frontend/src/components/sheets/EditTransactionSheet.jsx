import { useState } from "react"
import { TOKENS } from "../../lib/tokens"
import { Icon } from "../../lib/icons"
import { formatIDR } from "../../lib/format"
import { patchTransaction, deleteTransaction } from "../../api"
import SheetWrap, {
  SheetHeader,
  SheetActionButton,
  FieldLabel,
} from "./SheetWrap"

function ReadonlyRow({ label, value }) {
  return (
    <div
      style={{
        display: "flex",
        alignItems: "center",
        justifyContent: "space-between",
        padding: "12px 0",
        borderBottom: `1px solid ${TOKENS.border}`,
        opacity: 0.7,
      }}
    >
      <span style={{ fontSize: 12.5, color: TOKENS.fgDim }}>{label}</span>
      <span
        style={{
          fontSize: 13.5,
          color: TOKENS.fgMuted,
          textTransform: "capitalize",
        }}
      >
        {value || "—"}
      </span>
    </div>
  )
}

export default function EditTransactionSheet({ tx, accounts, onClose, onSaved }) {
  const initial = Math.abs(tx.amount)
  const [amountStr, setAmountStr] = useState(String(initial))
  const [note, setNote] = useState(tx.note || "")
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState(null)

  const isAutoDistRow = tx.note === "auto-distribution from salary"
  const isSalary = tx.category === "salary" && tx.type === "income"
  const isRecurringRow = tx.note && tx.note.startsWith("recurring:")

  const account = accounts?.find((a) => a.slug === tx.category)
  const numericAmount = Number(amountStr.replace(/\D/g, "")) || 0
  const displayAmount = numericAmount
    ? numericAmount.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ".")
    : "0"
  const changed = numericAmount !== initial || note !== (tx.note || "")
  const canSubmit = !isAutoDistRow && changed && numericAmount > 0 && !submitting

  const save = async () => {
    if (!canSubmit) return
    setSubmitting(true)
    setError(null)
    try {
      const patch = {}
      if (numericAmount !== initial) patch.amount = numericAmount
      if (note !== (tx.note || "")) patch.note = note
      const res = await patchTransaction(tx.id, patch)
      onSaved?.(res)
      onClose?.()
    } catch (e) {
      setError(e.message || "Failed to save")
      setSubmitting(false)
    }
  }

  const remove = async () => {
    if (submitting) return
    if (!confirm("Delete this transaction?")) return
    setSubmitting(true)
    setError(null)
    try {
      await deleteTransaction(tx.id)
      onSaved?.({ deleted: true })
      onClose?.()
    } catch (e) {
      setError(e.message || "Failed to delete")
      setSubmitting(false)
    }
  }

  return (
    <SheetWrap onClose={submitting ? undefined : onClose}>
      <SheetHeader
        title="Edit transaction"
        onClose={onClose}
        action={
          isAutoDistRow ? (
            <div style={{ width: 48 }} />
          ) : (
            <SheetActionButton
              label={submitting ? "Saving…" : "Save"}
              onClick={save}
              disabled={!canSubmit}
            />
          )
        }
      />

      <div
        style={{
          padding: "0 20px",
          display: "flex",
          flexDirection: "column",
          gap: 14,
        }}
      >
        {isAutoDistRow && (
          <div
            style={{
              padding: "10px 12px",
              background: "rgba(248,113,113,0.08)",
              border: "1px solid rgba(248,113,113,0.2)",
              borderRadius: 10,
              fontSize: 12,
              color: TOKENS.red,
              lineHeight: 1.4,
            }}
          >
            This is an auto-distribution row and cannot be edited directly. Edit
            the parent salary transaction instead.
          </div>
        )}

        {isSalary && !isAutoDistRow && (
          <div
            style={{
              padding: "10px 12px",
              background: "var(--accent-soft)",
              border: "1px solid var(--accent-glow)",
              borderRadius: 10,
              fontSize: 12,
              color: "var(--accent)",
              lineHeight: 1.4,
            }}
          >
            Editing this amount will re-distribute the salary across all
            expense and savings accounts.
          </div>
        )}

        <div>
          <FieldLabel>Amount</FieldLabel>
          <div
            style={{
              display: "flex",
              alignItems: "baseline",
              gap: 8,
              padding: "14px 0 12px",
              borderBottom: `1px solid ${TOKENS.border}`,
              opacity: isAutoDistRow ? 0.5 : 1,
            }}
          >
            <span style={{ fontSize: 22, color: TOKENS.fgMuted }}>Rp</span>
            <input
              type="text"
              inputMode="numeric"
              value={displayAmount}
              disabled={isAutoDistRow}
              onChange={(e) =>
                setAmountStr(e.target.value.replace(/\D/g, ""))
              }
              style={{
                flex: 1,
                fontSize: 32,
                fontWeight: 500,
                letterSpacing: "-0.025em",
                color: TOKENS.fg,
                fontVariantNumeric: "tabular-nums",
                background: "transparent",
                border: "none",
                outline: "none",
                padding: 0,
                fontFamily: "inherit",
              }}
            />
          </div>
        </div>

        <ReadonlyRow
          label="Category"
          value={account?.display_name || tx.category}
        />
        <ReadonlyRow label="Subcategory" value={tx.subcategory} />
        <ReadonlyRow label="Date" value={tx.date} />

        {!isAutoDistRow && (
          <div>
            <FieldLabel>Note</FieldLabel>
            <input
              value={note}
              onChange={(e) => setNote(e.target.value)}
              style={{
                width: "100%",
                background: "transparent",
                border: "none",
                borderBottom: `1px solid ${TOKENS.border}`,
                color: TOKENS.fg,
                fontSize: 14,
                padding: "12px 0",
                outline: "none",
                fontFamily: "inherit",
              }}
            />
          </div>
        )}

        <div style={{ fontSize: 11, color: TOKENS.fgDim, marginTop: 4 }}>
          Type and category are non-editable in v2.
        </div>

        {error && (
          <div
            style={{
              fontSize: 12,
              color: TOKENS.red,
              padding: "8px 10px",
              background: "rgba(248,113,113,0.08)",
              borderRadius: 8,
              border: "1px solid rgba(248,113,113,0.2)",
            }}
          >
            {error}
          </div>
        )}

        {!isAutoDistRow && (
          <button
            onClick={remove}
            disabled={submitting}
            style={{
              marginTop: 6,
              background: "transparent",
              border: `1px solid ${TOKENS.border}`,
              color: TOKENS.red,
              borderRadius: 10,
              padding: "10px 12px",
              fontSize: 13,
              fontWeight: 500,
              cursor: submitting ? "not-allowed" : "pointer",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              gap: 8,
              fontFamily: "inherit",
              opacity: submitting ? 0.5 : 1,
            }}
          >
            <Icon.Trash size={14} color={TOKENS.red} />
            Delete{isSalary ? " salary (cascade)" : isRecurringRow ? " this occurrence" : ""}
          </button>
        )}
      </div>
    </SheetWrap>
  )
}
