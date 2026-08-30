const express = require('express');
const router = express.Router();
const SkuMaster = require('../models/SkuMaster');

// GET /masters/sku
router.get('/sku', async (req, res) => {
  try {
    const { search, limit = 100, page = 1 } = req.query;
    const query = {};
    if (search) {
      const reg = new RegExp(search.trim(), 'i');
      query.$or = [
        { skuErpCode: reg },
        { name: reg },
        { eanCode: reg },
        { hsnCode: reg }
      ];
    }

    const total = await SkuMaster.countDocuments(query);
    const skus = await SkuMaster.find(query)
      .sort({ createdAt: -1 })
      .skip((Number(page) - 1) * Number(limit))
      .limit(Number(limit));

    return res.json({
      total,
      page: Number(page),
      limit: Number(limit),
      skus
    });
  } catch (err) {
    return res.status(500).json({ error: err.message });
  }
});

// GET /masters/sku/:id
router.get('/sku/:id', async (req, res) => {
  try {
    const sku = await SkuMaster.findById(req.params.id);
    if (!sku) return res.status(404).json({ error: 'SKU Master record not found' });
    return res.json(sku);
  } catch (err) {
    return res.status(500).json({ error: err.message });
  }
});

// POST /masters/sku
router.post('/sku', async (req, res) => {
  try {
    const { skuErpCode, name, eanCode, hsnCode, uom, agreedRate, mrp, priceTolerance } = req.body;

    if (!skuErpCode || !name || agreedRate === undefined || mrp === undefined) {
      return res.status(400).json({ error: 'skuErpCode, name, agreedRate, and mrp are required' });
    }

    const existing = await SkuMaster.findOne({ skuErpCode: String(skuErpCode).trim() });
    if (existing) {
      return res.status(409).json({ error: `SKU with ERP code ${skuErpCode} already exists` });
    }

    const newSku = await SkuMaster.create({
      skuErpCode: String(skuErpCode).trim(),
      name: String(name).trim(),
      eanCode: eanCode ? String(eanCode).trim() : '',
      hsnCode: hsnCode ? String(hsnCode).trim() : '',
      uom: uom ? String(uom).trim() : 'Pcs',
      agreedRate: Number(agreedRate),
      mrp: Number(mrp),
      priceTolerance: priceTolerance !== undefined ? Number(priceTolerance) : 0.05
    });

    return res.status(201).json(newSku);
  } catch (err) {
    return res.status(500).json({ error: err.message });
  }
});

// PATCH /masters/sku/:id
router.patch('/sku/:id', async (req, res) => {
  try {
    const { skuErpCode, name, eanCode, hsnCode, uom, agreedRate, mrp, priceTolerance } = req.body;
    const updates = {};

    if (skuErpCode !== undefined) updates.skuErpCode = String(skuErpCode).trim();
    if (name !== undefined) updates.name = String(name).trim();
    if (eanCode !== undefined) updates.eanCode = String(eanCode).trim();
    if (hsnCode !== undefined) updates.hsnCode = String(hsnCode).trim();
    if (uom !== undefined) updates.uom = String(uom).trim();
    if (agreedRate !== undefined) updates.agreedRate = Number(agreedRate);
    if (mrp !== undefined) updates.mrp = Number(mrp);
    if (priceTolerance !== undefined) updates.priceTolerance = Number(priceTolerance);

    const updated = await SkuMaster.findByIdAndUpdate(req.params.id, updates, { new: true });
    if (!updated) return res.status(404).json({ error: 'SKU Master record not found' });

    return res.json(updated);
  } catch (err) {
    return res.status(500).json({ error: err.message });
  }
});

// DELETE /masters/sku/:id
router.delete('/sku/:id', async (req, res) => {
  try {
    const deleted = await SkuMaster.findByIdAndDelete(req.params.id);
    if (!deleted) return res.status(404).json({ error: 'SKU Master record not found' });
    return res.json({ message: 'SKU deleted successfully', id: req.params.id });
  } catch (err) {
    return res.status(500).json({ error: err.message });
  }
});

module.exports = router;
