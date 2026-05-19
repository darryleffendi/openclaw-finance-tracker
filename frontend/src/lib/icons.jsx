function iconBase({ size = 18, color = "currentColor", stroke = 1.6, style } = {}) {
  return {
    width: size,
    height: size,
    viewBox: "0 0 24 24",
    fill: "none",
    stroke: color,
    strokeWidth: stroke,
    strokeLinecap: "round",
    strokeLinejoin: "round",
    style,
  }
}

export const Icon = {
  Plus: (p) => (
    <svg {...iconBase(p)}>
      <path d="M12 5v14M5 12h14" />
    </svg>
  ),
  Settings: (p) => (
    <svg {...iconBase(p)}>
      <circle cx="12" cy="12" r="3" />
      <path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 1 1-2.83 2.83l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 1 1-4 0v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 1 1-2.83-2.83l.06-.06a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0-1.51-1H3a2 2 0 1 1 0-4h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 1 1 2.83-2.83l.06.06a1.65 1.65 0 0 0 1.82.33H9a1.65 1.65 0 0 0 1-1.51V3a2 2 0 1 1 4 0v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 1 1 2.83 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82V9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 1 1 0 4h-.09a1.65 1.65 0 0 0-1.51 1z" />
    </svg>
  ),
  ChevL: (p) => (
    <svg {...iconBase(p)}>
      <path d="M15 18l-6-6 6-6" />
    </svg>
  ),
  ChevR: (p) => (
    <svg {...iconBase(p)}>
      <path d="M9 18l6-6-6-6" />
    </svg>
  ),
  ChevD: (p) => (
    <svg {...iconBase(p)}>
      <path d="M6 9l6 6 6-6" />
    </svg>
  ),
  ChevU: (p) => (
    <svg {...iconBase(p)}>
      <path d="M18 15l-6-6-6 6" />
    </svg>
  ),
  Repeat: (p) => (
    <svg {...iconBase(p)}>
      <path d="M17 1l4 4-4 4" />
      <path d="M3 11V9a4 4 0 0 1 4-4h14" />
      <path d="M7 23l-4-4 4-4" />
      <path d="M21 13v2a4 4 0 0 1-4 4H3" />
    </svg>
  ),
  Trend: (p) => (
    <svg {...iconBase(p)}>
      <path d="M3 17l6-6 4 4 8-8" />
      <path d="M14 7h7v7" />
    </svg>
  ),
  Coin: (p) => (
    <svg {...iconBase(p)}>
      <circle cx="12" cy="12" r="9" />
      <path d="M9 9h4.5a2 2 0 0 1 0 4H9m0 0h5a2.5 2.5 0 0 1 0 5H9V7" />
    </svg>
  ),
  Cart: (p) => (
    <svg {...iconBase(p)}>
      <circle cx="9" cy="20" r="1.5" />
      <circle cx="18" cy="20" r="1.5" />
      <path d="M2 3h3l3 12h13l2-9H6" />
    </svg>
  ),
  Car: (p) => (
    <svg {...iconBase(p)}>
      <path d="M5 17h14M5 17v-5l2-5h10l2 5v5M5 17v2h2v-2M19 17v2h-2v-2" />
      <circle cx="8" cy="13" r="1" />
      <circle cx="16" cy="13" r="1" />
    </svg>
  ),
  Heart: (p) => (
    <svg {...iconBase(p)}>
      <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z" />
    </svg>
  ),
  Music: (p) => (
    <svg {...iconBase(p)}>
      <path d="M9 18V5l12-2v13" />
      <circle cx="6" cy="18" r="3" />
      <circle cx="18" cy="16" r="3" />
    </svg>
  ),
  Home: (p) => (
    <svg {...iconBase(p)}>
      <path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2h-4v-7h-6v7H5a2 2 0 0 1-2-2z" />
    </svg>
  ),
  Pig: (p) => (
    <svg {...iconBase(p)}>
      <path d="M21 11h-1.5a2 2 0 0 0-2-2H17l-1-2.5-2 .5L13 5l-3 .5L9 9H7a4 4 0 0 0-4 4v3a2 2 0 0 0 2 2h1v2h2v-2h6v2h2v-2h1a3 3 0 0 0 3-3v-1h1z" />
    </svg>
  ),
  Trend2: (p) => (
    <svg {...iconBase(p)}>
      <path d="M3 12h4l3-7 4 14 3-7h4" />
    </svg>
  ),
  Trash: (p) => (
    <svg {...iconBase(p)}>
      <path d="M3 6h18M8 6V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2M5 6l1 14a2 2 0 0 0 2 2h8a2 2 0 0 0 2-2l1-14" />
    </svg>
  ),
  Pencil: (p) => (
    <svg {...iconBase(p)}>
      <path d="M17 3a2.828 2.828 0 0 1 4 4L7.5 20.5 2 22l1.5-5.5z" />
    </svg>
  ),
  X: (p) => (
    <svg {...iconBase(p)}>
      <path d="M18 6L6 18M6 6l12 12" />
    </svg>
  ),
  Search: (p) => (
    <svg {...iconBase(p)}>
      <circle cx="11" cy="11" r="7" />
      <path d="M21 21l-4.35-4.35" />
    </svg>
  ),
  Calendar: (p) => (
    <svg {...iconBase(p)}>
      <rect x="3" y="5" width="18" height="16" rx="2" />
      <path d="M16 3v4M8 3v4M3 10h18" />
    </svg>
  ),
  Google: (p) => (
    <svg {...{ ...iconBase(p), fill: "currentColor", stroke: "none" }}>
      <path
        d="M21.35 11.1H12v3.9h5.35a4.6 4.6 0 0 1-2 3v2.5h3.2c1.9-1.7 3-4.3 3-7.4 0-.7-.05-1.4-.2-2z"
        fill="#4285F4"
      />
      <path
        d="M12 22c2.7 0 5-.9 6.55-2.5l-3.2-2.5c-.9.6-2 1-3.35 1a5.85 5.85 0 0 1-5.5-4H3.2v2.55A9.99 9.99 0 0 0 12 22z"
        fill="#34A853"
      />
      <path
        d="M6.5 13.95a6 6 0 0 1 0-3.9V7.5H3.2a10 10 0 0 0 0 9z"
        fill="#FBBC05"
      />
      <path
        d="M12 6.05c1.45 0 2.75.5 3.8 1.5l2.85-2.85A9.95 9.95 0 0 0 12 2 9.99 9.99 0 0 0 3.2 7.5L6.5 10a5.85 5.85 0 0 1 5.5-3.95z"
        fill="#EA4335"
      />
    </svg>
  ),
  Sparkle: (p) => (
    <svg {...iconBase(p)}>
      <path d="M12 3v4M12 17v4M3 12h4M17 12h4M5.6 5.6l2.8 2.8M15.6 15.6l2.8 2.8M5.6 18.4l2.8-2.8M15.6 8.4l2.8-2.8" />
    </svg>
  ),
  Logout: (p) => (
    <svg {...iconBase(p)}>
      <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4M16 17l5-5-5-5M21 12H9" />
    </svg>
  ),
  Fork: (p) => (
    <svg {...iconBase(p)}>
      <path d="M4 3v18M4 12h4M8 3v9a3 3 0 0 1-4 0M16 3c-2 0-3 2-3 4s1 4 3 4v10" />
    </svg>
  ),
}

export const ACCOUNT_ICON = {
  salary: Icon.Coin,
  freelance: Icon.Trend,
  fixed: Icon.Home,
  food: Icon.Fork,
  groceries: Icon.Cart,
  transport: Icon.Car,
  wellness: Icon.Heart,
  entertainment: Icon.Music,
  savings: Icon.Pig,
  investments: Icon.Trend2,
}
