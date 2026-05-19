import { TOKENS } from "../../lib/tokens"

export default function Toggle({ on, onClick }) {
  return (
    <button
      onClick={onClick}
      style={{
        width: 30,
        height: 18,
        borderRadius: 9,
        background: on ? "var(--accent)" : TOKENS.borderHi,
        position: "relative",
        transition: "background .15s",
        flexShrink: 0,
        border: "none",
        cursor: onClick ? "pointer" : "default",
        padding: 0,
      }}
    >
      <div
        style={{
          position: "absolute",
          top: 2,
          left: on ? 14 : 2,
          width: 14,
          height: 14,
          borderRadius: 7,
          background: "white",
          transition: "left .15s",
        }}
      />
    </button>
  )
}
