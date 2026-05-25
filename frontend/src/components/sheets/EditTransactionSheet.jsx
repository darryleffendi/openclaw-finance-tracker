import { useState } from "react"
import { TOKENS } from "../../lib/tokens"
import { Icon } from "../../lib/icons"
import { patchTransaction, deleteTransaction } from "../../api"
import SheetWrap, {
  SheetHeader,
  SheetActionButton,
  FieldLabel,
} from "./SheetWrap"

function ReadonlyRow({ label, value }) {
  return (
    <div className="flex items-center justify-between py-3 border-b border-border opacity-70">
      <span className="text-[12.5px] text-fg-dim">{label}</span>
      <span className="text-[13.5px] text-fg-muted capitalize">
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
            <div className="w-12" />
          ) : (
            <SheetActionButton
              label={submitting ? "Saving…" : "Save"}
              onClick={save}
              disabled={!canSubmit}
            />
          )
        }
      />

      <div className="px-5 flex flex-col gap-3.5">
        {isAutoDistRow && (
          <div className="py-2.5 px-3 bg-[rgba(248,113,113,0.08)] border border-[rgba(248,113,113,0.2)] rounded-[10px] text-[12px] text-red leading-[1.4]">
            This is an auto-distribution row and cannot be edited directly. Edit
            the parent salary transaction instead.
          </div>
        )}

        {isSalary && !isAutoDistRow && (
          <div className="py-2.5 px-3 bg-accent-soft border border-accent-glow rounded-[10px] text-[12px] text-accent leading-[1.4]">
            Editing this amount will re-distribute the salary across all
            expense and savings accounts.
          </div>
        )}

        <div>
          <FieldLabel>Amount</FieldLabel>
          <div className={`flex items-baseline gap-2 py-3.5 pb-3 border-b border-border ${isAutoDistRow ? "opacity-50" : ""}`}>
            <span className="text-[22px] text-fg-muted">Rp</span>
            <input
              type="text"
              inputMode="numeric"
              value={displayAmount}
              disabled={isAutoDistRow}
              onChange={(e) => setAmountStr(e.target.value.replace(/\D/g, ""))}
              className="flex-1 text-[32px] font-medium tracking-[-0.025em] text-fg tabular-nums bg-transparent border-0 outline-none p-0"
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
              className="w-full bg-transparent border-0 border-b border-border text-fg text-[14px] py-3 outline-none"
            />
          </div>
        )}

        <div className="text-[11px] text-fg-dim mt-1">
          Type and category are non-editable in v2.
        </div>

        {error && (
          <div className="text-[12px] text-red py-2 px-2.5 bg-[rgba(248,113,113,0.08)] rounded-lg border border-[rgba(248,113,113,0.2)]">
            {error}
          </div>
        )}

        {!isAutoDistRow && (
          <button
            onClick={remove}
            disabled={submitting}
            className={`mt-1.5 bg-transparent border border-border text-red rounded-[10px] py-2.5 px-3 text-[13px] font-medium flex items-center justify-center gap-2 ${submitting ? "cursor-not-allowed opacity-50" : "cursor-pointer"}`}
          >
            <Icon.Trash size={14} color={TOKENS.red} />
            Delete{isSalary ? " salary (cascade)" : isRecurringRow ? " this occurrence" : ""}
          </button>
        )}
      </div>
    </SheetWrap>
  )
}
