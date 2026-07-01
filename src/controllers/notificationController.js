const db = require('../config/db');

// GET /api/notifications/settings
exports.getSettings = async (req, res) => {
    try {
        const [rows] = await db.query(
        `SELECT * FROM notification_settings WHERE user_id = ?`,
        [req.user.id]
        );

    // if no settings yet → return defaults
        if (rows.length === 0) {
            return res.json({
                success: true,
                data: {
                    workout_reminder:     true,
                    workout_time:         '18:00',
                    water_reminder:       true,
                    water_interval_hours: 2,
                    },
        });
    }

        res.json({ success: true, data: rows[0] });
        } catch (err) {
        console.error('getSettings error:', err);
        res.status(500).json({ success: false, message: 'Server error' });
    }
};

// PUT /api/notifications/settings
exports.updateSettings = async (req, res) => {
    try {
        const {
        workout_reminder,
        workout_time,
        water_reminder,
        water_interval_hours,
        } = req.body;

        const [existing] = await db.query(
            `SELECT id FROM notification_settings WHERE user_id = ?`,
        [req.user.id]
    );

    if (existing.length > 0) {
      // UPDATE existing settings
        await db.query(
            `UPDATE notification_settings SET
            workout_reminder     = COALESCE(?, workout_reminder),
            workout_time         = COALESCE(?, workout_time),
            water_reminder       = COALESCE(?, water_reminder),
            water_interval_hours = COALESCE(?, water_interval_hours)
            WHERE user_id = ?`,
            [workout_reminder, workout_time, water_reminder, water_interval_hours, req.user.id]
        );
        } else {
      // INSERT default + provided values
        await db.query(
            `INSERT INTO notification_settings
            (user_id, workout_reminder, workout_time, water_reminder, water_interval_hours)
            VALUES (?, ?, ?, ?, ?)`,
            [
            req.user.id,
            workout_reminder     ?? true,
            workout_time         ?? '18:00:00',
            water_reminder       ?? true,
            water_interval_hours ?? 2,
            ]
        );
        }

        const [rows] = await db.query(
        `'SELECT * FROM notification_settings WHERE user_id = ?'`,
        [req.user.id]
    );

        res.json({
            success: true,
            message: 'Notification settings updated',
            data: rows[0],
    });
    } catch (err) {
        console.error('updateSettings error:', err);
        res.status(500).json({ success: false, message: 'Server error' });
    }
};