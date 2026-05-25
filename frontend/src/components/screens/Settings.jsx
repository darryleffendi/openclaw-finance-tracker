import { useState } from "react"
import { Icon } from "../../lib/icons"
import { ICON_BTN_BASE } from "../mobile/MobileHeader"

import BudgetsTab from "./settings/BudgetsTab"
import SubcategoriesTab from "./settings/SubcategoriesTab"
import RecurringTab from "./settings/RecurringTab"

const TABS = ["budgets", "subcategories", "recurring"]

export default function Settings({ accounts, onAccountChange, onBack }) {
  const [tab, setTab] = useState("budgets")
  return (
    <div className="bg-bg text-fg min-h-full">
      <div className="h-[52px] px-4 flex items-center justify-between border-b border-border sticky top-0 bg-bg z-[5]">
        <button onClick={onBack} className={`${ICON_BTN_BASE} bg-transparent`}>
          <Icon.ChevL size={20} color="#e7eaf0" />
        </button>
        <div className="text-[14px] font-medium">Settings</div>
        <div className="w-8" />
      </div>

      <div className="flex border-b border-border px-4">
        {TABS.map((t) => (
          <button
            key={t}
            onClick={() => setTab(t)}
            className={`bg-transparent border-0 py-3 px-3.5 text-[12.5px] font-medium cursor-pointer capitalize border-b-2 ${
              tab === t
                ? "text-fg border-accent"
                : "text-fg-dim border-transparent"
            }`}
          >
            {t}
          </button>
        ))}
      </div>

      <div className="p-4">
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

      <div className="py-5 px-4 border-t border-border mt-6">
        <a
          href="/api/auth/logout"
          className="flex w-full p-3 bg-transparent border border-border rounded-[10px] text-fg-muted text-[13px] cursor-pointer items-center justify-center gap-2 no-underline"
        >
          <Icon.Logout size={14} /> Sign out
        </a>
        <div className="text-center text-[11px] text-fg-dim mt-3">
          rupiah · v2
        </div>
      </div>
    </div>
  )
}
