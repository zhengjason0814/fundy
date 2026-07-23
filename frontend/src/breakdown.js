import { isSpend } from './categories.js'

export const MAX_OWN_SLICES = 5
export const MERGED_SLICE_NAME = 'Everything else'

export function currentMonthKey() {
  return new Date().toISOString().slice(0, 7)
}

export function shiftMonthKey(monthKey, delta) {
  const [year, month] = monthKey.split('-').map(Number)
  return new Date(Date.UTC(year, month - 1 + delta, 1)).toISOString().slice(0, 7)
}

export function monthLabel(monthKey) {
  const [year, month] = monthKey.split('-').map(Number)
  return new Date(Date.UTC(year, month - 1, 1)).toLocaleDateString('en-US', {
    month: 'long',
    year: 'numeric',
    timeZone: 'UTC',
  })
}

export function categoryTotals(expenses, monthKey) {
  const totals = new Map()
  for (const expense of expenses) {
    if (!isSpend(expense)) continue
    if (typeof expense.convertedAmount !== 'number') continue
    if (String(expense.date).slice(0, 7) !== monthKey) continue
    totals.set(expense.category, (totals.get(expense.category) || 0) + expense.convertedAmount)
  }
  return totals
}

export function categoryBreakdown(expenses, monthKey) {
  const totals = categoryTotals(expenses, monthKey)

  const ranked = [...totals.entries()]
    .map(([name, amount]) => ({ name, amount, categories: [name] }))
    .sort((a, b) => b.amount - a.amount)

  let slices = ranked
  if (ranked.length > MAX_OWN_SLICES + 1) {
    const merged = ranked.slice(MAX_OWN_SLICES)
    slices = [
      ...ranked.slice(0, MAX_OWN_SLICES),
      {
        name: MERGED_SLICE_NAME,
        amount: merged.reduce((sum, slice) => sum + slice.amount, 0),
        categories: merged.map((slice) => slice.name),
      },
    ]
  }

  const total = ranked.reduce((sum, slice) => sum + slice.amount, 0)
  return { total, slices }
}
