export default function Summary({ data }) {
  const fmt = (n) => `Rp ${n.toLocaleString("id-ID")}`

  return (
    <div className="grid grid-cols-3 gap-4 mb-6">
      <div className="bg-gray-800 rounded-lg p-4">
        <p className="text-sm text-gray-400">Income</p>
        <p className="text-xl font-bold text-green-400">{fmt(data.income)}</p>
      </div>
      <div className="bg-gray-800 rounded-lg p-4">
        <p className="text-sm text-gray-400">Expense</p>
        <p className="text-xl font-bold text-red-400">{fmt(data.expense)}</p>
      </div>
      <div className="bg-gray-800 rounded-lg p-4">
        <p className="text-sm text-gray-400">Balance</p>
        <p className={`text-xl font-bold ${data.balance >= 0 ? "text-blue-400" : "text-red-400"}`}>
          {fmt(data.balance)}
        </p>
        <p className="text-xs text-gray-500 mt-1">{data.transaction_count} transactions</p>
      </div>
    </div>
  )
}
