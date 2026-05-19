import { TOKENS } from "../../lib/tokens"
import { Icon } from "../../lib/icons"

export default function Login() {
  return (
    <div
      style={{
        background: TOKENS.bg,
        color: TOKENS.fg,
        minHeight: "100vh",
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center",
        padding: "0 32px",
        textAlign: "center",
      }}
    >
      <div
        style={{
          width: 56,
          height: 56,
          borderRadius: 16,
          background: "linear-gradient(135deg, var(--accent), var(--accent))",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          marginBottom: 24,
          boxShadow: "0 8px 24px var(--accent-glow)",
        }}
      >
        <span
          style={{
            fontSize: 26,
            fontWeight: 600,
            color: "white",
            letterSpacing: "-0.05em",
          }}
        >
          R
        </span>
      </div>
      <div
        style={{
          fontSize: 26,
          fontWeight: 600,
          letterSpacing: "-0.025em",
        }}
      >
        rupiah<span style={{ color: "var(--accent)" }}>.</span>
      </div>
      <div
        style={{
          fontSize: 14,
          color: TOKENS.fgMuted,
          marginTop: 8,
          marginBottom: 48,
        }}
      >
        Your money, at a glance.
      </div>
      <a
        href="/api/auth/login"
        style={{
          width: "100%",
          maxWidth: 320,
          height: 48,
          borderRadius: 12,
          border: `1px solid ${TOKENS.border}`,
          background: TOKENS.card,
          color: TOKENS.fg,
          fontSize: 14,
          fontWeight: 500,
          cursor: "pointer",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          gap: 10,
          textDecoration: "none",
        }}
      >
        <Icon.Google size={18} />
        Sign in with Google
      </a>
      <div
        style={{ fontSize: 11.5, color: TOKENS.fgDim, marginTop: 24 }}
      >
        Single-account access.
      </div>
    </div>
  )
}
