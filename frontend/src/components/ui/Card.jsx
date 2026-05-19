import { TOKENS } from "../../lib/tokens"

export default function Card({ style, children, padding = 16, ...rest }) {
  return (
    <div
      {...rest}
      style={{
        background: TOKENS.card,
        border: `1px solid ${TOKENS.border}`,
        borderRadius: 16,
        padding,
        transition: "background .15s, border-color .15s",
        ...style,
      }}
    >
      {children}
    </div>
  )
}
