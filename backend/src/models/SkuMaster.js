const mongoose = require('mongoose');

const SkuMasterSchema = new mongoose.Schema({
  skuErpCode: { type: String, required: true, unique: true, trim: true },
  name: { type: String, required: true, trim: true },
  eanCode: { type: String, trim: true, default: '' },
  hsnCode: { type: String, trim: true, default: '' },
  uom: { type: String, trim: true, default: 'Pcs' },
  agreedRate: { type: Number, required: true, min: 0 },
  mrp: { type: Number, required: true, min: 0 },
  priceTolerance: { type: Number, default: 0.05, min: 0 } // fraction e.g. 0.05 = 5%
}, { timestamps: true });

// Add text search index for convenient searching
SkuMasterSchema.index({ skuErpCode: 'text', name: 'text', eanCode: 'text' });

module.exports = mongoose.model('SkuMaster', SkuMasterSchema);
