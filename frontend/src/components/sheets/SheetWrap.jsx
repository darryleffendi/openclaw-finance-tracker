// Bottom sheet shell — backdrop + rounded top + grabber handle.
// Click outside the sheet to close.
export default function SheetWrap({ onClose, children, maxHeight = "85%" }) {
  return (
    <div
      onClick={onClose}
      className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-end justify-center z-[100]"
    >
      <div
        onClick={(e) => e.stopPropagation()}
        className="w-full max-w-[520px] bg-bg-soft rounded-t-[20px] border-t border-border py-2 pb-6 overflow-auto"
        style={{ maxHeight }}
      >
        <div className="w-9 h-1 bg-border rounded-[2px] mx-auto mt-1.5 mb-[14px]" />
        {children}
      </div>
    </div>
  )
}

export function SheetHeader({ title, onClose, action }) {
  return (
    <div className="flex items-center justify-between px-5 pb-4">
      <button
        onClick={onClose}
        className="bg-transparent border-0 text-fg-muted text-[13px] cursor-pointer p-0"
      >
        Cancel
      </button>
      <div className="text-[14px] font-medium">{title}</div>
      {action || <div className="w-12" />}
    </div>
  )
}

export function SheetActionButton({ label, onClick, disabled }) {
  return (
    <button
      onClick={onClick}
      disabled={disabled}
      className={`border-0 rounded-lg px-3.5 py-1.5 text-[13px] font-medium text-white ${
        disabled ? "bg-border-hi cursor-not-allowed opacity-60" : "bg-accent cursor-pointer"
      }`}
    >
      {label}
    </button>
  )
}

export function FieldLabel({ children }) {
  return (
    <div className="text-[11px] text-fg-dim tracking-[0.05em] uppercase font-medium">
      {children}
    </div>
  )
}
