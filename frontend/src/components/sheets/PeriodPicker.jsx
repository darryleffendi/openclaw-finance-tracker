import { useState } from "react"
import { Icon } from "../../lib/icons"
import { daysInMonth } from "../../lib/format"
import {
  toYmd,
  fromYmd,
  makeDate,
  makeWeek,
  makeMonth,
  makeRange,
  presetToday,
  presetThisMonth,
  presetAllTime,
} from "../../lib/period"
import SheetWrap from "./SheetWrap"

const MONTH_NAMES = [
  "January", "February", "March", "April", "May", "June",
  "July", "August", "September", "October", "November", "December",
]
const WEEKDAYS = ["Mo", "Tu", "We", "Th", "Fr", "Sa", "Su"]
const MODES = [
  { value: "date", label: "Date" },
  { value: "week", label: "Week" },
  { value: "month", label: "Month" },
  { value: "range", label: "Range" },
]

const HINTS = {
  date: "Tap a day",
  week: "Tap any day to pick its week (Mon–Sun)",
  month: "Tap any day to pick the whole month",
  range: "Tap a start day, then an end day",
}

export default function PeriodPicker({ period, onPick, onClose }) {
  const initial = period?.start ? fromYmd(period.start) : new Date()
  const [view, setView] = useState({ year: initial.getFullYear(), month: initial.getMonth() })
  const [mode, setMode] = useState(period?.mode && period.mode !== "all" ? period.mode : "date")
  const [rangeStart, setRangeStart] = useState(null) // pending first click in range mode

  const todayYmd = toYmd(new Date())

  const commit = (p) => {
    onPick(p)
    onClose()
  }

  const shiftMonth = (delta) => {
    setView((v) => {
      const d = new Date(v.year, v.month + delta, 1)
      return { year: d.getFullYear(), month: d.getMonth() }
    })
  }

  const onDayClick = (ymd) => {
    if (mode === "date") return commit(makeDate(ymd))
    if (mode === "week") return commit(makeWeek(ymd))
    if (mode === "month") return commit(makeMonth(view.year, view.month))
    // range
    if (!rangeStart) {
      setRangeStart(ymd)
    } else {
      commit(makeRange(rangeStart, ymd))
    }
  }

  // Build the day grid (Monday-based), with leading blanks.
  const totalDays = daysInMonth(view.year, view.month + 1)
  const firstDow = (new Date(view.year, view.month, 1).getDay() + 6) % 7
  const cells = [
    ...Array(firstDow).fill(null),
    ...Array.from({ length: totalDays }, (_, i) => i + 1),
  ]

  const inActiveRange = (ymd) =>
    period?.start && period?.end && ymd >= period.start && ymd <= period.end

  return (
    <SheetWrap onClose={onClose} maxHeight="80%">
      <div className="px-5 pb-1">
        <div className="text-[14px] font-medium mb-3 text-center">Period</div>

        {/* Quick buttons */}
        <div className="flex gap-1.5 mb-3">
          <QuickButton label="Today" onClick={() => commit(presetToday())} />
          <QuickButton label="This month" onClick={() => commit(presetThisMonth())} />
        </div>

        {/* Mode selector */}
        <div className="flex gap-1 p-1 bg-card border border-border rounded-xl mb-3">
          {MODES.map((m) => (
            <button
              key={m.value}
              onClick={() => {
                setMode(m.value)
                setRangeStart(null)
              }}
              className={`flex-1 py-1.5 rounded-lg text-[12.5px] font-medium cursor-pointer border-0 ${
                mode === m.value ? "bg-accent text-white" : "bg-transparent text-fg-muted"
              }`}
            >
              {m.label}
            </button>
          ))}
        </div>

        {/* Calendar header */}
        <div className="flex items-center justify-between mb-2">
          <IconButton onClick={() => shiftMonth(-1)}>
            <Icon.ChevL size={18} color="#8e95a4" />
          </IconButton>
          <div className="text-[13.5px] font-medium">
            {MONTH_NAMES[view.month]} {view.year}
          </div>
          <IconButton onClick={() => shiftMonth(1)}>
            <Icon.ChevR size={18} color="#8e95a4" />
          </IconButton>
        </div>

        {/* Weekday row */}
        <div className="grid grid-cols-7 mb-1">
          {WEEKDAYS.map((w) => (
            <div key={w} className="text-center text-[10.5px] text-fg-dim font-medium py-1">
              {w}
            </div>
          ))}
        </div>

        {/* Day grid */}
        <div className="grid grid-cols-7 gap-0.5">
          {cells.map((day, i) => {
            if (day === null) return <div key={`b${i}`} />
            const ymd = `${view.year}-${String(view.month + 1).padStart(2, "0")}-${String(day).padStart(2, "0")}`
            const isToday = ymd === todayYmd
            const isPendingStart = ymd === rangeStart
            const active = isPendingStart || inActiveRange(ymd)
            return (
              <button
                key={ymd}
                onClick={() => onDayClick(ymd)}
                className={`aspect-square flex items-center justify-center text-[12.5px] rounded-lg cursor-pointer border ${
                  active
                    ? "bg-accent text-white border-accent"
                    : "bg-transparent text-fg border-transparent hover:border-border"
                } ${isToday && !active ? "text-accent font-semibold" : ""}`}
              >
                {day}
              </button>
            )
          })}
        </div>

        <div className="text-[11.5px] text-fg-dim text-center mt-3 min-h-[16px]">
          {mode === "range" && rangeStart
            ? `Start ${rangeStart} — tap end day`
            : HINTS[mode]}
        </div>

        <button
          onClick={() => commit(presetAllTime())}
          className="w-full mt-2 py-2.5 rounded-xl bg-card border border-border text-fg-muted text-[13px] font-medium cursor-pointer"
        >
          All time
        </button>
      </div>
    </SheetWrap>
  )
}

function QuickButton({ label, onClick }) {
  return (
    <button
      onClick={onClick}
      className="flex-1 py-2 rounded-xl bg-card border border-border text-fg text-[13px] font-medium cursor-pointer"
    >
      {label}
    </button>
  )
}

function IconButton({ onClick, children }) {
  return (
    <button
      onClick={onClick}
      className="w-8 h-8 flex items-center justify-center rounded-lg bg-card border border-border cursor-pointer"
    >
      {children}
    </button>
  )
}
