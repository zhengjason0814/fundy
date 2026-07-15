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

module.exports = router
