import { TOKENS } from "../../lib/tokens"

export default function Chip({ active, onClick, children }) {
  return (
    <button
      onClick={onClick}
      style={{
        border: "none",
        borderRadius: 999,
        padding: "6px 12px",
        fontSize: 12.5,
        fontWeight: 500,
        background: active ? "var(--accent-soft)" : "transparent",
        color: active ? "var(--accent)" : TOKENS.fgMuted,
        boxShadow: active ? "none" : `inset 0 0 0 1px ${TOKENS.border}`,
        cursor: "pointer",
        whiteSpace: "nowrap",
        letterSpacing: "-0.01em",
        fontFamily: "inherit",
      }}
    >
      {children}
    </button>
  )
}
