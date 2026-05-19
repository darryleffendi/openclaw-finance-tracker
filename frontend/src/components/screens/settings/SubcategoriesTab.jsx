import { useEffect, useState } from "react"
import { TOKENS } from "../../../lib/tokens"
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
      <div
        style={{
          fontSize: 12.5,
          color: TOKENS.fg,
          fontWeight: 500,
          marginBottom: 8,
        }}
      >
        {account.display_name}
      </div>
      <div
        style={{
          display: "flex",
          flexWrap: "wrap",
          gap: 6,
          opacity: busy ? 0.6 : 1,
        }}
      >
        {items.map((it) => (
          <span
            key={it}
            style={{
              fontSize: 11.5,
              padding: "5px 10px",
              borderRadius: 6,
              background: TOKENS.card,
              border: `1px solid ${TOKENS.border}`,
              color: TOKENS.fg,
              display: "inline-flex",
              alignItems: "center",
              gap: 6,
              textTransform: "capitalize",
            }}
          >
            {it}
            <button
              onClick={() => removeItem(it)}
              disabled={busy}
              style={{
                background: "transparent",
                border: "none",
                cursor: busy ? "default" : "pointer",
                padding: 0,
                display: "inline-flex",
                alignItems: "center",
              }}
            >
              <Icon.X size={11} color={TOKENS.fgDim} />
            </button>
          </span>
        ))}
        <input
          value={adding}
          onChange={(e) => setAdding(e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && addItem()}
          onBlur={addItem}
          placeholder="+ add"
          style={{
            fontSize: 11.5,
            padding: "5px 10px",
            borderRadius: 6,
            border: `1px dashed ${TOKENS.border}`,
            color: TOKENS.fg,
            background: "transparent",
            outline: "none",
            fontFamily: "inherit",
            width: 80,
          }}
        />
      </div>
      {error && (
        <div style={{ fontSize: 11, color: TOKENS.red, marginTop: 6 }}>
          {error}
        </div>
      )}
    </div>
  )
}

export default function SubcategoriesTab({ accounts, onAccountChange }) {
  if (!accounts) return null
  const visible = accounts.filter((a) => a.type === "expense")
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
      {visible.map((a) => (
        <AccountGroup key={a.slug} account={a} onChange={onAccountChange} />
      ))}
    </div>
  )
}
