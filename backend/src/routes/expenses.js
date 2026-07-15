const express = require('express')
const Expense = require('../models/Expense')
const requireAuth = require('../middleware/auth')

const router = express.Router()
router.use(requireAuth)

router.post('/', async (req, res) => {
  const { amount, category, date, note } = req.body
  if (amount === undefined || !category || !date) {
    return res.status(400).json({ error: 'amount, category, and date are required' })
  }

  const expense = await Expense.create({
    user: req.userId,
    amount,
    category,
    date,
    note,
  })

  res.status(201).json({ expense })
})

router.get('/', async (req, res) => {
  const expenses = await Expense.find({ user: req.userId }).sort({ date: -1 })
  res.json({ expenses })
})

module.exports = router
