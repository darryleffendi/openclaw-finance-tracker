import { useMemo, useState } from "react"
import { useDashboardData, bucketsBySlug, spentForAccount } from "./lib/dashboardData"
import MobileDashboard from "./components/mobile/MobileDashboard"
import CategoryDetail from "./components/screens/CategoryDetail"
import Settings from "./components/screens/Settings"
import AddTransactionSheet from "./components/sheets/AddTransactionSheet"
import EditTransactionSheet from "./components/sheets/EditTransactionSheet"
import PeriodPicker from "./components/sheets/PeriodPicker"

const PERIODS = {
  today: "Today",
  "this-week": "This week",
  "this-month": "This month",
  "last-month": "Last month",
  all: "All time",
}

export default function App() {
  const [period, setPeriod] = useState("this-month")
  const [screen, setScreen] = useState({ name: "home" })
  const [sheet, setSheet] = useState(null) // {kind:'add'} | {kind:'edit', tx} | null
  const data = useDashboardData(period)

  const bucketMap = useMemo(() => bucketsBySlug(data.buckets), [data.buckets])

  const ymd = data.today?.date || ""
  const day = Number(ymd.split("-")[2]) || 1
  const totalDays = day + (data.today?.days_remaining ?? 1) - 1

  const onTxTap = (tx) => setSheet({ kind: "edit", tx })

  let content
  if (screen.name === "settings") {
    content = (
      <Settings
        accounts={data.accounts}
        onAccountChange={() => data.refresh()}
        onBack={() => setScreen({ name: "home" })}
      />
    )
  } else if (screen.name === "category" && data.accounts) {
    const account = data.accounts.find((a) => a.slug === screen.slug)
    if (account) {
      content = (
        <CategoryDetail
          account={account}
          spent={spentForAccount(account, bucketMap[account.slug])}
          dayOfMonth={day}
          daysInMonth={totalDays}
          onBack={() => setScreen({ name: "home" })}
          onTxTap={onTxTap}
        />
      )
    }
  }

  if (!content) {
    content = (
      <MobileDashboard
        data={data}
        periodLabel={PERIODS[period]}
        onPeriodTap={() => setSheet({ kind: "period" })}
        onSettings={() => setScreen({ name: "settings" })}
        onAdd={() => setSheet({ kind: "add" })}
        onAccountTap={(slug) => setScreen({ name: "category", slug })}
        onTxTap={onTxTap}
      />
    )
  }

  return (
    <>
      {content}
      {sheet?.kind === "add" && (
        <AddTransactionSheet
          accounts={data.accounts}
          onClose={() => setSheet(null)}
          onAdded={() => data.refresh()}
        />
      )}
      {sheet?.kind === "edit" && (
        <EditTransactionSheet
          tx={sheet.tx}
          accounts={data.accounts}
          onClose={() => setSheet(null)}
          onSaved={() => data.refresh()}
        />
      )}
      {sheet?.kind === "period" && (
        <PeriodPicker
          period={period}
          onPick={setPeriod}
          onClose={() => setSheet(null)}
        />
      )}
    </>
  )
}
