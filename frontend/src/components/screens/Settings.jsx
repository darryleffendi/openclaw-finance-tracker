import { useState } from "react"
import { TOKENS } from "../../lib/tokens"
import { Icon } from "../../lib/icons"
import { iconBtnStyle } from "../mobile/MobileHeader"

import BudgetsTab from "./settings/BudgetsTab"
import SubcategoriesTab from "./settings/SubcategoriesTab"
import RecurringTab from "./settings/RecurringTab"

const TABS = ["budgets", "subcategories", "recurring"]

export default function Settings({ accounts, onAccountChange, onBack }) {
  const [tab, setTab] = useState("budgets")
  return (
    <div style={{ background: TOKENS.bg, color: TOKENS.fg, minHeight: "100%" }}>
      <div
        style={{
          height: 52,
          padding: "0 16px",
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          borderBottom: `1px solid ${TOKENS.border}`,
          position: "sticky",
          top: 0,
          background: TOKENS.bg,
          zIndex: 5,
        }}
      >
        <button onClick={onBack} style={iconBtnStyle()}>
          <Icon.ChevL size={20} color={TOKENS.fg} />
        </button>
        <div style={{ fontSize: 14, fontWeight: 500 }}>Settings</div>
        <div style={{ width: 32 }} />
      </div>

      <div
        style={{
          display: "flex",
          borderBottom: `1px solid ${TOKENS.border}`,
          padding: "0 16px",
        }}
      >
        {TABS.map((t) => (
          <button
            key={t}
            onClick={() => setTab(t)}
            style={{
              background: "transparent",
              border: "none",
              padding: "12px 14px",
              fontSize: 12.5,
              fontWeight: 500,
              cursor: "pointer",
              color: tab === t ? TOKENS.fg : TOKENS.fgDim,
              borderBottom: `2px solid ${tab === t ? "var(--accent)" : "transparent"}`,
              textTransform: "capitalize",
              fontFamily: "inherit",
            }}
          >
            {t}
          </button>
        ))}
      </div>

      <div style={{ padding: 16 }}>
        {tab === "budgets" && (
          <BudgetsTab accounts={accounts} onAccountChange={onAccountChange} />
        )}
        {tab === "subcategories" && (
          <SubcategoriesTab
            accounts={accounts}
            onAccountChange={onAccountChange}
          />
        )}
        {tab === "recurring" && <RecurringTab accounts={accounts} />}
      </div>

      <div
        style={{
          padding: "20px 16px",
          borderTop: `1px solid ${TOKENS.border}`,
          marginTop: 24,
        }}
      >
        <a
          href="/api/auth/logout"
          style={{
            display: "flex",
            width: "100%",
            padding: 12,
            background: "transparent",
            border: `1px solid ${TOKENS.border}`,
            borderRadius: 10,
            color: TOKENS.fgMuted,
            fontSize: 13,
            cursor: "pointer",
            alignItems: "center",
            justifyContent: "center",
            gap: 8,
            textDecoration: "none",
          }}
        >
          <Icon.Logout size={14} /> Sign out
        </a>
        <div
          style={{
            textAlign: "center",
            fontSize: 11,
            color: TOKENS.fgDim,
            marginTop: 12,
          }}
        >
          rupiah · v2
        </div>
      </div>
    </div>
  )
}
