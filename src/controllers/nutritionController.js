const db      = require('../config/db');
const fitness = require('../utils/fitness');

// get user TDEE ─────────────────────────────────────────────────
async function getUserTDEE(userId) {
    const [profiles] = await db.query(
    'SELECT * FROM profiles WHERE user_id = ?',
    [userId]
    );
    if (profiles.length === 0) return null;

    const p   = profiles[0];
    const bmr = fitness.calculateBMR(p.weight_kg, p.height_cm, p.age, p.gender);
    return {
        tdee:   fitness.calculateTDEE(bmr, p.activity_level),
        goal:   p.goal || 'general_fitness',
    };
}

// ── POST /api/nutrition/log ───────────────────────────────────────────────
exports.logMeal = async (req, res) => {
    try {
        const { meal_id, servings = 1 } = req.body;

        if (!meal_id) {
            return res.status(400).json({
                success: false,
                message: 'meal_id is required',
        });
    }

    // verify meal exists
        const [meals] = await db.query(
        'SELECT * FROM meals WHERE id = ?',
        [meal_id]
        );
        if (meals.length === 0) {
            return res.status(404).json({
            success: false,
            message: 'Meal not found',
        });
    }

    const meal            = meals[0];
    const actualCalories  = Math.round(meal.calories * servings);

    // insert meal log
    await db.query(
        `INSERT INTO meal_logs (user_id, meal_id, log_date, servings)
        VALUES (?, ?, CURDATE(), ?)`,
        [req.user.id, meal_id, servings]
    );

    // get today's total consumed
    const [totals] = await db.query(
        `SELECT SUM(m.calories * ml.servings) as total_calories
        FROM meal_logs ml
        JOIN meals m ON m.id = ml.meal_id
        WHERE ml.user_id = ? AND ml.log_date = CURDATE()`,
        [req.user.id]
    );

    const consumed = Math.round(totals[0].total_calories || 0);
    const profile  = await getUserTDEE(req.user.id);
    const required = Math.round(profile?.tdee || 2000);

    res.status(201).json({
        success: true,
        message: 'Meal logged',
        data: {
        logged_meal: {
            name:     meal.name,
            calories: actualCalories,
            servings,
        },
        today_summary: {
            required,
            consumed,
            remaining: required - consumed,
          status:    consumed < required * 0.9  ? 'under_target'
                   : consumed <= required * 1.1 ? 'on_track'
                    : 'over_target',
        },
        },
    });
    } catch (err) {
    console.error('logMeal error:', err);
    res.status(500).json({ success: false, message: 'Server error' });
    }
};

// ── GET /api/nutrition/suggest ────────────────────────────────────────────
exports.suggest = async (req, res) => {
    try {
        const profile = await getUserTDEE(req.user.id);
        if (!profile) {
            return res.status(404).json({
            success: false,
            message: 'Profile not found. Please create your profile first.',
        });
    }

    const [meals] = await db.query(
      'SELECT * FROM meals ORDER BY meal_type, id',
    );

    // group by meal_type
    const grouped = { breakfast: [], lunch: [], dinner: [] };
    meals.forEach(m => {
        if (grouped[m.meal_type]) grouped[m.meal_type].push(m);
    });

    res.json({
        success: true,
        data: {
        daily_target_calories: Math.round(profile.tdee),
        goal: profile.goal,
        suggestions: grouped,
        },
    });
    } catch (err) {
    console.error('suggest meals error:', err);
    res.status(500).json({ success: false, message: 'Server error' });
    }
};

// ── GET /api/nutrition/today ──────────────────────────────────────────────
exports.getToday = async (req, res) => {
    try {
        const profile = await getUserTDEE(req.user.id);
        const required = Math.round(profile?.tdee || 2000);

        const [logs] = await db.query(
        `SELECT ml.id, ml.servings, ml.log_date,
                m.name, m.meal_type, m.calories,
                m.protein_g, m.carbs_g, m.fat_g,
                ROUND(m.calories * ml.servings) as total_calories
                FROM meal_logs ml
                JOIN meals m ON m.id = ml.meal_id
                WHERE ml.user_id = ? AND ml.log_date = CURDATE()

            ORDER BY ml.id ASC`,
            [req.user.id]
    );

    const consumed     = logs.reduce((sum, r) => sum + r.total_calories, 0);
    const totalProtein = logs.reduce((sum, r) => sum + (r.protein_g * r.servings), 0);
    const totalCarbs   = logs.reduce((sum, r) => sum + (r.carbs_g   * r.servings), 0);
    const totalFat     = logs.reduce((sum, r) => sum + (r.fat_g     * r.servings), 0);

    res.json({
        success: true,
        data: {
        summary: {
            required,
            consumed:        Math.round(consumed),
            remaining:       Math.round(required - consumed),
            total_protein_g: Math.round(totalProtein),
            total_carbs_g:   Math.round(totalCarbs),
            total_fat_g:     Math.round(totalFat),
            status:          consumed < required * 0.9  ? 'under_target'
                         : consumed <= required * 1.1 ? 'on_track'
                            : 'over_target',
        },
        meals: logs,
    },
    });
} catch (err) {
    console.error('getToday nutrition error:', err);
    res.status(500).json({ success: false, message: 'Server error' });
}
};

// ── GET /api/nutrition/history ────────────────────────────────────────────
exports.getHistory = async (req, res) => {
    try {
        const [logs] = await db.query(
        `SELECT ml.log_date,
            COUNT(ml.id)                          as meals_count,
            ROUND(SUM(m.calories * ml.servings))  as total_calories
        FROM meal_logs ml
        JOIN meals m ON m.id = ml.meal_id
        WHERE ml.user_id = ?
        GROUP BY ml.log_date
        ORDER BY ml.log_date DESC`,
        [req.user.id]
    );

    res.json({ success: true, count: logs.length, data: logs });
        } catch (err) {
    console.error('getHistory error:', err);
    res.status(500).json({ success: false, message: 'Server error' });
    }
};