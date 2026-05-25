// Concentric rings: outer = month progress (dim), inner = budget burned
// (status-colored). Center stays empty for the parent to render the label.
export default function AllowanceRing({
  size = 220,
  dayOfMonth,
  daysInMonth,
  spentPct = 0,
  color = "var(--accent)",
}) {
  const stroke = 10
  const gap = 4
  const r1 = size / 2 - stroke / 2
  const r2 = r1 - stroke - gap
  const c1 = 2 * Math.PI * r1
  const c2 = 2 * Math.PI * r2
  const monthPct = Math.min(1, Math.max(0, dayOfMonth / daysInMonth))
  const spent = Math.min(1, Math.max(0, spentPct))
  return (
    <svg
      width={size}
      height={size}
      viewBox={`0 0 ${size} ${size}`}
      className="-rotate-90"
    >
      <circle cx={size / 2} cy={size / 2} r={r1} fill="none"
        stroke="#222836" strokeWidth={stroke} />
      <circle cx={size / 2} cy={size / 2} r={r1} fill="none"
        stroke="#5a6071" strokeWidth={stroke}
        strokeDasharray={`${monthPct * c1} ${c1}`} strokeLinecap="round" />
      <circle cx={size / 2} cy={size / 2} r={r2} fill="none"
        stroke="#222836" strokeWidth={stroke} />
      <circle cx={size / 2} cy={size / 2} r={r2} fill="none"
        stroke={color} strokeWidth={stroke}
        strokeDasharray={`${spent * c2} ${c2}`} strokeLinecap="round"
        className="[transition:stroke-dasharray_.5s]" />
    </svg>
  )
}
