const express = require('express');
const router = express.Router();
const { computeThreeWayMatch } = require('../services/matchingEngine');

// GET /match/:poNumber
router.get('/:poNumber', async (req, res) => {
  try {
    const { poNumber } = req.params;
    if (!poNumber) {
      return res.status(400).json({ error: 'poNumber parameter is required' });
    }

    const result = await computeThreeWayMatch(poNumber);
    return res.json(result);
  } catch (err) {
    console.error('[Match API Error]', err);
    return res.status(500).json({ error: 'Failed to compute match', details: err.message });
  }
});

module.exports = router;
