const express = require('express')
const requireAuth = require('../middleware/auth')
const User = require('../models/User')
const { BUDGETABLE_CATEGORIES } = require('../constants/categories')

const router = express.Router()
router.use(requireAuth)

function serialize(user) {
  return { budgets: Object.fromEntries(user.budgets) }
}

router.get('/', async (req, res) => {
  const user = await User.findById(req.userId).select('budgets')
  res.json(serialize(user))
})

router.put('/', async (req, res) => {
  const { category, amount } = req.body
  if (!BUDGETABLE_CATEGORIES.includes(category)) {
    return res.status(400).json({ error: 'category must be a budgetable category' })
  }
  if (typeof amount !== 'number' || !Number.isFinite(amount) || amount <= 0) {
    return res.status(400).json({ error: 'amount must be a positive number' })
  }

  const user = await User.findById(req.userId).select('budgets')
  user.budgets.set(category, amount)
  await user.save()
  res.json(serialize(user))
})

router.delete('/:category', async (req, res) => {
  const { category } = req.params
  const user = await User.findById(req.userId).select('budgets')
  if (!user.budgets.has(category)) {
    return res.status(404).json({ error: 'no budget for that category' })
  }
  user.budgets.delete(category)
  await user.save()
  res.json(serialize(user))
})

module.exports = router
