const router = require('express').Router();
const Floor = require('../models/Floor');

router.get('/', async (req, res) => {
  try {
    const { projectId } = req.query;
    const query = projectId ? { projectId } : {};
    const floors = await Floor.find(query).sort({ order: 1 });
    res.json(floors);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

router.get('/:id', async (req, res) => {
  try {
    const floor = await Floor.findById(req.params.id);
    if (!floor) return res.status(404).json({ message: 'Floor not found' });
    res.json(floor);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

module.exports = router;
