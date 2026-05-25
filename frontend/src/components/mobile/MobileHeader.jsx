import { Icon } from "../../lib/icons"

export const HEADER_HEIGHT = 52
export const ICON_BTN_BASE = "w-8 h-8 rounded-lg border-0 cursor-pointer flex items-center justify-center"

export default function MobileHeader({
  periodLabel,
  onPeriodTap,
  onSettings,
  onAdd,
}) {
  return (
    <div className="h-[52px] px-4 flex items-center justify-between border-b border-border bg-bg sticky top-0 z-[5]">
      <div className="text-[13px] font-semibold tracking-[0.02em] text-fg-muted">
        rupiah<span className="text-accent">.</span>
      </div>
      <button
        onClick={onPeriodTap}
        className="border-0 bg-transparent text-fg text-[14px] font-medium py-1.5 px-2.5 rounded-lg flex items-center gap-1 cursor-pointer"
      >
        <Icon.ChevL size={16} color="#8e95a4" />
        <span className="min-w-[76px] text-center">{periodLabel}</span>
        <Icon.ChevR size={16} color="#8e95a4" />
      </button>
      <div className="flex gap-1">
        <button onClick={onSettings} className={`${ICON_BTN_BASE} bg-transparent`}>
          <Icon.Settings size={18} color="#8e95a4" />
        </button>
        <button onClick={onAdd} className={`${ICON_BTN_BASE} bg-accent-soft`}>
          <Icon.Plus size={18} color="var(--accent)" />
        </button>
      </div>
    </div>
  )
}
