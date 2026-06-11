const router = require('express').Router();
const Trade = require('../models/Trade');

router.get('/', async (req, res) => {
  try {
    const trades = await Trade.find().sort({ order: 1 });
    res.json(trades);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

router.get('/:id', async (req, res) => {
  try {
    const trade = await Trade.findById(req.params.id);
    if (!trade) return res.status(404).json({ message: 'Trade not found' });
    res.json(trade);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

module.exports = router;
