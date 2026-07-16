import { formatMoney } from '../currencies'

function rangeLabel(range, baseCurrency) {
  return `${formatMoney(range.low, baseCurrency)} – ${formatMoney(range.high, baseCurrency)}`
}

function PredictionCard({ prediction, baseCurrency }) {
  if (!prediction || prediction.status === 'unavailable') {
    return (
      <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-6 text-sm text-slate-400">
        Spending predictions are unavailable right now.
      </div>
    )
  }

  if (prediction.status === 'insufficient_data') {
    return (
      <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-6 text-sm text-slate-500">
        Keep adding expenses — predictions unlock after 2 full months of history.
      </div>
    )
  }

  const current = prediction.current_month
  const next = prediction.next_month

  return (
    <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-6">
      <h2 className="text-lg font-medium text-ink mb-4">Spending outlook</h2>
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div>
          <p className="text-sm text-slate-500">This month</p>
          <p className="text-xl font-semibold text-ink">
            {rangeLabel(current, baseCurrency)}
          </p>
          <p className="text-xs text-slate-400 mt-1">
            {formatMoney(current.spent_so_far, baseCurrency)} spent so far
          </p>
        </div>
        <div>
          <p className="text-sm text-slate-500">Next month</p>
          <p className="text-xl font-semibold text-ink">{rangeLabel(next, baseCurrency)}</p>
          <p className="text-xs text-slate-400 mt-1">Based on your monthly history</p>
        </div>
      </div>
    </div>
  )
}

export default PredictionCard
