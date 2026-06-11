const router = require('express').Router();
const upload = require('../middleware/upload');

router.post('/', upload.single('photo'), (req, res) => {
  if (!req.file) return res.status(400).json({ message: 'No file uploaded' });
  res.json({ url: req.file.path });
});

module.exports = router;
