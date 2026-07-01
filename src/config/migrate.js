require('dotenv').config({ path: require('path').join(__dirname, '../../.env') });
const mysql = require('mysql2/promise');

async function migrate() {
  const connectionConfig = {
    host: process.env.DB_HOST,
    port: process.env.DB_PORT,
    user: process.env.DB_USER,
    password: process.env.DB_PASSWORD,
    multipleStatements: true,
  };

  if (process.env.DB_SSL === 'true') {
    connectionConfig.ssl = {
      rejectUnauthorized: true,
    };
  }

  const conn = await mysql.createConnection(connectionConfig);

  console.log('Connected. Running migrations...');

  await conn.query(`CREATE DATABASE IF NOT EXISTS \`${process.env.DB_NAME}\`;`);
  await conn.query(`USE \`${process.env.DB_NAME}\`;`);

  // ── USERS ───────────────────────────────────────────────────────────────
  await conn.query(`
    CREATE TABLE IF NOT EXISTS users (
      id          INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
      email       VARCHAR(255) NOT NULL UNIQUE,
      password    VARCHAR(255) NOT NULL,
      created_at  TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      updated_at  TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
  `);

  // ── PROFILES ─────────────────────────────────────────────────────────────
  await conn.query(`
    CREATE TABLE IF NOT EXISTS profiles (
      id              INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
      user_id         INT UNSIGNED NOT NULL UNIQUE,
      full_name       VARCHAR(100),
      age             TINYINT UNSIGNED,
      gender          ENUM('male','female') NOT NULL,
      height_cm       DECIMAL(5,2),
      weight_kg       DECIMAL(5,2),
      activity_level  ENUM('sedentary','lightly_active','moderately_active','very_active','extra_active') DEFAULT 'sedentary',
      goal            ENUM('weight_loss','muscle_gain','general_fitness') DEFAULT 'general_fitness',
      created_at      TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      updated_at      TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
      FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
  `);

  // ── EXERCISES ────────────────────────────────────────────────────────────
  await conn.query(`
    CREATE TABLE IF NOT EXISTS exercises (
      id          INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
      name        VARCHAR(150) NOT NULL,
      goal        ENUM('weight_loss','muscle_gain','general_fitness') NOT NULL,
      sets        TINYINT UNSIGNED,
      reps        TINYINT UNSIGNED,
      duration_s  SMALLINT UNSIGNED COMMENT 'duration per set in seconds',
      met_value   DECIMAL(4,2) NOT NULL DEFAULT 4.0 COMMENT 'MET for calorie burn calc',
      image_url   VARCHAR(500),
      created_at  TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
  `);

  // ── DAILY LOGS ───────────────────────────────────────────────────────────
  await conn.query(`
    CREATE TABLE IF NOT EXISTS daily_logs (
      id              INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
      user_id         INT UNSIGNED NOT NULL,
      log_date        DATE NOT NULL,
      weight_kg       DECIMAL(5,2),
      steps           MEDIUMINT UNSIGNED DEFAULT 0,
      workout_min     SMALLINT UNSIGNED DEFAULT 0,
      calories_burned SMALLINT UNSIGNED DEFAULT 0,
      created_at      TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      updated_at      TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
      UNIQUE KEY uq_user_date (user_id, log_date),
      FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
  `);

  // ── MEALS ────────────────────────────────────────────────────────────────
  await conn.query(`
    CREATE TABLE IF NOT EXISTS meals (
      id            INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
      name          VARCHAR(150) NOT NULL,
      meal_type     ENUM('breakfast','lunch','dinner','snack') NOT NULL,
      calories      SMALLINT UNSIGNED NOT NULL,
      protein_g     DECIMAL(5,2),
      carbs_g       DECIMAL(5,2),
      fat_g         DECIMAL(5,2),
      created_at    TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
  `);

  // ── MEAL LOGS ─────────────────────────────────────────────────────────────
  await conn.query(`
    CREATE TABLE IF NOT EXISTS meal_logs (
      id          INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
      user_id     INT UNSIGNED NOT NULL,
      meal_id     INT UNSIGNED NOT NULL,
      log_date    DATE NOT NULL,
      servings    DECIMAL(3,1) DEFAULT 1.0,
      created_at  TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
      FOREIGN KEY (meal_id) REFERENCES meals(id) ON DELETE CASCADE
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
  `);

  // ── PASSWORD RESET TOKENS ────────────────────────────────────────────────
  await conn.query(`
    CREATE TABLE IF NOT EXISTS password_resets (
      id          INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
      user_id     INT UNSIGNED NOT NULL,
      token       VARCHAR(255) NOT NULL,
      expires_at  DATETIME NOT NULL,
      used        BOOLEAN DEFAULT FALSE,
      created_at  TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
  `);

  // ── NOTIFICATION SETTINGS ─────────────────────────────────────────────── ← جديد
  await conn.query(`
    CREATE TABLE IF NOT EXISTS notification_settings (
      id                   INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
      user_id              INT UNSIGNED NOT NULL UNIQUE,
      workout_reminder     BOOLEAN DEFAULT TRUE,
      workout_time         TIME DEFAULT '18:00:00',
      water_reminder       BOOLEAN DEFAULT TRUE,
      water_interval_hours TINYINT UNSIGNED DEFAULT 2,
      updated_at           TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
      FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
  `);

await conn.query(
  `CREATE TABLE IF NOT EXISTS ai_conversations (
    id         INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    user_id    INT UNSIGNED NOT NULL,
    question   TEXT NOT NULL,
    answer     TEXT NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
  ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
`);

  console.log(' All tables created successfully.');
    await conn.end();
}

module.exports = migrate;

if (require.main === module) {
  migrate().catch(err => {
    console.error('Migration failed:', err.message);
    process.exit(1);
  });
}

