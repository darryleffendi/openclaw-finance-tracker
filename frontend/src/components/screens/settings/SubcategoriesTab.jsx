import { useEffect, useState } from "react"
import { Icon } from "../../../lib/icons"
import { patchAccount } from "../../../api"

function AccountGroup({ account, onChange }) {
  const [items, setItems] = useState(account.subcategories || [])
  const [adding, setAdding] = useState("")
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState(null)

  useEffect(() => {
    setItems(account.subcategories || [])
  }, [account.subcategories])

  const commit = async (next) => {
    setBusy(true)
    setError(null)
    try {
      const updated = await patchAccount(account.slug, { subcategories: next })
      onChange?.(updated)
      setItems(updated.subcategories || next)
    } catch (e) {
      setError(e.message || "Save failed")
      setItems(account.subcategories || [])
    } finally {
      setBusy(false)
    }
  }

  const removeItem = (name) => commit(items.filter((i) => i !== name))
  const addItem = () => {
    const v = adding.trim()
    if (!v || items.includes(v)) return
    setAdding("")
    commit([...items, v])
  }

  return (
    <div>
      <div className="text-[12.5px] text-fg font-medium mb-2">
        {account.display_name}
      </div>
      <div className={`flex flex-wrap gap-1.5 ${busy ? "opacity-60" : ""}`}>
        {items.map((it) => (
          <span
            key={it}
            className="text-[11.5px] py-[5px] px-2.5 rounded-md bg-card border border-border text-fg inline-flex items-center gap-1.5 capitalize"
          >
            {it}
            <button
              onClick={() => removeItem(it)}
              disabled={busy}
              className={`bg-transparent border-0 p-0 inline-flex items-center ${busy ? "cursor-default" : "cursor-pointer"}`}
            >
              <Icon.X size={11} color="#5a6071" />
            </button>
          </span>
        ))}
        <input
          value={adding}
          onChange={(e) => setAdding(e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && addItem()}
          onBlur={addItem}
          placeholder="+ add"
          className="text-[11.5px] py-[5px] px-2.5 rounded-md border border-dashed border-border text-fg bg-transparent outline-none w-[80px]"
        />
      </div>
      {error && (
        <div className="text-[11px] text-red mt-1.5">{error}</div>
      )}
    </div>
  )
}

export default function SubcategoriesTab({ accounts, onAccountChange }) {
  if (!accounts) return null
  const visible = accounts.filter((a) => a.type === "expense")
  return (
    <div className="flex flex-col gap-4">
      {visible.map((a) => (
        <AccountGroup key={a.slug} account={a} onChange={onAccountChange} />
      ))}
    </div>
  )
}
