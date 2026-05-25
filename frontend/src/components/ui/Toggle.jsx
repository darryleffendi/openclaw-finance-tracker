export default function Toggle({ on, onClick }) {
  return (
    <button
      onClick={onClick}
      className={`w-[30px] h-[18px] rounded-[9px] relative transition-colors duration-150 shrink-0 border-0 p-0 ${on ? "bg-accent" : "bg-border-hi"} ${onClick ? "cursor-pointer" : "cursor-default"}`}
    >
      <div
        className="absolute top-0.5 w-3.5 h-3.5 rounded-[7px] bg-white transition-[left] duration-150"
        style={{ left: on ? 14 : 2 }}
      />
    </button>
  )
}
