import { formatMoney } from '../currencies'

function AnomalyStrip({ anomalies, baseCurrency, onDismiss }) {
  if (anomalies.length === 0) {
    return null
  }

  return (
    <div className="bg-red-50 border border-red-200 rounded-xl p-4 space-y-2">
      <p className="text-sm font-medium text-red-700">
        ⚠ {anomalies.length === 1 ? '1 unusual expense' : `${anomalies.length} unusual expenses`}
      </p>
      <ul className="space-y-1">
        {anomalies.map((anomaly) => (
          <li key={anomaly.id} className="flex items-center justify-between text-sm text-red-800">
            <span>
              {formatMoney(anomaly.amount, baseCurrency)} vs your typical{' '}
              {formatMoney(anomaly.typical_low, baseCurrency)}–
              {formatMoney(anomaly.typical_high, baseCurrency)} for {anomaly.category}
            </span>
            <button
              type="button"
              onClick={() => onDismiss(anomaly.id)}
              className="ml-4 text-xs font-medium text-red-500 hover:text-red-700"
            >
              Dismiss
            </button>
          </li>
        ))}
      </ul>
    </div>
  )
}

export default AnomalyStrip
