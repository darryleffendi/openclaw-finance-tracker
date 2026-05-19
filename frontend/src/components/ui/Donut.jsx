import { TOKENS } from "../../lib/tokens"

export default function Donut({ data, size = 160, stroke = 22 }) {
  const total = data.reduce((s, d) => s + d.value, 0) || 1
  const r = size / 2 - stroke / 2
  const c = 2 * Math.PI * r
  let acc = 0
  return (
    <svg
      width={size}
      height={size}
      viewBox={`0 0 ${size} ${size}`}
      style={{ transform: "rotate(-90deg)" }}
    >
      <circle
        cx={size / 2}
        cy={size / 2}
        r={r}
        fill="none"
        stroke={TOKENS.border}
        strokeWidth={stroke}
      />
      {data.map((d, i) => {
        const len = (d.value / total) * c
        const off = c - acc
        acc += len
        return (
          <circle
            key={i}
            cx={size / 2}
            cy={size / 2}
            r={r}
            fill="none"
            stroke={d.color}
            strokeWidth={stroke}
            strokeDasharray={`${len} ${c - len}`}
            strokeDashoffset={off}
            style={{ transition: "stroke-dasharray .4s" }}
          />
        )
      })}
    </svg>
  )
}
