import { budgetStatuses } from '../budgets'
import { formatMoney } from '../currencies'

function BudgetAlertStrip({ expenses, budgets, baseCurrency }) {
  const alerts = budgetStatuses(expenses, budgets).filter((status) => status.level !== 'ok')
  if (alerts.length === 0) return null

  return (
    <div className="rounded-xl border border-amber-300 bg-amber-50 p-4 space-y-1">
      {alerts.map((status) => (
        <p key={status.category} className="text-sm text-amber-900">
          <span aria-hidden="true" style={status.level === 'over' ? { color: '#d03b3b' } : undefined}>{status.level === 'over' ? '✖' : '⚠'}</span>{' '}
          {status.level === 'over' ? 'Over budget:' : 'Close to budget:'}{' '}
          <span className="font-medium">{status.category}</span> —{' '}
          {formatMoney(status.spent, baseCurrency)} of {formatMoney(status.limit, baseCurrency)}
        </p>
      ))}
    </div>
  )
}

export default BudgetAlertStrip
