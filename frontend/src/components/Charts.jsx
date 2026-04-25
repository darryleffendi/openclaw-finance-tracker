import { useState } from "react"
import {
  PieChart, Pie, Cell, Tooltip, ResponsiveContainer, Legend,
  BarChart, Bar, XAxis, YAxis, CartesianGrid,
} from "recharts"

const COLORS = ["#6366f1", "#ec4899", "#f59e0b", "#10b981", "#3b82f6", "#8b5cf6", "#ef4444", "#14b8a6"]
const fmt = (v) => `Rp ${Number(v).toLocaleString("id-ID")}`

function EnvelopeChart({ accounts }) {
  const data = accounts
    .filter((a) => ["expense", "savings"].includes(a.type))
    .map((a) => ({
      name: a.display_name,
      Budget: a.monthly_budget,
      Balance: Math.max(0, a.balance),
      Over: a.balance < 0 ? Math.abs(a.balance) : 0,
    }))

  if (data.length === 0) return <p className="text-sm text-gray-500 text-center py-8">No account data yet.</p>

  return (
    <ResponsiveContainer width="100%" height={260}>
      <BarChart data={data} margin={{ top: 4, right: 8, left: 8, bottom: 60 }}>
        <CartesianGrid strokeDasharray="3 3" stroke="#374151" />
        <XAxis
          dataKey="name"
          tick={{ fill: "#9ca3af", fontSize: 11 }}
          angle={-35}
          textAnchor="end"
          interval={0}
        />
        <YAxis tick={{ fill: "#9ca3af", fontSize: 11 }} tickFormatter={(v) => `${(v / 1_000_000).toFixed(1)}M`} />
        <Tooltip formatter={fmt} contentStyle={{ background: "#1f2937", border: "none", fontSize: 12 }} />
        <Legend wrapperStyle={{ fontSize: 12, paddingTop: 8 }} />
        <Bar dataKey="Budget" fill="#374151" radius={[3, 3, 0, 0]} />
        <Bar dataKey="Balance" radius={[3, 3, 0, 0]}>
          {data.map((entry, i) => (
            <Cell key={i} fill={entry.Over > 0 ? "#ef4444" : "#10b981"} />
          ))}
        </Bar>
      </BarChart>
    </ResponsiveContainer>
  )
}

function PieView({ transactions }) {
  const expenseByCategory = transactions
    .filter((t) => t.type === "expense" && t.note !== "auto-distribution from salary")
    .reduce((acc, t) => {
      acc[t.category] = (acc[t.category] || 0) + t.amount
      return acc
    }, {})

  const data = Object.entries(expenseByCategory).map(([name, value]) => ({ name, value }))

  if (data.length === 0) return <p className="text-sm text-gray-500 text-center py-8">No expenses yet.</p>

  return (
    <ResponsiveContainer width="100%" height={220}>
      <PieChart>
        <Pie data={data} dataKey="value" nameKey="name" cx="50%" cy="50%" outerRadius={80}>
          {data.map((_, i) => (
            <Cell key={i} fill={COLORS[i % COLORS.length]} />
          ))}
        </Pie>
        <Tooltip formatter={fmt} contentStyle={{ background: "#1f2937", border: "none", fontSize: 12 }} />
        <Legend />
      </PieChart>
    </ResponsiveContainer>
  )
}

export default function Charts({ transactions, accounts }) {
  const [tab, setTab] = useState("envelopes")

  const hasAccounts = accounts.some((a) => ["expense", "savings"].includes(a.type))
  const hasExpenses = transactions.some((t) => t.type === "expense" && t.note !== "auto-distribution from salary")

  if (!hasAccounts && !hasExpenses) return null

  return (
    <div className="bg-gray-800 rounded-lg p-4 mb-6">
      <div className="flex gap-3 mb-4">
        <button
          onClick={() => setTab("envelopes")}
          className={`text-sm px-3 py-1 rounded ${tab === "envelopes" ? "bg-indigo-600" : "text-gray-400 hover:text-white"}`}
        >
          Envelopes
        </button>
        <button
          onClick={() => setTab("breakdown")}
          className={`text-sm px-3 py-1 rounded ${tab === "breakdown" ? "bg-indigo-600" : "text-gray-400 hover:text-white"}`}
        >
          Breakdown
        </button>
      </div>

      {tab === "envelopes" && <EnvelopeChart accounts={accounts} />}
      {tab === "breakdown" && <PieView transactions={transactions} />}
    </div>
  )
}
