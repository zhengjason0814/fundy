import { useState } from 'react'
import { Cell, Pie, PieChart, ResponsiveContainer, Tooltip } from 'recharts'
import {
  categoryBreakdown,
  currentMonthKey,
  monthLabel,
  shiftMonthKey,
} from '../breakdown'
import { formatMoney } from '../currencies'

const SLICE_COLORS = ['#2a78d6', '#eb6834', '#1baf7a', '#eda100', '#e87ba4', '#008300']

function CategoryBreakdownCard({ expenses, baseCurrency }) {
  const [monthKey, setMonthKey] = useState(currentMonthKey())
  const { total, slices } = categoryBreakdown(expenses, monthKey)
  const atCurrentMonth = monthKey === currentMonthKey()

  return (
    <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-6">
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-lg font-medium text-ink">Spending by category</h2>
        <div className="flex items-center gap-1 text-sm">
          <button
            type="button"
            onClick={() => setMonthKey(shiftMonthKey(monthKey, -1))}
            aria-label="Previous month"
            className="px-2 py-1 rounded text-slate-500 hover:bg-slate-100"
          >
            ‹
          </button>
          <span className="w-32 text-center text-slate-600" aria-live="polite">{monthLabel(monthKey)}</span>
          <button
            type="button"
            onClick={() => setMonthKey(shiftMonthKey(monthKey, 1))}
            disabled={atCurrentMonth}
            aria-label="Next month"
            className="px-2 py-1 rounded text-slate-500 hover:bg-slate-100 disabled:opacity-30 disabled:hover:bg-transparent"
          >
            ›
          </button>
        </div>
      </div>
      {slices.length === 0 ? (
        <p className="text-sm text-slate-500">No spending in this month.</p>
      ) : (
        <div className="flex flex-col sm:flex-row items-center gap-6">
          <div className="relative h-48 w-48 shrink-0">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={slices}
                  dataKey="amount"
                  nameKey="name"
                  innerRadius="65%"
                  outerRadius="100%"
                  startAngle={90}
                  endAngle={-270}
                  stroke="#ffffff"
                  strokeWidth={2}
                  isAnimationActive={false}
                >
                  {slices.map((slice, index) => (
                    <Cell key={slice.name} fill={SLICE_COLORS[index]} />
                  ))}
                </Pie>
                <Tooltip formatter={(value) => formatMoney(value, baseCurrency)} />
              </PieChart>
            </ResponsiveContainer>
            <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
              <p className="text-xs text-slate-400">Total</p>
              <p className="text-lg font-semibold text-ink">{formatMoney(total, baseCurrency)}</p>
            </div>
          </div>
          <ul className="flex-1 w-full space-y-2 text-sm">
            {slices.map((slice, index) => (
              <li key={slice.name} className="flex items-center gap-2">
                <span
                  className="h-3 w-3 rounded-sm shrink-0"
                  style={{ backgroundColor: SLICE_COLORS[index] }}
                />
                <span className="text-ink truncate">{slice.name}</span>
                {slice.categories.length > 1 && (
                  <span className="text-xs text-slate-400 truncate">
                    ({slice.categories.join(', ')})
                  </span>
                )}
                <span className="ml-auto text-slate-600 whitespace-nowrap">
                  {formatMoney(slice.amount, baseCurrency)}
                </span>
                <span className="w-10 text-right text-slate-400">
                  {Math.round((slice.amount / total) * 100)}%
                </span>
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  )
}

export default CategoryBreakdownCard
