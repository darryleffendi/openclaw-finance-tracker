import SheetWrap from "./SheetWrap"

const PRESETS = [
  { value: "today", label: "Today", hint: "Just today" },
  { value: "this-week", label: "This week", hint: "Mon–Sun" },
  { value: "this-month", label: "This month", hint: "Current month" },
  { value: "last-month", label: "Last month", hint: "Previous month" },
  { value: "all", label: "All time", hint: "Every transaction" },
]

export default function PeriodPicker({ period, onPick, onClose }) {
  return (
    <SheetWrap onClose={onClose} maxHeight="60%">
      <div className="px-5 pb-1">
        <div className="text-[14px] font-medium mb-[14px] text-center">Period</div>
        <div className="flex flex-col gap-1.5">
          {PRESETS.map((p) => {
            const active = p.value === period
            return (
              <button
                key={p.value}
                onClick={() => {
                  onPick(p.value)
                  onClose()
                }}
                className={`flex items-center justify-between py-3.5 px-4 rounded-xl cursor-pointer text-left border ${
                  active
                    ? "bg-accent-soft border-accent-glow"
                    : "bg-card border-border"
                }`}
              >
                <div>
                  <div className={`text-[14px] font-medium ${active ? "text-accent" : "text-fg"}`}>
                    {p.label}
                  </div>
                  <div className="text-[11.5px] text-fg-dim mt-0.5">{p.hint}</div>
                </div>
                {active && (
                  <span className="w-2 h-2 rounded-full bg-accent shrink-0" />
                )}
              </button>
            )
          })}
        </div>
      </div>
    </SheetWrap>
  )
}
