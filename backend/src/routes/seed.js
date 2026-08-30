const express = require('express');
const router = express.Router();
const { seedSampleData } = require('../services/sampleDataSeeder');

// POST /seed/sample-data
router.post('/sample-data', async (req, res) => {
  try {
    const result = await seedSampleData();
    return res.json({
      message: 'Sample data seeded successfully',
      result
    });
  } catch (err) {
    console.error('[Seed Error]', err);
    return res.status(500).json({ error: 'Failed to seed sample data', details: err.message });
  }
});

module.exports = router;
