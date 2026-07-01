const db      = require('../config/db');
const fitness = require('../utils/fitness');

// ── Get profile ───────────────────────────────────────────────────────────
exports.getProfile = async (req, res) => {
  try {
    const [rows] = await db.query(
      'SELECT * FROM profiles WHERE user_id = ?',
      [req.user.id]
    );

    if (rows.length === 0) {
      return res.status(404).json({ success: false, message: 'Profile not found. Please create one.' });
    }

    const profile = rows[0];
    const stats   = _calcStats(profile);

    res.json({ success: true, data: { ...profile, stats } });
  } catch (err) {
    console.error('getProfile error:', err);
    res.status(500).json({ success: false, message: 'Server error' });
  }
};

// ── Create profile ────────────────────────────────────────────────────────
exports.createProfile = async (req, res) => {
  const { full_name, age, gender, height_cm, weight_kg, activity_level, goal } = req.body;
  try {
    const [existing] = await db.query('SELECT id FROM profiles WHERE user_id = ?', [req.user.id]);
    if (existing.length > 0) {
      return res.status(409).json({ success: false, message: 'Profile already exists. Use PUT to update.' });
    }

    await db.query(
      `INSERT INTO profiles (user_id, full_name, age, gender, height_cm, weight_kg, activity_level, goal)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
      [req.user.id, full_name, age, gender, height_cm, weight_kg, activity_level || 'sedentary', goal || 'general_fitness']
    );

    const [rows] = await db.query('SELECT * FROM profiles WHERE user_id = ?', [req.user.id]);
    const stats  = _calcStats(rows[0]);

    res.status(201).json({
      success: true,
      message: 'Profile created',
      data: { ...rows[0], stats },
    });
  } catch (err) {
    console.error('createProfile error:', err);
    res.status(500).json({ success: false, message: 'Server error' });
  }
};

// ── Update profile ────────────────────────────────────────────────────────
exports.updateProfile = async (req, res) => {
  const fields  = ['full_name', 'age', 'gender', 'height_cm', 'weight_kg', 'activity_level', 'goal'];
  const updates = {};
  fields.forEach(f => { if (req.body[f] !== undefined) updates[f] = req.body[f]; });

  if (Object.keys(updates).length === 0) {
    return res.status(400).json({ success: false, message: 'No fields provided to update' });
  }

  try {
    const setClauses = Object.keys(updates).map(k => `${k} = ?`).join(', ');
    const values     = [...Object.values(updates), req.user.id];
    await db.query(`UPDATE profiles SET ${setClauses} WHERE user_id = ?`, values);

    const [rows] = await db.query('SELECT * FROM profiles WHERE user_id = ?', [req.user.id]);
    if (rows.length === 0) {
      return res.status(404).json({ success: false, message: 'Profile not found' });
    }

    const stats = _calcStats(rows[0]);
    res.json({ success: true, message: 'Profile updated', data: { ...rows[0], stats } });
  } catch (err) {
    console.error('updateProfile error:', err);
    res.status(500).json({ success: false, message: 'Server error' });
  }
};

// ── Get stats only (BMI / BMR / TDEE) ────────────────────────────────────
exports.getStats = async (req, res) => {
  try {
    const [rows] = await db.query('SELECT * FROM profiles WHERE user_id = ?', [req.user.id]);
    if (rows.length === 0) {
      return res.status(404).json({ success: false, message: 'Profile not found' });
    }

    const stats = _calcStats(rows[0]);
    if (!stats) {
      return res.status(422).json({
        success: false,
        message: 'Profile is incomplete. Please provide age, gender, height, and weight.',
      });
    }

    res.json({ success: true, data: stats });
  } catch (err) {
    console.error('getStats error:', err);
    res.status(500).json({ success: false, message: 'Server error' });
  }
};

// ── Internal helper ───────────────────────────────────────────────────────
function _calcStats(profile) {
  const { weight_kg, height_cm, age, gender, activity_level } = profile;
  if (!weight_kg || !height_cm || !age || !gender) return null;

  const bmi        = fitness.calculateBMI(weight_kg, height_cm);
  const bmiClass   = fitness.classifyBMI(bmi);
  const bmr        = fitness.calculateBMR(weight_kg, height_cm, age, gender);
  const tdee       = fitness.calculateTDEE(bmr, activity_level);

  return { bmi, bmi_classification: bmiClass, bmr, tdee };
}
