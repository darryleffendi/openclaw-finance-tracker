export const TOKENS = {
  bg: "#0a0d12",
  bgSoft: "#0e1218",
  card: "#141923",
  cardHi: "#1a2030",
  border: "#222836",
  borderHi: "#2a3142",
  fg: "#e7eaf0",
  fgMuted: "#8e95a4",
  fgDim: "#5a6071",
  green: "#34d399",
  amber: "#fbbf24",
  orange: "#fb923c",
  red: "#f87171",
  income: "#34d399",
  savings: "#818cf8",
}

export function accentToVars(hex) {
  return {
    "--accent": hex,
    "--accent-soft": hex + "1f",
    "--accent-glow": hex + "40",
  }
}

export function statusFor(remaining, budget) {
  if (remaining < 0) return TOKENS.red
  const pct = remaining / budget
  if (pct > 0.4) return TOKENS.green
  if (pct > 0.1) return TOKENS.amber
  return TOKENS.orange
}
