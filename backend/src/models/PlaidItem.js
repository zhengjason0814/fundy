const mongoose = require('mongoose')

const plaidItemSchema = new mongoose.Schema(
  {
    user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    itemId: { type: String, required: true, unique: true },
    accessToken: { type: String, required: true },
    institutionName: { type: String, trim: true },
    cursor: { type: String, default: null },
  },
  { timestamps: true }
)

module.exports = mongoose.model('PlaidItem', plaidItemSchema)
