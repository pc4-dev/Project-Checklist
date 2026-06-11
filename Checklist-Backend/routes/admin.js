const router = require('express').Router();
const bcrypt = require('bcryptjs');
const auth = require('../middleware/auth');
const requireAdmin = require('../middleware/requireAdmin');
const Project = require('../models/Project');
const Floor = require('../models/Floor');
const Location = require('../models/Location');
const Trade = require('../models/Trade');
const CheckPoint = require('../models/CheckPoint');
const Inspection = require('../models/Inspection');
const User = require('../models/User');

router.use(auth, requireAdmin);

// ── Stats ─────────────────────────────────────────────────────────────────────
router.get('/stats', async (req, res) => {
  try {
    const [totalInspections, submitted, draft, totalProjects, totalTrades, totalUsers] =
      await Promise.all([
        Inspection.countDocuments(),
        Inspection.countDocuments({ status: 'SUBMITTED' }),
        Inspection.countDocuments({ status: 'DRAFT' }),
        Project.countDocuments(),
        Trade.countDocuments(),
        User.countDocuments(),
      ]);
    res.json({ totalInspections, submitted, draft, totalProjects, totalTrades, totalUsers });
  } catch (err) { res.status(500).json({ message: err.message }); }
});

// ── Projects ──────────────────────────────────────────────────────────────────
router.get('/projects', async (req, res) => {
  try {
    res.json(await Project.find().sort({ type: 1, name: 1 }));
  } catch (err) { res.status(500).json({ message: err.message }); }
});

router.post('/projects', async (req, res) => {
  try {
    res.status(201).json(await Project.create(req.body));
  } catch (err) { res.status(400).json({ message: err.message }); }
});

router.put('/projects/:id', async (req, res) => {
  try {
    const project = await Project.findByIdAndUpdate(req.params.id, req.body, { new: true });
    if (!project) return res.status(404).json({ message: 'Not found' });
    res.json(project);
  } catch (err) { res.status(400).json({ message: err.message }); }
});

router.delete('/projects/:id', async (req, res) => {
  try {
    await Project.findByIdAndDelete(req.params.id);
    await Promise.all([
      Floor.deleteMany({ projectId: req.params.id }),
      Location.deleteMany({ projectId: req.params.id }),
      Inspection.deleteMany({ projectId: req.params.id }),
    ]);
    res.json({ message: 'Deleted' });
  } catch (err) { res.status(500).json({ message: err.message }); }
});

// ── Floors ────────────────────────────────────────────────────────────────────
router.get('/floors', async (req, res) => {
  try {
    const query = req.query.projectId ? { projectId: req.query.projectId } : {};
    res.json(await Floor.find(query).populate('projectId', 'name').sort({ order: 1 }));
  } catch (err) { res.status(500).json({ message: err.message }); }
});

router.post('/floors', async (req, res) => {
  try {
    res.status(201).json(await Floor.create(req.body));
  } catch (err) { res.status(400).json({ message: err.message }); }
});

router.put('/floors/:id', async (req, res) => {
  try {
    const floor = await Floor.findByIdAndUpdate(req.params.id, req.body, { new: true });
    if (!floor) return res.status(404).json({ message: 'Not found' });
    res.json(floor);
  } catch (err) { res.status(400).json({ message: err.message }); }
});

router.delete('/floors/:id', async (req, res) => {
  try {
    await Floor.findByIdAndDelete(req.params.id);
    await Location.deleteMany({ floorId: req.params.id });
    res.json({ message: 'Deleted' });
  } catch (err) { res.status(500).json({ message: err.message }); }
});

// ── Locations ─────────────────────────────────────────────────────────────────
router.get('/locations', async (req, res) => {
  try {
    const query = req.query.floorId ? { floorId: req.query.floorId } : {};
    res.json(await Location.find(query).sort({ type: 1, name: 1 }));
  } catch (err) { res.status(500).json({ message: err.message }); }
});

router.post('/locations', async (req, res) => {
  try {
    res.status(201).json(await Location.create(req.body));
  } catch (err) { res.status(400).json({ message: err.message }); }
});

router.put('/locations/:id', async (req, res) => {
  try {
    const loc = await Location.findByIdAndUpdate(req.params.id, req.body, { new: true });
    if (!loc) return res.status(404).json({ message: 'Not found' });
    res.json(loc);
  } catch (err) { res.status(400).json({ message: err.message }); }
});

router.delete('/locations/:id', async (req, res) => {
  try {
    await Location.findByIdAndDelete(req.params.id);
    res.json({ message: 'Deleted' });
  } catch (err) { res.status(500).json({ message: err.message }); }
});

// ── Trades ────────────────────────────────────────────────────────────────────
router.get('/trades', async (req, res) => {
  try {
    res.json(await Trade.find().sort({ order: 1 }));
  } catch (err) { res.status(500).json({ message: err.message }); }
});

router.post('/trades', async (req, res) => {
  try {
    res.status(201).json(await Trade.create(req.body));
  } catch (err) { res.status(400).json({ message: err.message }); }
});

router.put('/trades/:id', async (req, res) => {
  try {
    const trade = await Trade.findByIdAndUpdate(req.params.id, req.body, { new: true });
    if (!trade) return res.status(404).json({ message: 'Not found' });
    res.json(trade);
  } catch (err) { res.status(400).json({ message: err.message }); }
});

router.delete('/trades/:id', async (req, res) => {
  try {
    await Trade.findByIdAndDelete(req.params.id);
    await CheckPoint.deleteMany({ tradeId: req.params.id });
    res.json({ message: 'Deleted' });
  } catch (err) { res.status(500).json({ message: err.message }); }
});

// ── CheckPoints ───────────────────────────────────────────────────────────────
router.get('/checkpoints', async (req, res) => {
  try {
    const query = req.query.tradeId ? { tradeId: req.query.tradeId } : {};
    res.json(await CheckPoint.find(query).populate('tradeId', 'name').sort({ order: 1 }));
  } catch (err) { res.status(500).json({ message: err.message }); }
});

router.post('/checkpoints', async (req, res) => {
  try {
    res.status(201).json(await CheckPoint.create(req.body));
  } catch (err) { res.status(400).json({ message: err.message }); }
});

router.put('/checkpoints/:id', async (req, res) => {
  try {
    const cp = await CheckPoint.findByIdAndUpdate(req.params.id, req.body, { new: true });
    if (!cp) return res.status(404).json({ message: 'Not found' });
    res.json(cp);
  } catch (err) { res.status(400).json({ message: err.message }); }
});

router.delete('/checkpoints/:id', async (req, res) => {
  try {
    await CheckPoint.findByIdAndDelete(req.params.id);
    res.json({ message: 'Deleted' });
  } catch (err) { res.status(500).json({ message: err.message }); }
});

// ── Inspections ───────────────────────────────────────────────────────────────
router.get('/inspections', async (req, res) => {
  try {
    const query = req.query.status ? { status: req.query.status } : {};
    const inspections = await Inspection.find(query)
      .populate('projectId', 'name')
      .populate('floorId', 'code label')
      .populate('locationId', 'name')
      .populate('tradeId', 'name')
      .sort({ createdAt: -1 });
    res.json(inspections);
  } catch (err) { res.status(500).json({ message: err.message }); }
});

router.get('/inspections/:id', async (req, res) => {
  try {
    const inspection = await Inspection.findById(req.params.id)
      .populate('projectId')
      .populate('floorId')
      .populate('locationId')
      .populate('tradeId')
      .populate('results.checkPointId');
    if (!inspection) return res.status(404).json({ message: 'Not found' });
    res.json(inspection);
  } catch (err) { res.status(500).json({ message: err.message }); }
});

router.put('/inspections/:id', async (req, res) => {
  try {
    const inspection = await Inspection.findByIdAndUpdate(req.params.id, req.body, { new: true });
    if (!inspection) return res.status(404).json({ message: 'Not found' });
    res.json(inspection);
  } catch (err) { res.status(400).json({ message: err.message }); }
});

router.delete('/inspections/:id', async (req, res) => {
  try {
    await Inspection.findByIdAndDelete(req.params.id);
    res.json({ message: 'Deleted' });
  } catch (err) { res.status(500).json({ message: err.message }); }
});

// ── Users ─────────────────────────────────────────────────────────────────────
router.get('/users', async (req, res) => {
  try {
    res.json(await User.find().select('-password').sort({ createdAt: -1 }));
  } catch (err) { res.status(500).json({ message: err.message }); }
});

router.post('/users', async (req, res) => {
  try {
    const user = await User.create(req.body);
    res.status(201).json({ _id: user._id, name: user.name, email: user.email, role: user.role, createdAt: user.createdAt });
  } catch (err) { res.status(400).json({ message: err.message }); }
});

router.put('/users/:id', async (req, res) => {
  try {
    const updates = { ...req.body };
    if (updates.password) {
      updates.password = await bcrypt.hash(updates.password, 10);
    } else {
      delete updates.password;
    }
    const user = await User.findByIdAndUpdate(req.params.id, updates, { new: true }).select('-password');
    if (!user) return res.status(404).json({ message: 'Not found' });
    res.json(user);
  } catch (err) { res.status(400).json({ message: err.message }); }
});

router.delete('/users/:id', async (req, res) => {
  try {
    if (req.user._id.toString() === req.params.id) {
      return res.status(400).json({ message: 'Cannot delete your own account' });
    }
    await User.findByIdAndDelete(req.params.id);
    res.json({ message: 'Deleted' });
  } catch (err) { res.status(500).json({ message: err.message }); }
});

module.exports = router;
