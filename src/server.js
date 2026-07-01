require('dotenv').config();
const app = require('./app');
const db  = require('./config/db');

const PORT = process.env.PORT || 3000;

async function start() {
  try {
    // Verify DB connection on startup
    await db.query('SELECT 1');
    console.log(' Database connected');

    app.listen(PORT, () => {
      console.log(` Fitness API running on http://localhost:${PORT}`);
      console.log(`   Environment: ${process.env.NODE_ENV || 'development'}`);
    });
  } catch (err) {
    console.error(' Failed to connect to database:', err.message);
    process.exit(1);
  }
}

start();
