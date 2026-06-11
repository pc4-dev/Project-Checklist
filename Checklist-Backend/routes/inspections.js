const router = require('express').Router();
const Inspection = require('../models/Inspection');

router.get('/', async (req, res) => {
  try {
    const inspections = await Inspection.find()
      .populate('projectId', 'name')
      .populate('floorId', 'code label')
      .populate('locationId', 'name')
      .populate('tradeId', 'name')
      .sort({ createdAt: -1 });
    res.json(inspections);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

router.get('/:id', async (req, res) => {
  try {
    const inspection = await Inspection.findById(req.params.id)
      .populate('projectId')
      .populate('floorId')
      .populate('locationId')
      .populate('tradeId')
      .populate('results.checkPointId');
    if (!inspection) return res.status(404).json({ message: 'Inspection not found' });
    res.json(inspection);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

router.post('/', async (req, res) => {
  try {
    const inspection = new Inspection(req.body);
    await inspection.save();
    res.status(201).json(inspection);
  } catch (err) {
    res.status(400).json({ message: err.message });
  }
});

router.put('/:id', async (req, res) => {
  try {
    const inspection = await Inspection.findByIdAndUpdate(req.params.id, req.body, { new: true });
    if (!inspection) return res.status(404).json({ message: 'Inspection not found' });
    res.json(inspection);
  } catch (err) {
    res.status(400).json({ message: err.message });
  }
});

router.post('/:id/submit', async (req, res) => {
  try {
    const inspection = await Inspection.findByIdAndUpdate(
      req.params.id,
      { ...req.body, status: 'SUBMITTED' },
      { new: true }
    );
    if (!inspection) return res.status(404).json({ message: 'Inspection not found' });
    res.json(inspection);
  } catch (err) {
    res.status(400).json({ message: err.message });
  }
});

module.exports = router;
