import { useState, useEffect } from "react"
import Summary from "./components/Summary"
import TransactionList from "./components/TransactionList"
import Charts from "./components/Charts"
import AddTransaction from "./components/AddTransaction"

const API = "http://localhost:8009/api"

export default function App() {
  const [period, setPeriod] = useState("this-month")
  const [transactions, setTransactions] = useState([])
  const [summary, setSummary] = useState(null)
  const [categories, setCategories] = useState([])
  const [showAdd, setShowAdd] = useState(false)

  const fetchData = () => {
    fetch(`${API}/transactions?period=${period}`)
      .then((r) => r.json())
      .then(setTransactions)
    fetch(`${API}/summary?period=${period}`)
      .then((r) => r.json())
      .then(setSummary)
  }

  useEffect(() => {
    fetchData()
  }, [period])

  useEffect(() => {
    fetch(`${API}/categories`)
      .then((r) => r.json())
      .then(setCategories)
  }, [])

  const handleAdded = () => {
    setShowAdd(false)
    fetchData()
  }

  const handleDelete = (id) => {
    fetch(`${API}/transactions/${id}`, { method: "DELETE" }).then(fetchData)
  }

  const periods = ["today", "this-week", "this-month", "last-month", "all"]

  return (
    <div className="min-h-screen bg-gray-950 text-white p-6">
      <div className="max-w-4xl mx-auto">
        <div className="flex items-center justify-between mb-6">
          <h1 className="text-2xl font-bold">Finance Tracker</h1>
          <button
            onClick={() => setShowAdd(!showAdd)}
            className="px-4 py-2 bg-indigo-600 hover:bg-indigo-500 rounded text-sm font-medium"
          >
            {showAdd ? "Cancel" : "+ Add Transaction"}
          </button>
        </div>

        {showAdd && (
          <AddTransaction categories={categories} onAdded={handleAdded} />
        )}

        <div className="flex gap-2 mb-6 flex-wrap">
          {periods.map((p) => (
            <button
              key={p}
              onClick={() => setPeriod(p)}
              className={`px-3 py-1 rounded text-sm ${
                period === p ? "bg-indigo-600" : "bg-gray-800 hover:bg-gray-700"
              }`}
            >
              {p}
            </button>
          ))}
        </div>

        {summary && <Summary data={summary} />}
        {transactions.length > 0 && <Charts transactions={transactions} />}
        <TransactionList transactions={transactions} onDelete={handleDelete} />
      </div>
    </div>
  )
}
