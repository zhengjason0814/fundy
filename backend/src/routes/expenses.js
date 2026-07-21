const express = require('express')
const Expense = require('../models/Expense')
const User = require('../models/User')
const requireAuth = require('../middleware/auth')
const { convertExpenses } = require('../services/exchangeRates')
const { CATEGORIES } = require('../constants/categories')
const { TRANSACTION_TYPES } = require('../constants/transactionTypes')

const router = express.Router()
router.use(requireAuth)

router.post('/', async (req, res) => {
  const { amount, currency, category, date, note, type } = req.body
  const trimmedNote = (note || '').trim()
  if (amount === undefined || !category || !date || !trimmedNote || !type) {
    return res.status(400).json({ error: 'amount, category, date, note, and type are required' })
  }
  if (!CATEGORIES.includes(category)) {
    return res.status(400).json({ error: `category must be one of: ${CATEGORIES.join(', ')}` })
  }
  if (!TRANSACTION_TYPES.includes(type)) {
    return res.status(400).json({ error: `type must be one of: ${TRANSACTION_TYPES.join(', ')}` })
  }

  const created = await Expense.create({
    user: req.userId,
    amount,
    currency,
    category,
    date,
    note: trimmedNote,
    type,
  })

  const user = await User.findById(req.userId).select('baseCurrency')
  const [expense] = await convertExpenses([created], user.baseCurrency)

  res.status(201).json({ expense })
})

router.get('/', async (req, res) => {
  const user = await User.findById(req.userId).select('baseCurrency')
  const expenses = await Expense.find({ user: req.userId }).sort({ date: -1 }).lean()
  const converted = await convertExpenses(expenses, user.baseCurrency)
  res.json({ expenses: converted, baseCurrency: user.baseCurrency })
})

router.delete('/:id', async (req, res) => {
  const deleted = await Expense.findOneAndDelete({
    _id: req.params.id,
    user: req.userId,
  })

  if (!deleted) {
    return res.status(404).json({ error: 'Expense not found' })
  }

  res.json({ deleted: deleted._id })
})

router.post('/:id/dismiss-anomaly', async (req, res) => {
  const updated = await Expense.findOneAndUpdate(
    { _id: req.params.id, user: req.userId },
    { anomalyDismissed: true },
    { returnDocument: 'after' }
  )

  if (!updated) {
    return res.status(404).json({ error: 'Expense not found' })
  }

  res.json({ expense: updated })
})

module.exports = router
