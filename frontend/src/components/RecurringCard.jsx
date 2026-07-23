import { formatMoney } from '../currencies'

const MONTHLY_FACTORS = { weekly: 4.33, biweekly: 2.17, monthly: 1, yearly: 1 / 12 }

function monthlyFactor(cadence) {
  if (cadence in MONTHLY_FACTORS) return MONTHLY_FACTORS[cadence]
  const match = cadence.match(/~(\d+) days/)
  return match ? 30.44 / Number(match[1]) : 1
}

function formatNextDate(isoDate) {
  return new Date(`${isoDate}T00:00:00Z`).toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    timeZone: 'UTC',
  })
}

const WARM_UP_NOTE = 'New subscriptions can take a few months of history before they\'re detected.'

function RecurringCard({ recurring, baseCurrency }) {
  if (!recurring || recurring.status === 'unavailable') {
    return (
      <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-6 text-sm text-slate-400">
        Recurring expense detection is unavailable right now.
        <p className="text-xs text-slate-300 mt-2">{WARM_UP_NOTE}</p>
      </div>
    )
  }

  const series = recurring.status === 'ok' ? recurring.series : []

  if (series.length === 0) {
    return (
      <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-6">
        <h2 className="text-lg font-medium text-ink mb-2">Recurring</h2>
        <p className="text-sm text-slate-500">No recurring expenses detected yet.</p>
        <p className="text-xs text-slate-400 mt-2">{WARM_UP_NOTE}</p>
      </div>
    )
  }

  const monthlyTotal = series.reduce(
    (sum, entry) => sum + entry.typical_amount * monthlyFactor(entry.cadence),
    0
  )

  return (
    <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-6">
      <h2 className="text-lg font-medium text-ink mb-4">Recurring</h2>
      <ul className="space-y-2">
        {series.map((entry) => (
          <li key={entry.name} className="flex items-center gap-3 text-sm">
            <span className="text-ink font-medium truncate">{entry.name}</span>
            <span className="text-slate-500">{entry.cadence}</span>
            <span className="ml-auto text-slate-600 whitespace-nowrap">
              ~{formatMoney(entry.typical_amount, baseCurrency)}
            </span>
            <span className="w-24 text-right text-slate-400 text-xs whitespace-nowrap">
              next: {formatNextDate(entry.next_expected)}
            </span>
          </li>
        ))}
      </ul>
      <p className="text-sm text-slate-600 mt-4 pt-3 border-t border-slate-100">
        ≈ <span className="font-semibold text-ink">{formatMoney(monthlyTotal, baseCurrency)}</span>
        /month in recurring spend
      </p>
      <p className="text-xs text-slate-400 mt-2">{WARM_UP_NOTE}</p>
    </div>
  )
}

export default RecurringCard
