const mongoose = require('mongoose');

const InvoiceItemSchema = new mongoose.Schema({
  itemCode: { type: String, required: true, trim: true },
  description: { type: String, default: '' },
  quantity: { type: Number, required: true, min: 0 },
  unitRate: { type: Number, default: 0 },
  mrp: { type: Number, default: 0 },
  skuMaster: { type: mongoose.Schema.Types.ObjectId, ref: 'SkuMaster', default: null },
  unmapped: { type: Boolean, default: false }
}, { _id: true });

const InvoiceSchema = new mongoose.Schema({
  invoiceNumber: { type: String, required: true, trim: true },
  poNumber: { type: String, required: true, trim: true },
  invoiceDate: { type: String, default: '' },
  items: [InvoiceItemSchema],
  rawParsed: { type: mongoose.Schema.Types.Mixed, default: {} },
  filePath: { type: String, default: '' },
  originalFilename: { type: String, default: '' }
}, { timestamps: true });

module.exports = mongoose.model('Invoice', InvoiceSchema);
