const mongoose = require('mongoose')

const userSchema = new mongoose.Schema(
  {
    email: { type: String, required: true, unique: true, lowercase: true, trim: true },
    passwordHash: { type: String, required: true },
    baseCurrency: { type: String, default: 'USD', uppercase: true, trim: true },
    budgets: { type: Map, of: Number, default: {} },
  },
  { timestamps: true }
)

module.exports = mongoose.model('User', userSchema)
