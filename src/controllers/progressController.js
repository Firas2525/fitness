const db = require('../config/db');

// ── helper: format chart data ─────────────────────────────────────────────
function toChart(rows, valueKey) {
    return {
    labels: rows.map(r => r.log_date.toISOString().split('T')[0]),
    values: rows.map(r => r[valueKey]),
    };
}

// ── helper: calculate streak ──────────────────────────────────────────────
function calcStreak(rows) {
    if (rows.length === 0) return 0;
    let streak  = 1;
    let best    = 1;
    for (let i = 1; i < rows.length; i++) {
    const prev = new Date(rows[i-1].log_date);
    const curr = new Date(rows[i].log_date);
    const diff = (curr - prev) / (1000 * 60 * 60 * 24);
    if (diff === 1) { streak++; best = Math.max(best, streak); }
    else streak = 1;
    }
    return best;
}

// ── GET /api/progress/weight ──────────────────────────────────────────────
exports.getWeight = async (req, res) => {
    try {
    const [rows] = await db.query(
        `SELECT log_date, weight_kg
        FROM daily_logs
        WHERE user_id = ? AND weight_kg IS NOT NULL
        ORDER BY log_date ASC
        LIMIT 30`,
        [req.user.id]
    );

    if (rows.length === 0) {
        return res.json({
        success: true,
        message: 'No weight data yet',
        data: { labels: [], values: [] },
        });
    }

    const chart     = toChart(rows, 'weight_kg');
    const first     = parseFloat(rows[0].weight_kg);
    const last      = parseFloat(rows[rows.length-1].weight_kg);
    const change    = parseFloat((last - first).toFixed(2));

    res.json({
        success: true,
        data: {
        chart,
        stats: {
            starting_weight: first,
            current_weight:  last,
            change,
            trend: change < 0 ? 'losing' : change > 0 ? 'gaining' : 'stable',
        },
        },
    });
    } catch (err) {
    console.error('getWeight error:', err);
    res.status(500).json({ success: false, message: 'Server error' });
    }
};

// ── GET /api/progress/calories ────────────────────────────────────────────
exports.getCalories = async (req, res) => {
    try {
    const [rows] = await db.query(
        `SELECT log_date, calories_burned
        FROM daily_logs
        WHERE user_id = ? AND calories_burned > 0
        ORDER BY log_date ASC
        LIMIT 30`,
        [req.user.id]
    );

    if (rows.length === 0) {
        return res.json({
        success: true,
        message: 'No calories data yet',
        data: { labels: [], values: [] },
        });
    }

    const chart   = toChart(rows, 'calories_burned');
    const total   = rows.reduce((s, r) => s + r.calories_burned, 0);
    const avg     = Math.round(total / rows.length);

    res.json({
        success: true,
        data: {
        chart,
        stats: {
            total_burned: total,
            avg_per_day:  avg,
            best_day:     Math.max(...rows.map(r => r.calories_burned)),
        },
        },
    });
    } catch (err) {
    console.error('getCalories error:', err);
    res.status(500).json({ success: false, message: 'Server error' });
    }
};

// ── GET /api/progress/steps ───────────────────────────────────────────────
exports.getSteps = async (req, res) => {
    try {
    const [rows] = await db.query(
        `SELECT log_date, steps
        FROM daily_logs
        WHERE user_id = ? AND steps > 0
        ORDER BY log_date ASC
        LIMIT 30`,
        [req.user.id]
    );

    if (rows.length === 0) {
        return res.json({
        success: true,
        message: 'No steps data yet',
        data: { labels: [], values: [] },
        });
    }

    const chart = toChart(rows, 'steps');
    const total = rows.reduce((s, r) => s + r.steps, 0);
    const avg   = Math.round(total / rows.length);

    res.json({
        success: true,
        data: {
        chart,
        stats: {
            total_steps: total,
            avg_per_day: avg,
            best_day:    Math.max(...rows.map(r => r.steps)),
        },
        },
    });
    } catch (err) {
    console.error('getSteps error:', err);
    res.status(500).json({ success: false, message: 'Server error' });
    }
};
// ── GET /api/progress/summary ─────────────────────────────────────────────
exports.getSummary = async (req, res) => {
    try {
    // last 7 days
    const [week] = await db.query(
        `SELECT log_date, weight_kg, steps, workout_min, calories_burned
        FROM daily_logs
        WHERE user_id = ?
        AND log_date >= DATE_SUB(CURDATE(), INTERVAL 7 DAY)
        ORDER BY log_date ASC`,
        [req.user.id]
    );

    // last 30 days for streak
    const [month] = await db.query(
        `SELECT log_date FROM daily_logs
        WHERE user_id = ? AND workout_min > 0
        ORDER BY log_date ASC`,
        [req.user.id]
    );

    const activeDays   = week.filter(r => r.workout_min > 0).length;
    const totalCal     = week.reduce((s, r) => s + (r.calories_burned || 0), 0);
    const totalSteps   = week.reduce((s, r) => s + (r.steps || 0), 0);
    const totalWorkout = week.reduce((s, r) => s + (r.workout_min || 0), 0);

    const weights      = week.filter(r => r.weight_kg).map(r => parseFloat(r.weight_kg));
    const avgWeight    = weights.length > 0
        ? parseFloat((weights.reduce((s, w) => s + w, 0) / weights.length).toFixed(2))
        : null;   

    const streak = calcStreak(month);

    res.json({
        success: true,
        data: {
        period: 'last_7_days',
        active_days:           activeDays,
        total_calories_burned: totalCal,
        total_steps:           totalSteps,
        total_workout_min:     totalWorkout,
        avg_weight:            avgWeight,
        longest_streak:        streak,
        streak_unit:           'days',
    },
    });
    } catch (err) {
    console.error('getSummary error:', err);
    res.status(500).json({ success: false, message: 'Server error' });
    }
};