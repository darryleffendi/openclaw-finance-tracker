import { TOKENS } from "../../lib/tokens"
import { Icon } from "../../lib/icons"

const HEADER_HEIGHT = 52

function iconBtnStyle(bg) {
  return {
    width: 32,
    height: 32,
    borderRadius: 8,
    border: "none",
    background: bg || "transparent",
    cursor: "pointer",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
  }
}

export default function MobileHeader({
  periodLabel,
  onPeriodTap,
  onSettings,
  onAdd,
}) {
  return (
    <div
      style={{
        height: HEADER_HEIGHT,
        padding: "0 16px",
        display: "flex",
        alignItems: "center",
        justifyContent: "space-between",
        borderBottom: `1px solid ${TOKENS.border}`,
        background: TOKENS.bg,
        position: "sticky",
        top: 0,
        zIndex: 5,
      }}
    >
      <div
        style={{
          fontSize: 13,
          fontWeight: 600,
          letterSpacing: "0.02em",
          color: TOKENS.fgMuted,
        }}
      >
        rupiah<span style={{ color: "var(--accent)" }}>.</span>
      </div>
      <button
        onClick={onPeriodTap}
        style={{
          border: "none",
          background: "transparent",
          color: TOKENS.fg,
          fontSize: 14,
          fontWeight: 500,
          padding: "6px 10px",
          borderRadius: 8,
          display: "flex",
          alignItems: "center",
          gap: 4,
          cursor: "pointer",
          fontFamily: "inherit",
        }}
      >
        <Icon.ChevL size={16} color={TOKENS.fgMuted} />
        <span style={{ minWidth: 76, textAlign: "center" }}>{periodLabel}</span>
        <Icon.ChevR size={16} color={TOKENS.fgMuted} />
      </button>
      <div style={{ display: "flex", gap: 4 }}>
        <button onClick={onSettings} style={iconBtnStyle()}>
          <Icon.Settings size={18} color={TOKENS.fgMuted} />
        </button>
        <button onClick={onAdd} style={iconBtnStyle("var(--accent-soft)")}>
          <Icon.Plus size={18} color="var(--accent)" />
        </button>
      </div>
    </div>
  )
}

export { iconBtnStyle, HEADER_HEIGHT }
