export default function Card({ style, className = "", children, padding = 16, ...rest }) {
  return (
    <div
      {...rest}
      className={`bg-card border border-border rounded-2xl transition-colors duration-150 ${className}`}
      style={{ padding, ...style }}
    >
      {children}
    </div>
  )
}
