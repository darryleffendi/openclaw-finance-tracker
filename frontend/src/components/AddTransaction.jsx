import { useState, useEffect } from "react"
import { apiFetch } from "../api"

export default function AddTransaction({ accounts, onAdded }) {
  const [form, setForm] = useState({
    amount: "",
    type: "expense",
    category: "",
    subcategory: "",
    note: "",
    date: new Date().toISOString().slice(0, 10),
  })
  const [subcategories, setSubcategories] = useState([])

  const relevantAccounts = accounts.filter((a) =>
    form.type === "income"
      ? ["income", "holding"].includes(a.type)
      : ["expense", "savings"].includes(a.type)
  )

  useEffect(() => {
    // Reset category when type changes if selected category is no longer valid
    const valid = relevantAccounts.find((a) => a.slug === form.category)
    if (!valid) setForm((f) => ({ ...f, category: "", subcategory: "" }))
  }, [form.type])

  useEffect(() => {
    const acct = accounts.find((a) => a.slug === form.category)
    setSubcategories(acct ? acct.subcategories : [])
    setForm((f) => ({ ...f, subcategory: "" }))
  }, [form.category, accounts])

  const set = (field) => (e) => setForm((f) => ({ ...f, [field]: e.target.value }))

  const submit = (e) => {
    e.preventDefault()
    apiFetch(`/api/transactions`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        amount: parseFloat(form.amount),
        type: form.type,
        category: form.category,
        subcategory: form.subcategory || null,
        note: form.note || null,
        date: form.date,
      }),
    }).then(onAdded)
  }

  const inputCls = "w-full bg-gray-700 rounded px-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-indigo-500"

  return (
    <form onSubmit={submit} className="bg-gray-800 rounded-lg p-4 mb-6 grid grid-cols-2 gap-3">
      <div>
        <label className="text-xs text-gray-400 block mb-1">Amount (IDR)</label>
        <input
          className={inputCls}
          type="number"
          placeholder="50000"
          value={form.amount}
          onChange={set("amount")}
          required
        />
      </div>

      <div>
        <label className="text-xs text-gray-400 block mb-1">Type</label>
        <select className={inputCls} value={form.type} onChange={set("type")}>
          <option value="expense">Expense</option>
          <option value="income">Income</option>
        </select>
      </div>

      <div>
        <label className="text-xs text-gray-400 block mb-1">Account</label>
        <select className={inputCls} value={form.category} onChange={set("category")} required>
          <option value="">Select account...</option>
          {relevantAccounts.map((a) => (
            <option key={a.slug} value={a.slug}>
              {a.display_name}
            </option>
          ))}
        </select>
      </div>

      <div>
        <label className="text-xs text-gray-400 block mb-1">Subcategory</label>
        <select
          className={inputCls}
          value={form.subcategory}
          onChange={set("subcategory")}
          disabled={subcategories.length === 0}
        >
          <option value="">None</option>
          {subcategories.map((s) => (
            <option key={s} value={s}>
              {s}
            </option>
          ))}
        </select>
      </div>

      <div>
        <label className="text-xs text-gray-400 block mb-1">Date</label>
        <input className={inputCls} type="date" value={form.date} onChange={set("date")} required />
      </div>

      <div>
        <label className="text-xs text-gray-400 block mb-1">Note</label>
        <input
          className={inputCls}
          type="text"
          placeholder="Optional note"
          value={form.note}
          onChange={set("note")}
        />
      </div>

      <div className="col-span-2">
        <button
          type="submit"
          className="w-full bg-indigo-600 hover:bg-indigo-500 rounded py-2 text-sm font-medium"
        >
          Add Transaction
        </button>
      </div>
    </form>
  )
}
