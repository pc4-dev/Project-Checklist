const mongoose = require('mongoose');

const checkPointSchema = new mongoose.Schema({
  tradeId: { type: mongoose.Schema.Types.ObjectId, ref: 'Trade', required: true },
  order: { type: Number, required: true },
  title: { type: String, required: true },
  standard: String,
  howToCheck: String,
  photoRequired: { type: Boolean, default: false },
}, { timestamps: true });

module.exports = mongoose.model('CheckPoint', checkPointSchema);
