import { TOKENS } from "../../lib/tokens"

export default function SegToggle({ value, onChange, options }) {
  return (
    <div
      style={{
        display: "flex",
        background: TOKENS.bg,
        borderRadius: 10,
        padding: 3,
        border: `1px solid ${TOKENS.border}`,
      }}
    >
      {options.map((o) => (
        <button
          key={o.value}
          onClick={() => onChange(o.value)}
          style={{
            flex: 1,
            padding: "8px 0",
            border: "none",
            borderRadius: 7,
            background: value === o.value ? TOKENS.card : "transparent",
            color: value === o.value ? TOKENS.fg : TOKENS.fgMuted,
            fontSize: 13,
            fontWeight: 500,
            cursor: "pointer",
            fontFamily: "inherit",
          }}
        >
          {o.label}
        </button>
      ))}
    </div>
  )
}
