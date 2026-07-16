const express = require('express')
const Account = require('../models/Account')
const requireAuth = require('../middleware/auth')

const router = express.Router()
router.use(requireAuth)

router.get('/', async (req, res) => {
  const accounts = await Account.find({ user: req.userId }).sort({ createdAt: 1 })
  res.json({ accounts })
})

module.exports = router
