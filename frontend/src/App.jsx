import { useMemo, useState } from "react"
import { useDashboardData, bucketsBySlug, spentForAccount } from "./lib/dashboardData"
import MobileDashboard from "./components/mobile/MobileDashboard"
import CategoryDetail from "./components/screens/CategoryDetail"
import AddTransactionSheet from "./components/sheets/AddTransactionSheet"

const PERIODS = {
  today: "Today",
  "this-week": "This week",
  "this-month": "This month",
  "last-month": "Last month",
  all: "All time",
}

export default function App() {
  const [period] = useState("this-month")
  const [screen, setScreen] = useState({ name: "home" })
  const [sheet, setSheet] = useState(null) // 'add' | null
  const data = useDashboardData(period)

  const bucketMap = useMemo(() => bucketsBySlug(data.buckets), [data.buckets])

  const ymd = data.today?.date || ""
  const day = Number(ymd.split("-")[2]) || 1
  const totalDays = day + (data.today?.days_remaining ?? 1) - 1

  let content
  if (screen.name === "category" && data.accounts) {
    const account = data.accounts.find((a) => a.slug === screen.slug)
    if (account) {
      content = (
        <CategoryDetail
          account={account}
          spent={spentForAccount(account, bucketMap[account.slug])}
          dayOfMonth={day}
          daysInMonth={totalDays}
          onBack={() => setScreen({ name: "home" })}
        />
      )
    }
  }

  if (!content) {
    content = (
      <MobileDashboard
        data={data}
        periodLabel={PERIODS[period]}
        onPeriodTap={() => {}}
        onSettings={() => {}}
        onAdd={() => setSheet("add")}
        onAccountTap={(slug) => setScreen({ name: "category", slug })}
        onTxTap={() => {}}
      />
    )
  }

  return (
    <>
      {content}
      {sheet === "add" && (
        <AddTransactionSheet
          accounts={data.accounts}
          onClose={() => setSheet(null)}
          onAdded={() => data.refresh()}
        />
      )}
    </>
  )
}
