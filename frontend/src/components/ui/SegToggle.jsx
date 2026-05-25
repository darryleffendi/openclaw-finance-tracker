export default function SegToggle({ value, onChange, options }) {
  return (
    <div className="flex bg-bg rounded-[10px] p-[3px] border border-border">
      {options.map((o) => (
        <button
          key={o.value}
          onClick={() => onChange(o.value)}
          className={`flex-1 py-2 border-0 rounded-[7px] text-[13px] font-medium cursor-pointer ${
            value === o.value ? "bg-card text-fg" : "bg-transparent text-fg-muted"
          }`}
        >
          {o.label}
        </button>
      ))}
    </div>
  )
}
