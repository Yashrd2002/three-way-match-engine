const express = require('express');
const router = express.Router();
const { computeSummary } = require('../services/matchingEngine');

// GET /summary/:poNumber
router.get('/:poNumber', async (req, res) => {
  try {
    const { poNumber } = req.params;
    if (!poNumber) {
      return res.status(400).json({ error: 'poNumber parameter is required' });
    }

    const summary = await computeSummary(poNumber);
    return res.json(summary);
  } catch (err) {
    console.error('[Summary API Error]', err);
    return res.status(500).json({ error: 'Failed to compute summary', details: err.message });
  }
});

module.exports = router;
