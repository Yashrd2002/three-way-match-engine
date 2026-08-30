const mongoose = require('mongoose');

const GrnItemSchema = new mongoose.Schema({
  itemCode: { type: String, required: true, trim: true },
  description: { type: String, default: '' },
  receivedQuantity: { type: Number, required: true, min: 0 },
  mrp: { type: Number, default: 0 },
  skuMaster: { type: mongoose.Schema.Types.ObjectId, ref: 'SkuMaster', default: null },
  unmapped: { type: Boolean, default: false }
}, { _id: true });

const GrnSchema = new mongoose.Schema({
  grnNumber: { type: String, required: true, trim: true },
  poNumber: { type: String, required: true, trim: true },
  grnDate: { type: String, default: '' },
  items: [GrnItemSchema],
  rawParsed: { type: mongoose.Schema.Types.Mixed, default: {} },
  filePath: { type: String, default: '' },
  originalFilename: { type: String, default: '' }
}, { timestamps: true });

module.exports = mongoose.model('Grn', GrnSchema);
