const express = require('express')
const plaidClient = require('../config/plaid')
const requireAuth = require('../middleware/auth')
const PlaidItem = require('../models/PlaidItem')
const Account = require('../models/Account')
const Expense = require('../models/Expense')
const { mapPlaidCategory } = require('../services/plaidCategoryMap')

const router = express.Router()
router.use(requireAuth)

async function syncItem(item) {
  const accounts = await Account.find({ item: item._id })
  const accountIdByPlaidId = new Map(
    accounts.map((account) => [account.plaidAccountId, account._id])
  )

  let cursor = item.cursor
  const added = []
  const modified = []
  const removed = []
  let hasMore = true

  while (hasMore) {
    const response = await plaidClient.transactionsSync({
      access_token: item.accessToken,
      cursor: cursor || undefined,
    })
    added.push(...response.data.added)
    modified.push(...response.data.modified)
    removed.push(...response.data.removed)
    hasMore = response.data.has_more
    cursor = response.data.next_cursor
  }

  let imported = 0
  for (const transaction of [...added, ...modified]) {
    if (transaction.amount <= 0) continue
    const accountId = accountIdByPlaidId.get(transaction.account_id)
    if (!accountId) continue

    await Expense.findOneAndUpdate(
      { plaidTransactionId: transaction.transaction_id },
      {
        user: item.user,
        account: accountId,
        amount: transaction.amount,
        currency: transaction.iso_currency_code || transaction.unofficial_currency_code || 'USD',
        category: mapPlaidCategory(transaction.personal_finance_category),
        date: new Date(transaction.date),
        note: transaction.name,
        merchant: transaction.merchant_name || undefined,
        pending: transaction.pending,
        source: 'plaid',
        plaidTransactionId: transaction.transaction_id,
      },
      { upsert: true }
    )
    imported += 1
  }

  const removedIds = removed.map((transaction) => transaction.transaction_id)
  if (removedIds.length > 0) {
    await Expense.deleteMany({ plaidTransactionId: { $in: removedIds } })
  }

  item.cursor = cursor
  await item.save()

  return {
    added: added.length,
    modified: modified.length,
    removed: removedIds.length,
    imported,
  }
}

router.post('/link-token', async (req, res) => {
  const response = await plaidClient.linkTokenCreate({
    user: { client_user_id: String(req.userId) },
    client_name: 'Fundy',
    products: ['transactions'],
    country_codes: ['US'],
    language: 'en',
  })
  res.json({ link_token: response.data.link_token })
})

router.post('/exchange', async (req, res) => {
  const { public_token } = req.body
  if (!public_token) {
    return res.status(400).json({ error: 'public_token is required' })
  }

  const exchange = await plaidClient.itemPublicTokenExchange({ public_token })
  const item = await PlaidItem.create({
    user: req.userId,
    itemId: exchange.data.item_id,
    accessToken: exchange.data.access_token,
  })

  const accountsResponse = await plaidClient.accountsGet({
    access_token: item.accessToken,
  })

  await Account.insertMany(
    accountsResponse.data.accounts.map((account) => ({
      user: req.userId,
      item: item._id,
      plaidAccountId: account.account_id,
      name: account.name,
      mask: account.mask,
      type: account.type,
      subtype: account.subtype,
      currency: account.balances?.iso_currency_code,
    }))
  )

  const summary = await syncItem(item)
  res.status(201).json({ accounts: accountsResponse.data.accounts.length, ...summary })
})

router.post('/sync', async (req, res) => {
  const items = await PlaidItem.find({ user: req.userId })
  const totals = { added: 0, modified: 0, removed: 0, imported: 0 }

  for (const item of items) {
    const summary = await syncItem(item)
    totals.added += summary.added
    totals.modified += summary.modified
    totals.removed += summary.removed
    totals.imported += summary.imported
  }

  res.json(totals)
})

module.exports = router
