export default {
  content: ["./index.html", "./src/**/*.{js,jsx}"],
  theme: {
    extend: {
      colors: {
        bg:            "#0a0d12",
        "bg-soft":     "#0e1218",
        card:          "#141923",
        "card-hi":     "#1a2030",
        border:        "#222836",
        "border-hi":   "#2a3142",
        fg:            "#e7eaf0",
        "fg-muted":    "#8e95a4",
        "fg-dim":      "#5a6071",
        green:         "#34d399",
        amber:         "#fbbf24",
        orange:        "#fb923c",
        red:           "#f87171",
        income:        "#34d399",
        savings:       "#818cf8",
        accent:        "var(--accent)",
        "accent-soft": "var(--accent-soft)",
        "accent-glow": "var(--accent-glow)",
      },
    },
  },
  plugins: [],
}
