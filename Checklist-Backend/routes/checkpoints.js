const router = require('express').Router();
const CheckPoint = require('../models/CheckPoint');

router.get('/', async (req, res) => {
  try {
    const { tradeId } = req.query;
    const query = tradeId ? { tradeId } : {};
    const checkpoints = await CheckPoint.find(query).sort({ order: 1 });
    res.json(checkpoints);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

module.exports = router;
