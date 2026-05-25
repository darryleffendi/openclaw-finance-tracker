import { useMemo, useState } from "react"
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
      className={`flex items-center justify-between py-3 border-b border-border bg-transparent border-t-0 border-l-0 border-r-0 w-full text-left text-inherit ${disabled ? "opacity-50 cursor-default" : "cursor-pointer"}`}
    >
      <span className="text-[12.5px] text-fg-dim">{label}</span>
      <div className="flex items-center gap-1.5">
        <span className="text-[13.5px] text-fg capitalize">
          {value || "—"}
        </span>
        {!disabled && <Icon.ChevR size={14} color="#5a6071" />}
      </div>
    </button>
  )
}

function PopoverList({ options, onPick, onClose }) {
  return (
    <div
      onClick={onClose}
      className="absolute inset-0 bg-black/40 flex items-center justify-center z-[110]"
    >
      <div
        onClick={(e) => e.stopPropagation()}
        className="bg-card border border-border rounded-xl p-1.5 max-h-[320px] overflow-y-auto min-w-[220px]"
      >
        {options.length === 0 && (
          <div className="p-3 text-[12px] text-fg-dim text-center">(none)</div>
        )}
        {options.map((o) => (
          <button
            key={o.value}
            onClick={() => {
              onPick(o.value)
              onClose()
            }}
            className="block w-full text-left bg-transparent border-0 py-2.5 px-3 rounded-lg text-fg text-[13px] cursor-pointer capitalize"
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

      <div className="px-5 flex flex-col gap-[18px]">
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
          <div className="flex items-baseline gap-2 py-3.5 pb-3 border-b border-border">
            <span className="text-[22px] text-fg-muted font-normal">Rp</span>
            <input
              type="text"
              inputMode="numeric"
              placeholder="0"
              value={displayAmount}
              onChange={(e) => setAmount(e.target.value.replace(/\D/g, ""))}
              className="flex-1 text-[36px] font-medium tracking-[-0.025em] text-fg tabular-nums bg-transparent border-0 outline-none p-0"
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
            className="w-full bg-transparent border-0 border-b border-border text-fg text-[14px] py-3 outline-none"
            style={{ colorScheme: "dark" }}
          />
        </div>
        <div>
          <FieldLabel>Note</FieldLabel>
          <input
            type="text"
            placeholder="optional"
            value={note}
            onChange={(e) => setNote(e.target.value)}
            className="w-full bg-transparent border-0 border-b border-border text-fg text-[14px] py-3 outline-none"
          />
        </div>

        {error && (
          <div className="text-[12px] text-red py-2 px-2.5 bg-[rgba(248,113,113,0.08)] rounded-lg border border-[rgba(248,113,113,0.2)]">
            {error}
          </div>
        )}

        {category === "salary" && type === "income" && (
          <div className="py-2.5 px-3 bg-accent-soft border border-accent-glow rounded-[10px] text-[12px] text-accent leading-[1.4]">
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
