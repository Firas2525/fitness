const db = require('../config/db');

// POST /api/activity
exports.log = async (req, res) => {
    try {
        const { steps, workout_min, weight_kg, exercise_id } = req.body;

    // at least one field required
        if (!steps && !workout_min && !weight_kg) {
        return res.status(400).json({
            success: false,
            message: 'Provide at least one field: steps, workout_min, or weight_kg',
        });
    }

    // get profile weight as fallback
        const [profiles] = await db.query(
        'SELECT weight_kg FROM profiles WHERE user_id = ?',
        [req.user.id]
        );
        const profileWeight = profiles[0]?.weight_kg;
        const actualWeight  = weight_kg || profileWeight;

    // calculate calories burned
        let caloriesBurned = 0;
        if (exercise_id && workout_min && actualWeight) {
        const [exercises] = await db.query(
            'SELECT met_value FROM exercises WHERE id = ?',
            [exercise_id]
        );
        if (exercises.length > 0) {
            const met      = parseFloat(exercises[0].met_value);
            caloriesBurned = Math.round(met * actualWeight * (workout_min / 60));
        }
    }

    // check if today's log exists — upsert
        const [existing] = await db.query(
        'SELECT id FROM daily_logs WHERE user_id = ? AND log_date = CURDATE()',
        [req.user.id]
    );

        if (existing.length > 0) {
        // UPDATE — only overwrite fields that were sent
        await db.query(
            `UPDATE daily_logs SET
            steps           = COALESCE(?, steps),
            workout_min     = COALESCE(?, workout_min),
            weight_kg       = COALESCE(?, weight_kg),
            calories_burned = COALESCE(?, calories_burned)
            WHERE user_id = ? AND log_date = CURDATE()`,
            [steps, workout_min, weight_kg, caloriesBurned || null, req.user.id]
        );
        } else {
        // INSERT — new row for today
        await db.query(
            `INSERT INTO daily_logs
            (user_id, log_date, steps, workout_min, weight_kg, calories_burned)
            VALUES (?, CURDATE(), ?, ?, ?, ?)`,
            [req.user.id, steps || 0, workout_min || 0, weight_kg, caloriesBurned]
        );
    }

    // return the saved record
        const [rows] = await db.query(
        'SELECT * FROM daily_logs WHERE user_id = ? AND log_date = CURDATE()',
        [req.user.id]
        );

        res.status(201).json({
        success: true,
        message: 'Activity logged',
        data: rows[0],
        });

    } catch (err) {
        console.error('log activity error:', err);
        res.status(500).json({ success: false, message: 'Server error' });
    }
};

//GET /api/activity
exports.getAll = async (req, res) => {
    try {
        const [rows] = await db.query(
        'SELECT * FROM daily_logs WHERE user_id = ? ORDER BY log_date DESC',
        [req.user.id]
        );
        res.json({ success: true, count: rows.length, data: rows });
    } catch (err) {
        console.error('getAll activity error:', err);
        res.status(500).json({ success: false, message: 'Server error' });
    }
};

// GET /api/activity/today
exports.getToday = async (req, res) => {
    try {
        const [rows] = await db.query(
        'SELECT * FROM daily_logs WHERE user_id = ? AND log_date = CURDATE()',
        [req.user.id]
        );

        if (rows.length === 0) {
        return res.json({
            success: true,
            message: 'No activity logged yet today',
            data: null,
        });
        }

        res.json({ success: true, data: rows[0] });
    } catch (err) {
        console.error('getToday error:', err);
        res.status(500).json({ success: false, message: 'Server error' });
    }
};