const mysql = require('mysql2/promise');

const poolConfig = {
  host: process.env.DB_HOST,
  port: process.env.DB_PORT,
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
  database: process.env.DB_NAME,
  waitForConnections: true,
  connectionLimit: 10,
  queueLimit: 0,
};

if (process.env.DB_SSL === 'true') {
  poolConfig.ssl = {
    rejectUnauthorized: true,
  };
}

const pool = mysql.createPool(poolConfig);

module.exports = pool;
