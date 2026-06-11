const router = require('express').Router();
const Location = require('../models/Location');

router.get('/', async (req, res) => {
  try {
    const { floorId } = req.query;
    const query = floorId ? { floorId } : {};
    const locations = await Location.find(query).sort({ type: 1, name: 1 });
    res.json(locations);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

module.exports = router;
