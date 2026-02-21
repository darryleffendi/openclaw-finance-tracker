export default function TransactionList({ transactions, onDelete }) {
  if (transactions.length === 0) {
    return (
      <div className="bg-gray-800 rounded-lg p-8 text-center text-gray-500">
        No transactions found.
      </div>
    )
  }

  return (
    <div className="bg-gray-800 rounded-lg overflow-hidden">
      <table className="w-full text-sm">
        <thead className="bg-gray-700">
          <tr>
            <th className="text-left p-3">Date</th>
            <th className="text-left p-3">Category</th>
            <th className="text-left p-3">Note</th>
            <th className="text-right p-3">Amount</th>
            <th className="p-3"></th>
          </tr>
        </thead>
        <tbody>
          {transactions.map((t) => (
            <tr key={t.id} className="border-t border-gray-700 hover:bg-gray-750">
              <td className="p-3 text-gray-400">{t.date}</td>
              <td className="p-3">
                <span>{t.category}</span>
                {t.subcategory && (
                  <span className="ml-1 text-xs text-gray-500">/ {t.subcategory}</span>
                )}
              </td>
              <td className="p-3 text-gray-400">{t.note || "—"}</td>
              <td
                className={`p-3 text-right font-mono ${
                  t.type === "income" ? "text-green-400" : "text-red-400"
                }`}
              >
                {t.type === "income" ? "+" : "-"}Rp {t.amount.toLocaleString("id-ID")}
              </td>
              <td className="p-3 text-right">
                <button
                  onClick={() => onDelete(t.id)}
                  className="text-gray-600 hover:text-red-400 text-xs"
                  title="Delete"
                >
                  ×
                </button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}
