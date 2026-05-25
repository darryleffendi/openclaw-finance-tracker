import { ACCOUNT_ICON, Icon } from "../../lib/icons"

export default function AccountTile({ id, size = 32 }) {
  const I = ACCOUNT_ICON[id] || Icon.Coin
  return (
    <div
      className="bg-bg-soft border border-border flex items-center justify-center text-fg-muted shrink-0"
      style={{ width: size, height: size, borderRadius: size / 4 }}
    >
      <I size={size * 0.55} />
    </div>
  )
}
