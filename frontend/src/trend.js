import { isSpend } from './categories.js'
import { currentMonthKey, shiftMonthKey } from './breakdown.js'

function isCountableSpend(expense) {
  return isSpend(expense) && typeof expense.convertedAmount === 'number'
}

export function monthlyTotals(expenses, monthsBack) {
  const nowKey = currentMonthKey()
  const keys = []
  let key = nowKey
  for (let i = 0; i < monthsBack; i += 1) {
    keys.unshift(key)
    key = shiftMonthKey(key, -1)
  }

  const totals = new Map(keys.map((monthKey) => [monthKey, 0]))
  for (const expense of expenses) {
    if (!isCountableSpend(expense)) continue
    const monthKey = String(expense.date).slice(0, 7)
    if (totals.has(monthKey)) {
      totals.set(monthKey, totals.get(monthKey) + expense.convertedAmount)
    }
  }

  const months = keys.map((monthKey) => ({
    monthKey,
    total: totals.get(monthKey),
    partial: monthKey === nowKey,
  }))
  while (months.length > 0 && months[0].total === 0 && !months[0].partial) {
    months.shift()
  }
  return months
}

export function samePointDelta(expenses) {
  const currentKey = currentMonthKey()
  const previousKey = shiftMonthKey(currentKey, -1)
  const [previousYear, previousMonth] = previousKey.split('-').map(Number)
  const daysInPrevious = new Date(Date.UTC(previousYear, previousMonth, 0)).getUTCDate()
  const day = Math.min(new Date().getUTCDate(), daysInPrevious)

  let current = 0
  let previous = 0
  for (const expense of expenses) {
    if (!isCountableSpend(expense)) continue
    const dateString = String(expense.date)
    const monthKey = dateString.slice(0, 7)
    if (monthKey !== currentKey && monthKey !== previousKey) continue
    if (Number(dateString.slice(8, 10)) > day) continue
    if (monthKey === currentKey) {
      current += expense.convertedAmount
    } else {
      previous += expense.convertedAmount
    }
  }

  if (previous === 0) return null
  const percent = Math.round((Math.abs(current - previous) / previous) * 100)
  const direction = percent === 0 ? 'flat' : current > previous ? 'up' : 'down'
  return { percent, direction, day, previousMonthKey: previousKey }
}
