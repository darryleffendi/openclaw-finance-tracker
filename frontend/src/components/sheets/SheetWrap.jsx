import { TOKENS } from "../../lib/tokens"

// Bottom sheet shell — backdrop + rounded top + grabber handle.
// Click outside the sheet to close.
export default function SheetWrap({ onClose, children, maxHeight = "85%" }) {
  return (
    <div
      onClick={onClose}
      style={{
        position: "fixed",
        inset: 0,
        background: "rgba(0,0,0,0.5)",
        backdropFilter: "blur(4px)",
        display: "flex",
        alignItems: "flex-end",
        justifyContent: "center",
        zIndex: 100,
      }}
    >
      <div
        onClick={(e) => e.stopPropagation()}
        style={{
          width: "100%",
          maxWidth: 520,
          background: TOKENS.bgSoft,
          borderRadius: "20px 20px 0 0",
          borderTop: `1px solid ${TOKENS.border}`,
          padding: "8px 0 24px",
          maxHeight,
          overflow: "auto",
        }}
      >
        <div
          style={{
            width: 36,
            height: 4,
            background: TOKENS.border,
            borderRadius: 2,
            margin: "6px auto 14px",
          }}
        />
        {children}
      </div>
    </div>
  )
}

export function SheetHeader({ title, onClose, action }) {
  return (
    <div
      style={{
        display: "flex",
        alignItems: "center",
        justifyContent: "space-between",
        padding: "0 20px 16px",
      }}
    >
      <button
        onClick={onClose}
        style={{
          background: "transparent",
          border: "none",
          color: TOKENS.fgMuted,
          fontSize: 13,
          cursor: "pointer",
          fontFamily: "inherit",
          padding: 0,
        }}
      >
        Cancel
      </button>
      <div style={{ fontSize: 14, fontWeight: 500 }}>{title}</div>
      {action || <div style={{ width: 48 }} />}
    </div>
  )
}

export function SheetActionButton({ label, onClick, disabled }) {
  return (
    <button
      onClick={onClick}
      disabled={disabled}
      style={{
        background: disabled ? TOKENS.borderHi : "var(--accent)",
        color: "white",
        border: "none",
        borderRadius: 8,
        padding: "6px 14px",
        fontSize: 13,
        fontWeight: 500,
        cursor: disabled ? "not-allowed" : "pointer",
        fontFamily: "inherit",
        opacity: disabled ? 0.6 : 1,
      }}
    >
      {label}
    </button>
  )
}

export function FieldLabel({ children }) {
  return (
    <div
      style={{
        fontSize: 11,
        color: TOKENS.fgDim,
        letterSpacing: "0.05em",
        textTransform: "uppercase",
        fontWeight: 500,
      }}
    >
      {children}
    </div>
  )
}
