const express = require('express')
const Account = require('../models/Account')
const User = require('../models/User')
const requireAuth = require('../middleware/auth')
const { convertAccountBalances } = require('../services/exchangeRates')

const router = express.Router()
router.use(requireAuth)

router.get('/', async (req, res) => {
  const user = await User.findById(req.userId).select('baseCurrency')
  const accounts = await Account.find({ user: req.userId })
    .sort({ createdAt: 1 })
    .populate('item', 'institutionName institutionId')
    .lean()
  const converted = await convertAccountBalances(accounts, user.baseCurrency)
  res.json({ accounts: converted, baseCurrency: user.baseCurrency })
})

module.exports = router
