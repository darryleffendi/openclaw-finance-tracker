import { Icon } from "../../lib/icons"

export default function Login() {
  return (
    <div className="bg-bg text-fg min-h-screen flex flex-col items-center justify-center px-8 text-center">
      <div className="w-14 h-14 rounded-2xl bg-accent flex items-center justify-center mb-6 shadow-[0_8px_24px_var(--accent-glow)]">
        <span className="text-[26px] font-semibold text-white tracking-[-0.05em]">R</span>
      </div>
      <div className="text-[26px] font-semibold tracking-[-0.025em]">
        rupiah<span className="text-accent">.</span>
      </div>
      <div className="text-[14px] text-fg-muted mt-2 mb-12">
        Your money, at a glance.
      </div>
      <a
        href="/api/auth/login"
        className="w-full max-w-xs h-12 rounded-xl border border-border bg-card text-fg text-[14px] font-medium cursor-pointer flex items-center justify-center gap-2.5 no-underline"
      >
        <Icon.Google size={18} />
        Sign in with Google
      </a>
      <div className="text-[11.5px] text-fg-dim mt-6">
        Single-account access.
      </div>
    </div>
  )
}
