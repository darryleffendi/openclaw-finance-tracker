import { TOKENS } from "../../lib/tokens"
import SheetWrap from "./SheetWrap"

const PRESETS = [
  { value: "today", label: "Today", hint: "Just today" },
  { value: "this-week", label: "This week", hint: "Mon–Sun" },
  { value: "this-month", label: "This month", hint: "Current month" },
  { value: "last-month", label: "Last month", hint: "Previous month" },
  { value: "all", label: "All time", hint: "Every transaction" },
]

export default function PeriodPicker({ period, onPick, onClose }) {
  return (
    <SheetWrap onClose={onClose} maxHeight="60%">
      <div style={{ padding: "0 20px 4px" }}>
        <div
          style={{
            fontSize: 14,
            fontWeight: 500,
            marginBottom: 14,
            textAlign: "center",
          }}
        >
          Period
        </div>
        <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
          {PRESETS.map((p) => {
            const active = p.value === period
            return (
              <button
                key={p.value}
                onClick={() => {
                  onPick(p.value)
                  onClose()
                }}
                style={{
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "space-between",
                  padding: "14px 16px",
                  borderRadius: 12,
                  background: active ? "var(--accent-soft)" : TOKENS.card,
                  border: `1px solid ${active ? "var(--accent-glow)" : TOKENS.border}`,
                  cursor: "pointer",
                  fontFamily: "inherit",
                  textAlign: "left",
                }}
              >
                <div>
                  <div
                    style={{
                      fontSize: 14,
                      fontWeight: 500,
                      color: active ? "var(--accent)" : TOKENS.fg,
                    }}
                  >
                    {p.label}
                  </div>
                  <div
                    style={{
                      fontSize: 11.5,
                      color: TOKENS.fgDim,
                      marginTop: 2,
                    }}
                  >
                    {p.hint}
                  </div>
                </div>
                {active && (
                  <span
                    style={{
                      width: 8,
                      height: 8,
                      borderRadius: 4,
                      background: "var(--accent)",
                    }}
                  />
                )}
              </button>
            )
          })}
        </div>
      </div>
    </SheetWrap>
  )
}
