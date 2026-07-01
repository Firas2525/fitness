const db      = require('../config/db');
const fitness = require('../utils/fitness');


exports.getAll = async (req, res) => {
  try {
    const { goal } = req.query;
    const validGoals = ['weight_loss', 'muscle_gain', 'general_fitness'];

    let query  = 'SELECT * FROM exercises';
    let params = [];

    if (goal) {
        if (!validGoals.includes(goal)) {
        return res.status(400).json({
            success: false,
            message: `Invalid goal. Must be one of: ${validGoals.join(', ')}`,
        });
        }
        query  += ' WHERE goal = ?';
        params  = [goal];
    }

    const [rows] = await db.query(query, params);
    res.json({ success: true, count: rows.length, data: rows });
    } catch (err) {
    console.error('getAll error:', err);
    res.status(500).json({ success: false, message: 'Server error' });
    }
};

exports.suggest = async (req, res) => {
    try {
    const [profiles] = await db.query(
      'SELECT * FROM profiles WHERE user_id = ?',
        [req.user.id]
    );

    if (profiles.length === 0) {
        return res.status(404).json({
        success: false,
        message: 'Profile not found. Please create your profile first.',
        });
    }

    const profile = profiles[0];
    const { weight_kg, height_cm, age, gender, activity_level, goal } = profile;

    if (!weight_kg || !height_cm || !age || !gender) {
        return res.status(422).json({
        success: false,
        message: 'Profile incomplete. Please add age, gender, height and weight.',
        });
    }

    const bmi     = fitness.calculateBMI(weight_kg, height_cm);
    const bmiInfo = fitness.classifyBMI(bmi);
    const bmr     = fitness.calculateBMR(weight_kg, height_cm, age, gender);
    const tdee    = fitness.calculateTDEE(bmr, activity_level);

    const effectiveGoal = goal || (bmi >= 25 ? 'weight_loss' : 'general_fitness');

    const [exercises] = await db.query(
      'SELECT * FROM exercises WHERE goal = ?',
        [effectiveGoal]
    );

    const daysMap = {
        sedentary:         3,
        lightly_active:    3,
        moderately_active: 4,
        very_active:       5,
        extra_active:      6,
    };

    res.json({
        success: true,
        data: {
        profile_stats: {
            bmi,
            bmi_classification: bmiInfo,
            bmr,
            tdee,
        },
        suggested_plan: {
            goal:          effectiveGoal,
            days_per_week: daysMap[activity_level] ?? 3,
            exercises,
        },
        },
    });
    } catch (err) {
    console.error('suggest error:', err);
    res.status(500).json({ success: false, message: 'Server error' });
    }
};