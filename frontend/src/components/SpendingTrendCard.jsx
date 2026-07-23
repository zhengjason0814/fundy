import {
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts'
import { monthLabel } from '../breakdown'
import { monthlyTotals, samePointDelta } from '../trend'
import { formatMoney } from '../currencies'

const MONTHS_SHOWN = 6
const COMPLETE_MONTH_COLOR = '#2a78d6'
const PARTIAL_MONTH_COLOR = '#86b6ef'
const UP_COLOR = '#d03b3b'
const DOWN_COLOR = '#006300'

function monthName(monthKey) {
  return monthLabel(monthKey).split(' ')[0]
}

function compactMoney(value, currency) {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: currency || 'USD',
    notation: 'compact',
  }).format(value)
}

function DeltaHeadline({ delta }) {
  if (!delta) return null
  const previousName = monthName(delta.previousMonthKey)
  if (delta.direction === 'flat') {
    return (
      <p className="text-sm text-slate-500">
        even with {previousName} (through day {delta.day})
      </p>
    )
  }
  return (
    <p className="text-sm text-slate-500">
      <span style={{ color: delta.direction === 'up' ? UP_COLOR : DOWN_COLOR }}>
        {delta.direction === 'up' ? '↑' : '↓'}
      </span>{' '}
      <span className="font-medium text-ink">{delta.percent}%</span> vs {previousName} (through
      day {delta.day})
    </p>
  )
}

function SpendingTrendCard({ expenses, baseCurrency }) {
  const months = monthlyTotals(expenses, MONTHS_SHOWN)
  const monthsWithSpend = months.filter((month) => month.total > 0).length
  const delta = samePointDelta(expenses)

  const bars = months.map((month) => ({
    ...month,
    name: month.partial ? `${monthName(month.monthKey)} (so far)` : monthName(month.monthKey),
  }))

  return (
    <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-6">
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-lg font-medium text-ink">Spending trend</h2>
        {monthsWithSpend >= 2 && <DeltaHeadline delta={delta} />}
      </div>
      {monthsWithSpend < 2 ? (
        <p className="text-sm text-slate-500">
          Your trend appears once you have a previous month to compare.
        </p>
      ) : (
        <div className="h-56">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={bars} margin={{ top: 4, right: 4, bottom: 0, left: 4 }}>
              <CartesianGrid vertical={false} stroke="#e1e0d9" />
              <XAxis
                dataKey="name"
                tickLine={false}
                axisLine={{ stroke: '#c3c2b7' }}
                tick={{ fontSize: 12, fill: '#898781' }}
              />
              <YAxis
                tickFormatter={(value) => compactMoney(value, baseCurrency)}
                tickLine={false}
                axisLine={false}
                tick={{ fontSize: 12, fill: '#898781' }}
                width={52}
              />
              <Tooltip
                cursor={{ fill: 'rgba(11, 11, 11, 0.04)' }}
                formatter={(value) => [formatMoney(value, baseCurrency), 'Spent']}
              />
              <Bar dataKey="total" isAnimationActive={false} maxBarSize={48} radius={[4, 4, 0, 0]}>
                {bars.map((month) => (
                  <Cell
                    key={month.monthKey}
                    fill={month.partial ? PARTIAL_MONTH_COLOR : COMPLETE_MONTH_COLOR}
                  />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </div>
      )}
    </div>
  )
}

export default SpendingTrendCard
