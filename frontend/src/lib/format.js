export function formatIDR(n, { signed = false } = {}) {
  const neg = n < 0
  const abs = Math.abs(Math.round(n))
  const s = abs.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ".")
  if (neg) return "−Rp " + s
  return (signed ? "+Rp " : "Rp ") + s
}

export function formatIDRShort(n) {
  const abs = Math.abs(n)
  if (abs >= 1_000_000)
    return (
      (n / 1_000_000).toFixed(abs >= 10_000_000 ? 0 : 1).replace(".", ",") + "jt"
    )
  if (abs >= 1000) return Math.round(n / 1000) + "rb"
  return String(n)
}

export function ymdToday() {
  const d = new Date()
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`
}

export function currentYearMonth() {
  const d = new Date()
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`
}

export function daysInMonth(year, month) {
  return new Date(year, month, 0).getDate()
}

export function formatLongDate(ymd) {
  const [y, m, d] = ymd.split("-").map(Number)
  const date = new Date(y, m - 1, d)
  const dow = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"][date.getDay()]
  const mon = [
    "Jan",
    "Feb",
    "Mar",
    "Apr",
    "May",
    "Jun",
    "Jul",
    "Aug",
    "Sep",
    "Oct",
    "Nov",
    "Dec",
  ][m - 1]
  return `${dow} ${d} ${mon}`
}
