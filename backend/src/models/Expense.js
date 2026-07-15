const mongoose = require('mongoose')

const expenseSchema = new mongoose.Schema(
  {
    user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    amount: { type: Number, required: true },
    category: { type: String, required: true, trim: true },
    date: { type: Date, required: true },
    note: { type: String, trim: true },
  },
  { timestamps: true }
)

module.exports = mongoose.model('Expense', expenseSchema)
