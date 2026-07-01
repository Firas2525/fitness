const express = require('express');
const cors    = require('cors');

const authRoutes     = require('./routes/auth');
const profileRoutes  = require('./routes/profile');
const exerciseRoutes = require('./routes/exercises');
const activityRoutes = require('./routes/activity');
const nutritionRoutes = require('./routes/nutrition');
const progressRoutes = require('./routes/progress');  
const notificationRoutes = require('./routes/notifications');
const aiRoutes = require('./routes/ai');

const app = express();  

app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// ── Health check ──────────────────────────────────────────────────────────
app.get('/health', (req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

// ── Routes ────────────────────────────────────────────────────────────────
app.use('/api/auth',      authRoutes);
app.use('/api/profile',   profileRoutes);
app.use('/api/exercises', exerciseRoutes); 
app.use('/api/activity', activityRoutes);
app.use('/api/nutrition',nutritionRoutes);
app.use('/api/progress', progressRoutes);
app.use('/api/notifications', notificationRoutes);
app.use('/api/ai',            aiRoutes);

// ── 404 handler ───────────────────────────────────────────────────────────
app.use((req, res) => {
  res.status(404).json({
    success: false,
    message: `Route ${req.method} ${req.path} not found`,
  });
});

// ── Global error handler ──────────────────────────────────────────────────
app.use((err, req, res, next) => {
  console.error("Unhandled error:", err);
  res.status(500).json({ success: false, message: "Internal server error" });
});

module.exports = app;
