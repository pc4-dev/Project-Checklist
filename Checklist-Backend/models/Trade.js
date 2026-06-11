const mongoose = require('mongoose');

const tradeSchema = new mongoose.Schema({
  name: { type: String, required: true },
  isHoldPoint: { type: Boolean, default: false },
  whyItMatters: String,
  isPending: { type: Boolean, default: false },
  order: { type: Number, default: 0 },
}, { timestamps: true });

module.exports = mongoose.model('Trade', tradeSchema);
