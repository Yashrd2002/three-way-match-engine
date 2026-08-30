const mongoose = require('mongoose');

const AuditStepSchema = new mongoose.Schema({
  step: { type: String, required: true },
  status: { type: String, required: true, enum: ['success', 'warning', 'error', 'info'] },
  message: { type: String, required: true },
  at: { type: Date, default: Date.now }
}, { _id: true });

const MatchAuditSchema = new mongoose.Schema({
  poNumber: { type: String, required: true, trim: true },
  steps: [AuditStepSchema]
}, { timestamps: true });

module.exports = mongoose.model('MatchAudit', MatchAuditSchema);
