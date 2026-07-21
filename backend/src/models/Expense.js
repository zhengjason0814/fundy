const mongoose = require('mongoose')
const { CATEGORIES } = require('../constants/categories')

const expenseSchema = new mongoose.Schema(
  {
    user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    amount: { type: Number, required: true },
    currency: { type: String, default: 'USD', uppercase: true, trim: true },
    category: { type: String, required: true, trim: true, enum: CATEGORIES },
    date: { type: Date, required: true },
    note: { type: String, required: true, trim: true },
    source: { type: String, enum: ['manual', 'plaid'], default: 'manual' },
    account: { type: mongoose.Schema.Types.ObjectId, ref: 'Account', default: null },
    plaidTransactionId: { type: String, unique: true, sparse: true, default: undefined },
    merchant: { type: String, trim: true },
    pending: { type: Boolean, default: false },
    anomalyDismissed: { type: Boolean, default: false },
  },
  { timestamps: true }
)

module.exports = mongoose.model('Expense', expenseSchema)
