const rateTableCache = new Map()

function toRateDate(date) {
  const requested = new Date(date)
  const today = new Date()
  const effective = requested > today ? today : requested
  return effective.toISOString().slice(0, 10)
}

async function getRateTable(base, date) {
  const key = `${date}:${base}`
  if (rateTableCache.has(key)) {
    return rateTableCache.get(key)
  }

  let rates = null
  try {
    const response = await fetch(`https://api.frankfurter.dev/v1/${date}?base=${base}`)
    if (response.ok) {
      const data = await response.json()
      rates = data.rates
    }
  } catch {
    rates = null
  }

  if (rates) {
    rateTableCache.set(key, rates)
  }
  return rates
}

async function convertExpenses(expenses, baseCurrency) {
  const base = (baseCurrency || 'USD').toUpperCase()
  const converted = []

  for (const expense of expenses) {
    const plain = expense.toObject ? expense.toObject() : expense
    const native = (plain.currency || 'USD').toUpperCase()

    let convertedAmount
    if (native === base) {
      convertedAmount = plain.amount
    } else {
      const rates = await getRateTable(base, toRateDate(plain.date))
      const perBase = rates?.[native]
      convertedAmount = perBase ? Math.round((plain.amount / perBase) * 100) / 100 : null
    }

    converted.push({ ...plain, currency: native, convertedAmount, baseCurrency: base })
  }

  return converted
}

function __clearCache() {
  rateTableCache.clear()
}

module.exports = { convertExpenses, __clearCache }
