const mongoose = require('mongoose');

const locationSchema = new mongoose.Schema({
  floorId: { type: mongoose.Schema.Types.ObjectId, ref: 'Floor', required: true },
  projectId: { type: mongoose.Schema.Types.ObjectId, ref: 'Project', required: true },
  name: { type: String, required: true },
  type: { type: String, enum: ['APARTMENT', 'COMMON_AREA', 'PROJECT_LEVEL'], required: true },
}, { timestamps: true });

module.exports = mongoose.model('Location', locationSchema);
