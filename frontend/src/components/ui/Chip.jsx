export default function Chip({ active, onClick, children }) {
  return (
    <button
      onClick={onClick}
      className={`rounded-full px-3 py-1.5 text-[12.5px] font-medium cursor-pointer whitespace-nowrap tracking-[-0.01em] border-0 ${
        active
          ? "bg-accent-soft text-accent"
          : "bg-transparent text-fg-muted shadow-[inset_0_0_0_1px_theme(colors.border)]"
      }`}
    >
      {children}
    </button>
  )
}
