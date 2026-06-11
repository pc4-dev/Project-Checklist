const express = require('express');
const cors = require('cors');
const dotenv = require('dotenv');
const connectDB = require('./config/db');

dotenv.config();
connectDB();

const app = express();
app.use(cors({
  origin: process.env.FRONTEND_URL ? process.env.FRONTEND_URL.split(',') : '*',
  credentials: true,
}));
app.use(express.json());

// Public: auth
app.use('/api/auth', require('./routes/auth'));

// Public: user-facing routes (no login required)
app.use('/api/projects', require('./routes/projects'));
app.use('/api/floors', require('./routes/floors'));
app.use('/api/locations', require('./routes/locations'));
app.use('/api/trades', require('./routes/trades'));
app.use('/api/checkpoints', require('./routes/checkpoints'));
app.use('/api/inspections', require('./routes/inspections'));
app.use('/api/uploads', require('./routes/uploads'));

// Admin routes (auth + admin-role check enforced inside)
const authMiddleware = require('./middleware/auth');
app.use('/api/admin', authMiddleware, require('./routes/admin'));

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => console.log(`Server running on port ${PORT}`));
