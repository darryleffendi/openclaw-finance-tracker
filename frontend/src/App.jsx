import { useState } from "react"
import { useDashboardData } from "./lib/dashboardData"
import MobileDashboard from "./components/mobile/MobileDashboard"

const PERIODS = {
  today: "Today",
  "this-week": "This week",
  "this-month": "This month",
  "last-month": "Last month",
  all: "All time",
}

export default function App() {
  const [period] = useState("this-month")
  const data = useDashboardData(period)

  return (
    <MobileDashboard
      data={data}
      periodLabel={PERIODS[period]}
      onPeriodTap={() => {}}
      onSettings={() => {}}
      onAdd={() => {}}
      onAccountTap={() => {}}
      onTxTap={() => {}}
    />
  )
}
