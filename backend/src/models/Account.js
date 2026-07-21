const mongoose = require('mongoose')

const accountSchema = new mongoose.Schema(
  {
    user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    item: { type: mongoose.Schema.Types.ObjectId, ref: 'PlaidItem', required: true },
    plaidAccountId: { type: String, required: true, unique: true },
    name: { type: String, trim: true },
    mask: { type: String, trim: true },
    type: { type: String, trim: true },
    subtype: { type: String, trim: true },
    currency: { type: String, trim: true },
    balance: { type: Number },
  },
  { timestamps: true }
)

module.exports = mongoose.model('Account', accountSchema)
