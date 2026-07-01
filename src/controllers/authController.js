const bcrypt   = require('bcryptjs');
const jwt      = require('jsonwebtoken');
const crypto   = require('crypto');
const db       = require('../config/db');

// ── Register ──────────────────────────────────────────────────────────────
exports.register = async (req, res) => {
  const { email, password } = req.body;
  try {
    const [existing] = await db.query('SELECT id FROM users WHERE email = ?', [email]);
    if (existing.length > 0) {
      return res.status(409).json({ success: false, message: 'Email already in use' });
    }

    const hashed = await bcrypt.hash(password, 12);
    const [result] = await db.query(
      'INSERT INTO users (email, password) VALUES (?, ?)',
      [email, hashed]
    );

    const token = jwt.sign({ id: result.insertId, email }, process.env.JWT_SECRET, {
      expiresIn: process.env.JWT_EXPIRES_IN,
    });

    res.status(201).json({
      success: true,
      message: 'Account created successfully',
      data: { token, user: { id: result.insertId, email } },
    });
  } catch (err) {
    console.error('register error:', err.message, err.code || '', err.sqlMessage || '');
    console.error(err.stack);
    res.status(500).json({ success: false, message: 'Server error' });
  }
};

// ── Login ─────────────────────────────────────────────────────────────────
exports.login = async (req, res) => {
  const { email, password } = req.body;
  try {
    const [rows] = await db.query('SELECT * FROM users WHERE email = ?', [email]);
    if (rows.length === 0) {
      return res.status(401).json({ success: false, message: 'Invalid credentials' });
    }

    const user = rows[0];
    const match = await bcrypt.compare(password, user.password);
    if (!match) {
      return res.status(401).json({ success: false, message: 'Invalid credentials' });
    }

    const token = jwt.sign({ id: user.id, email: user.email }, process.env.JWT_SECRET, {
      expiresIn: process.env.JWT_EXPIRES_IN,
    });

    res.json({
      success: true,
      message: 'Login successful',
      data: { token, user: { id: user.id, email: user.email } },
    });
  } catch (err) {
    console.error('login error:', err.message, err.code || '', err.sqlMessage || '');
    console.error(err.stack);
    res.status(500).json({ success: false, message: 'Server error' });
  }
};

// ── Request password reset ────────────────────────────────────────────────
exports.requestPasswordReset = async (req, res) => {
  const { email } = req.body;
  try {
    const [rows] = await db.query('SELECT id FROM users WHERE email = ?', [email]);
    // Always respond 200 to avoid email enumeration
    if (rows.length === 0) {
      return res.json({ success: true, message: 'If that email exists, a reset token was generated' });
    }

    const token     = crypto.randomBytes(32).toString('hex');
    const expiresAt = new Date(Date.now() + 3600 * 1000); // 1 hour

    await db.query(
      'INSERT INTO password_resets (user_id, token, expires_at) VALUES (?, ?, ?)',
      [rows[0].id, token, expiresAt]
    );

    // In production: send email with token. Here we return it directly for dev.
    res.json({
      success: true,
      message: 'Reset token generated',
      data: { reset_token: token }, // REMOVE in production, send via email instead
    });
  } catch (err) {
    console.error('password reset error:', err.message, err.code || '', err.sqlMessage || '');
    console.error(err.stack);
    res.status(500).json({ success: false, message: 'Server error' });
  }
};

// ── Confirm password reset ────────────────────────────────────────────────
exports.resetPassword = async (req, res) => {
  const { token, new_password } = req.body;
  try {
    const [rows] = await db.query(
        `SELECT pr.*, u.id as uid FROM password_resets pr
        JOIN users u ON u.id = pr.user_id
        WHERE pr.token = ? AND pr.used = FALSE AND pr.expires_at > NOW()`,
      [token]
    );

    if (rows.length === 0) {
      return res.status(400).json({ success: false, message: 'Invalid or expired token' });
    }

    const hashed = await bcrypt.hash(new_password, 12);
    await db.query('UPDATE users SET password = ? WHERE id = ?', [hashed, rows[0].uid]);
    await db.query('UPDATE password_resets SET used = TRUE WHERE id = ?', [rows[0].id]);

    res.json({ success: true, message: 'Password updated successfully' });
  } catch (err) {
    console.error('reset password error:', err);
    res.status(500).json({ success: false, message: 'Server error' });
  }
};
