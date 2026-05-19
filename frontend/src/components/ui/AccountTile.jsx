import { TOKENS } from "../../lib/tokens"
import { ACCOUNT_ICON, Icon } from "../../lib/icons"

export default function AccountTile({ id, size = 32 }) {
  const I = ACCOUNT_ICON[id] || Icon.Coin
  return (
    <div
      style={{
        width: size,
        height: size,
        borderRadius: size / 4,
        background: TOKENS.bgSoft,
        border: `1px solid ${TOKENS.border}`,
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        color: TOKENS.fgMuted,
        flexShrink: 0,
      }}
    >
      <I size={size * 0.55} />
    </div>
  )
}
