require('dotenv').config();
const app = require('./app');
const db  = require('./config/db');
const migrate = require('./config/migrate');

const PORT = process.env.PORT || 3000;

async function start() {
  try {
    // Create database tables if they don't exist
    await migrate();

    // Verify DB connection on startup
    await db.query('SELECT 1');
    console.log(' Database connected');

    app.listen(PORT, () => {
      console.log(` Fitness API running on http://localhost:${PORT}`);
      console.log(`   Environment: ${process.env.NODE_ENV || 'development'}`);
    });
  } catch (err) {
    console.error(' Failed to start server:', err.message);
    process.exit(1);
  }
}

start();
