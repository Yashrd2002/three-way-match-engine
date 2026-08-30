const express = require('express');
const cors = require('cors');
const path = require('path');
require('dotenv').config();

const { connectDB } = require('./config/db');
const { authMiddleware } = require('./config/auth');

const authRoutes = require('./routes/auth');
const documentRoutes = require('./routes/documents');
const matchRoutes = require('./routes/match');
const summaryRoutes = require('./routes/summary');
const masterRoutes = require('./routes/masters');
const seedRoutes = require('./routes/seed');
const { seedSampleData } = require('./services/sampleDataSeeder');

const app = express();
const PORT = process.env.PORT || 5001;

// Middleware
app.use(cors());
app.use(express.json({ limit: '25mb' }));
app.use(express.urlencoded({ extended: true, limit: '25mb' }));

// Auth Middleware
app.use(authMiddleware);

// Health Check
app.get('/health', (req, res) => {
  res.json({ status: 'ok', service: 'three-way-match-backend', timestamp: new Date() });
});

// Routes
app.use('/auth', authRoutes);
app.use('/documents', documentRoutes);
app.use('/match', matchRoutes);
app.use('/summary', summaryRoutes);
app.use('/masters', masterRoutes);
app.use('/seed', seedRoutes);

// Global Error Handler (Sanitizes stack traces)
app.use((err, req, res, next) => {
  console.error('[Global Error]', err);
  res.status(err.status || 500).json({
    error: err.message || 'Internal Server Error'
  });
});

// Start Server & Connect Database
async function startServer() {
  await connectDB();

  app.listen(PORT, () => {
    console.log(`===================================================`);
    console.log(`🚀 Three-Way Match Engine Backend running on port ${PORT}`);
    console.log(`   API Endpoint: http://localhost:${PORT}`);
    console.log(`===================================================`);
  });
}

startServer();
