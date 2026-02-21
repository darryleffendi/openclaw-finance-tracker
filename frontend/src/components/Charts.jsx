import { PieChart, Pie, Cell, Tooltip, ResponsiveContainer, Legend } from "recharts"

const COLORS = ["#6366f1", "#ec4899", "#f59e0b", "#10b981", "#3b82f6", "#8b5cf6", "#ef4444", "#14b8a6"]

export default function Charts({ transactions }) {
  const expenseByCategory = transactions
    .filter((t) => t.type === "expense")
    .reduce((acc, t) => {
      acc[t.category] = (acc[t.category] || 0) + t.amount
      return acc
    }, {})

  const data = Object.entries(expenseByCategory).map(([name, value]) => ({ name, value }))

  if (data.length === 0) return null

  return (
    <div className="bg-gray-800 rounded-lg p-4 mb-6">
      <p className="text-sm text-gray-400 mb-3">Expenses by Category</p>
      <ResponsiveContainer width="100%" height={220}>
        <PieChart>
          <Pie data={data} dataKey="value" nameKey="name" cx="50%" cy="50%" outerRadius={80}>
            {data.map((_, i) => (
              <Cell key={i} fill={COLORS[i % COLORS.length]} />
            ))}
          </Pie>
          <Tooltip formatter={(v) => `Rp ${v.toLocaleString("id-ID")}`} />
          <Legend />
        </PieChart>
      </ResponsiveContainer>
    </div>
  )
}
