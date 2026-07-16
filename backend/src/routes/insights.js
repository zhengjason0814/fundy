const express = require('express')
const Expense = require('../models/Expense')
const User = require('../models/User')
const requireAuth = require('../middleware/auth')
const { convertExpenses } = require('../services/exchangeRates')
const mlClient = require('../services/mlClient')

const router = express.Router()
router.use(requireAuth)

async function loadConvertibleExpenses(userId) {
  const user = await User.findById(userId).select('baseCurrency')
  const expenses = await Expense.find({ user: userId }).lean()
  const converted = await convertExpenses(expenses, user.baseCurrency)
  const usable = converted.filter(
    (expense) => typeof expense.convertedAmount === 'number'
  )
  return { usable, baseCurrency: user.baseCurrency }
}

function isoDay(value) {
  return new Date(value).toISOString().slice(0, 10)
}

router.get('/prediction', async (req, res) => {
  const { usable, baseCurrency } = await loadConvertibleExpenses(req.userId)
  const points = usable.map((expense) => ({
    date: isoDay(expense.date),
    amount: expense.convertedAmount,
  }))

  try {
    const result = await mlClient.predict(points, isoDay(new Date()))
    res.json({ ...result, baseCurrency })
  } catch {
    res.json({ status: 'unavailable', baseCurrency })
  }
})

router.get('/anomalies', async (req, res) => {
  const { usable, baseCurrency } = await loadConvertibleExpenses(req.userId)
  const items = usable.map((expense) => ({
    id: String(expense._id),
    category: expense.category,
    amount: expense.convertedAmount,
    date: isoDay(expense.date),
  }))

  try {
    const result = await mlClient.detectAnomalies(items)
    const dismissed = new Set(
      usable
        .filter((expense) => expense.anomalyDismissed)
        .map((expense) => String(expense._id))
    )
    const anomalies = result.anomalies.filter((anomaly) => !dismissed.has(anomaly.id))
    res.json({ ...result, anomalies, baseCurrency })
  } catch {
    res.json({ status: 'unavailable', anomalies: [], baseCurrency })
  }
})

router.get('/suggest-category', async (req, res) => {
  const text = (req.query.text || '').trim()
  if (!text) {
    return res.status(400).json({ error: 'text is required' })
  }

  const expenses = await Expense.find({ user: req.userId }).lean()
  const history = expenses
    .map((expense) => ({
      text: [expense.merchant, expense.note].filter(Boolean).join(' '),
      category: expense.category,
    }))
    .filter((row) => row.text)

  try {
    const result = await mlClient.classify(history, text)
    res.json(result)
  } catch {
    res.json({ status: 'unavailable' })
  }
})

module.exports = router
