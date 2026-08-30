const mongoose = require('mongoose');

const POItemSchema = new mongoose.Schema({
  itemCode: { type: String, required: true, trim: true },
  description: { type: String, default: '' },
  quantity: { type: Number, required: true, min: 0 },
  skuMaster: { type: mongoose.Schema.Types.ObjectId, ref: 'SkuMaster', default: null },
  unmapped: { type: Boolean, default: false }
}, { _id: true });

const PurchaseOrderSchema = new mongoose.Schema({
  poNumber: { type: String, required: true, trim: true },
  poDate: { type: String, default: '' },
  vendorName: { type: String, default: '' },
  items: [POItemSchema],
  rawParsed: { type: mongoose.Schema.Types.Mixed, default: {} },
  filePath: { type: String, default: '' },
  originalFilename: { type: String, default: '' }
}, { timestamps: true });

module.exports = mongoose.model('PurchaseOrder', PurchaseOrderSchema);
