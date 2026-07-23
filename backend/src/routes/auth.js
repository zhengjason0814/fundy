const express = require('express')
const bcrypt = require('bcrypt')
const jwt = require('jsonwebtoken')
const User = require('../models/User')
const requireAuth = require('../middleware/auth')

const router = express.Router()

function issueToken(user) {
  return jwt.sign({ userId: user._id }, process.env.JWT_SECRET, { expiresIn: '7d' })
}

router.post('/signup', async (req, res) => {
  const { email, password } = req.body
  if (!email || !password) {
    return res.status(400).json({ error: 'Email and password are required' })
  }

  const existing = await User.findOne({ email })
  if (existing) {
    return res.status(409).json({ error: 'Email already in use' })
  }

  const passwordHash = await bcrypt.hash(password, 10)
  const user = await User.create({ email, passwordHash })

  res.status(201).json({ token: issueToken(user) })
})

router.post('/login', async (req, res) => {
  const { email, password } = req.body
  if (!email || !password) {
    return res.status(400).json({ error: 'Email and password are required' })
  }

  const user = await User.findOne({ email })
  const valid = user && (await bcrypt.compare(password, user.passwordHash))
  if (!valid) {
    return res.status(401).json({ error: 'Invalid credentials' })
  }

  res.json({ token: issueToken(user) })
})

router.get('/me', requireAuth, async (req, res) => {
  const user = await User.findById(req.userId).select('email baseCurrency budgets createdAt')
  res.json({ user })
})

router.patch('/me', requireAuth, async (req, res) => {
  const { baseCurrency } = req.body
  if (!baseCurrency) {
    return res.status(400).json({ error: 'baseCurrency is required' })
  }

  const user = await User.findByIdAndUpdate(
    req.userId,
    { baseCurrency },
    { returnDocument: 'after' }
  ).select('email baseCurrency budgets createdAt')

  res.json({ user })
})

module.exports = router
