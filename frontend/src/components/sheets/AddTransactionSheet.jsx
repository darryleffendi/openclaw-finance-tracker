import { useMemo, useState } from "react"
import { TOKENS } from "../../lib/tokens"
import { Icon } from "../../lib/icons"
import { formatIDR, ymdToday } from "../../lib/format"
import { createTransaction } from "../../api"
import SegToggle from "../ui/SegToggle"
import SheetWrap, {
  SheetHeader,
  SheetActionButton,
  FieldLabel,
} from "./SheetWrap"

function PickerRow({ label, value, onTap, disabled }) {
  return (
    <button
      onClick={disabled ? undefined : onTap}
      style={{
        display: "flex",
        alignItems: "center",
        justifyContent: "space-between",
        padding: "12px 0",
        borderBottom: `1px solid ${TOKENS.border}`,
        background: "transparent",
        border: "none",
        borderTop: "none",
        borderLeft: "none",
        borderRight: "none",
        cursor: disabled ? "default" : "pointer",
        width: "100%",
        textAlign: "left",
        fontFamily: "inherit",
        color: "inherit",
        opacity: disabled ? 0.5 : 1,
      }}
    >
      <span style={{ fontSize: 12.5, color: TOKENS.fgDim }}>{label}</span>
      <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
        <span
          style={{
            fontSize: 13.5,
            color: TOKENS.fg,
            textTransform: "capitalize",
          }}
        >
          {value || "—"}
        </span>
        {!disabled && <Icon.ChevR size={14} color={TOKENS.fgDim} />}
      </div>
    </button>
  )
}

function PopoverList({ options, onPick, onClose }) {
  return (
    <div
      onClick={onClose}
      style={{
        position: "absolute",
        inset: 0,
        background: "rgba(0,0,0,0.4)",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        zIndex: 110,
      }}
    >
      <div
        onClick={(e) => e.stopPropagation()}
        style={{
          background: TOKENS.card,
          border: `1px solid ${TOKENS.border}`,
          borderRadius: 12,
          padding: 6,
          maxHeight: 320,
          overflowY: "auto",
          minWidth: 220,
        }}
      >
        {options.length === 0 && (
          <div
            style={{
              padding: 12,
              fontSize: 12,
              color: TOKENS.fgDim,
              textAlign: "center",
            }}
          >
            (none)
          </div>
        )}
        {options.map((o) => (
          <button
            key={o.value}
            onClick={() => {
              onPick(o.value)
              onClose()
            }}
            style={{
              display: "block",
              width: "100%",
              textAlign: "left",
              background: "transparent",
              border: "none",
              padding: "10px 12px",
              borderRadius: 8,
              color: TOKENS.fg,
              fontSize: 13,
              cursor: "pointer",
              fontFamily: "inherit",
              textTransform: "capitalize",
            }}
          >
            {o.label}
          </button>
        ))}
      </div>
    </div>
  )
}

export default function AddTransactionSheet({ accounts, onClose, onAdded }) {
  const [type, setType] = useState("expense")
  const [category, setCategory] = useState(null)
  const [subcategory, setSubcategory] = useState(null)
  const [amount, setAmount] = useState("")
  const [date, setDate] = useState(ymdToday())
  const [note, setNote] = useState("")
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState(null)
  const [openPicker, setOpenPicker] = useState(null)

  const categoryOptions = useMemo(() => {
    if (!accounts) return []
    return accounts
      .filter((a) => (type === "income" ? a.type === "income" : a.type === "expense"))
      .map((a) => ({ value: a.slug, label: a.display_name }))
  }, [accounts, type])

  const selectedAccount = accounts?.find((a) => a.slug === category) || null
  const subcategoryOptions = useMemo(
    () =>
      (selectedAccount?.subcategories || []).map((s) => ({
        value: s,
        label: s,
      })),
    [selectedAccount]
  )

  const numericAmount = Number(amount.replace(/\D/g, "")) || 0
  const valid = numericAmount > 0 && !!category
  const displayAmount = numericAmount
    ? numericAmount.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ".")
    : "0"

  const submit = async () => {
    if (!valid || submitting) return
    setSubmitting(true)
    setError(null)
    try {
      const res = await createTransaction({
        amount: numericAmount,
        type,
        category,
        subcategory: subcategory || undefined,
        note: note || undefined,
        date,
      })
      onAdded?.(res)
      onClose?.()
    } catch (e) {
      setError(e.message || "Failed to add transaction")
      setSubmitting(false)
    }
  }

  return (
    <SheetWrap onClose={submitting ? undefined : onClose}>
      <SheetHeader
        title="New transaction"
        onClose={onClose}
        action={
          <SheetActionButton
            label={submitting ? "Adding…" : "Add"}
            onClick={submit}
            disabled={!valid || submitting}
          />
        }
      />

      <div
        style={{
          padding: "0 20px",
          display: "flex",
          flexDirection: "column",
          gap: 18,
        }}
      >
        <SegToggle
          value={type}
          onChange={(v) => {
            setType(v)
            setCategory(null)
            setSubcategory(null)
          }}
          options={[
            { value: "expense", label: "Expense" },
            { value: "income", label: "Income" },
          ]}
        />

        <div>
          <FieldLabel>Amount</FieldLabel>
          <div
            style={{
              display: "flex",
              alignItems: "baseline",
              gap: 8,
              padding: "14px 0 12px",
              borderBottom: `1px solid ${TOKENS.border}`,
            }}
          >
            <span
              style={{ fontSize: 22, color: TOKENS.fgMuted, fontWeight: 400 }}
            >
              Rp
            </span>
            <input
              type="text"
              inputMode="numeric"
              placeholder="0"
              value={displayAmount}
              onChange={(e) =>
                setAmount(e.target.value.replace(/\D/g, ""))
              }
              style={{
                flex: 1,
                fontSize: 36,
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

        <PickerRow
          label="Category"
          value={selectedAccount?.display_name}
          onTap={() => setOpenPicker("category")}
        />
        <PickerRow
          label="Subcategory"
          value={subcategory}
          onTap={() => setOpenPicker("subcategory")}
          disabled={!selectedAccount || subcategoryOptions.length === 0}
        />
        <div>
          <FieldLabel>Date</FieldLabel>
          <input
            type="date"
            value={date}
            onChange={(e) => setDate(e.target.value)}
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
              colorScheme: "dark",
            }}
          />
        </div>
        <div>
          <FieldLabel>Note</FieldLabel>
          <input
            type="text"
            placeholder="optional"
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

        {category === "salary" && type === "income" && (
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
            Adding salary income will auto-distribute{" "}
            {formatIDR(numericAmount)} across expense and savings accounts.
          </div>
        )}
      </div>

      {openPicker === "category" && (
        <PopoverList
          options={categoryOptions}
          onPick={(slug) => {
            setCategory(slug)
            setSubcategory(null)
          }}
          onClose={() => setOpenPicker(null)}
        />
      )}
      {openPicker === "subcategory" && (
        <PopoverList
          options={subcategoryOptions}
          onPick={setSubcategory}
          onClose={() => setOpenPicker(null)}
        />
      )}
    </SheetWrap>
  )
}
