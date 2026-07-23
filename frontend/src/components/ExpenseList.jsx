import { formatMoney, formatSignedMoney } from '../currencies'
import { isSpend } from '../categories'

function formatDate(isoString) {
  return new Date(isoString).toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
    timeZone: 'UTC',
  })
}

function localTodayISO() {
  const now = new Date()
  const month = String(now.getMonth() + 1).padStart(2, '0')
  const day = String(now.getDate()).padStart(2, '0')
  return `${now.getFullYear()}-${month}-${day}`
}

function isFutureDate(isoString) {
  return isoString.slice(0, 10) > localTodayISO()
}

function ExpenseList({ expenses, baseCurrency, onDelete, anomalyIds, recurringIds }) {
  if (expenses.length === 0) {
    return (
      <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-6 text-center text-slate-500">
        No expenses yet. Add your first one above.
      </div>
    )
  }

  const total = expenses.reduce(
    (sum, expense) =>
      isSpend(expense) && typeof expense.convertedAmount === 'number'
        ? sum + expense.convertedAmount
        : sum,
    0
  )

  function handleDeleteClick(expense) {
    const label = `${expense.category} — ${formatMoney(expense.amount, expense.currency)}`
    if (window.confirm(`Delete this expense?\n\n${label}`)) {
      onDelete(expense._id)
    }
  }

  return (
    <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
      <div className="px-6 py-4 border-b border-slate-200 flex items-center justify-between">
        <h2 className="text-lg font-medium text-ink">History</h2>
        <span className="text-sm text-slate-500">
          Total:{' '}
          <span className="font-semibold text-ink">{formatMoney(total, baseCurrency)}</span>
        </span>
      </div>
      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="text-left text-slate-500 border-b border-slate-200">
              <th className="px-6 py-3 font-medium">Date</th>
              <th className="px-6 py-3 font-medium">Category</th>
              <th className="px-6 py-3 font-medium">Note</th>
              <th className="px-6 py-3 font-medium text-right">Amount</th>
              <th className="px-6 py-3"></th>
            </tr>
          </thead>
          <tbody>
            {expenses.map((expense) => (
              <tr key={expense._id} className="border-b border-slate-100 last:border-0">
                <td className="px-6 py-3 text-slate-600 whitespace-nowrap">
                  {formatDate(expense.date)}
                  {isFutureDate(expense.date) && (
                    <span
                      title="This expense is dated in the future"
                      className="ml-2 inline-block rounded-full bg-amber-100 text-amber-700 px-2 py-0.5 text-xs font-medium"
                    >
                      Future
                    </span>
                  )}
                </td>
                <td className="px-6 py-3">
                  <span className="inline-block rounded-full bg-brand-50 text-brand-700 px-2.5 py-0.5 text-xs font-medium">
                    {expense.category}
                  </span>
                  {expense.source === 'plaid' && (
                    <span
                      title="Imported from a linked bank account"
                      className="ml-2 inline-block rounded-full bg-emerald-100 text-emerald-700 px-2 py-0.5 text-xs font-medium"
                    >
                      Bank
                    </span>
                  )}
                  {anomalyIds?.has(expense._id) && (
                    <span
                      title="Unusually high for this category"
                      className="ml-2 inline-block rounded-full bg-red-100 text-red-700 px-2 py-0.5 text-xs font-medium"
                    >
                      Unusual
                    </span>
                  )}
                  {recurringIds?.has(expense._id) && (
                    <span
                      title="Part of a detected recurring series"
                      className="ml-2 inline-block rounded-full bg-slate-100 text-slate-600 px-2 py-0.5 text-xs font-medium"
                    >
                      ↻ Recurring
                    </span>
                  )}
                </td>
                <td className="px-6 py-3 text-slate-500">
                  {expense.merchant ?? expense.note ?? ''}
                </td>
                <td className="px-6 py-3 text-right whitespace-nowrap">
                  <div
                    className={`font-medium ${
                      expense.type === 'income' ? 'text-emerald-600' : 'text-ink'
                    }`}
                  >
                    {formatSignedMoney(expense.amount, expense.currency, expense.type)}
                  </div>
                  {expense.currency !== baseCurrency && (
                    <div className="text-xs text-slate-400">
                      {typeof expense.convertedAmount === 'number'
                        ? `≈ ${formatSignedMoney(expense.convertedAmount, baseCurrency, expense.type)}`
                        : 'no rate'}
                    </div>
                  )}
                </td>
                <td className="px-6 py-3 text-right">
                  <button
                    type="button"
                    onClick={() => handleDeleteClick(expense)}
                    aria-label="Delete expense"
                    className="text-slate-400 hover:text-red-600"
                  >
                    ✕
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  )
}

export default ExpenseList
