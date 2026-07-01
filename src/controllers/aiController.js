const db   = require('../config/db');
const axios = require('axios');

const SYSTEM_PROMPT = `You are a fitness and nutrition assistant. 
You only answer questions related to:
- Exercise and workouts
- Nutrition and meals
- Weight management
- General health and wellness

If the question is outside these topics, politely decline and redirect to fitness/nutrition topics.
Keep answers concise, practical, and encouraging.
Always respond in the same language the user writes in.`;

// ── POST /api/ai ──────────────────────────────────────────────────────────
exports.ask = async (req, res) => {
    try {
        const { question } = req.body;

        if (!question || question.trim().length === 0) {
            return res.status(400).json({
                success: false,
                message: 'Question is required',
                });
            }

        if (question.trim().length > 500) {
            return res.status(400).json({
                success: false,
                message: 'Question too long. Max 500 characters.',
                });
            }

    // get user profile for context
    const [profiles] = await db.query(
        'SELECT goal, weight_kg, activity_level FROM profiles WHERE user_id = ?',
        [req.user.id]
    );

    const profile = profiles[0];
    const context = profile
        ? `User context: goal=${profile.goal}, weight=${profile.weight_kg}kg, activity=${profile.activity_level}.`
        : '';

    // call OpenRouter API
    const response = await axios.post(
        'https://openrouter.ai/api/v1/chat/completions',
        {
        model: 'openai/gpt-oss-20b:free',
        messages: [
            { role: 'system', content: SYSTEM_PROMPT },
            { role: 'user',   content: `${context}\n\nQuestion: ${question}` },
        ],
        },
        {
        headers: {
            'Authorization':  `Bearer ${process.env.OPENROUTER_API_KEY}`,
            'Content-Type':   'application/json',
            'HTTP-Referer':   'http://localhost:3000',
            'X-Title':        'Fitness App',
            },
        }
    );

    const answer = response.data.choices[0].message.content;

    // save to database
    await db.query(
        'INSERT INTO ai_conversations (user_id, question, answer) VALUES (?, ?, ?)',
        [req.user.id, question.trim(), answer]
    );

    res.json({
        success: true,
        data: {
        question: question.trim(),
        answer,
        },
    });

    } catch (err) {
    console.error('AI ask error:', err.response?.data || err.message);
    res.status(500).json({ success: false, message: 'Server error' });
    }
};

// ── GET /api/ai/history ───────────────────────────────────────────────────
exports.getHistory = async (req, res) => {
    try {
    const [rows] = await db.query(
        `SELECT id, question, answer, created_at
        FROM ai_conversations
        WHERE user_id = ?
        ORDER BY created_at DESC
        LIMIT 20`,
        [req.user.id]
    );

    res.json({
        success: true,
        count: rows.length,
        data: rows,
    });
    } catch (err) {
    console.error('AI history error:', err);
    res.status(500).json({ success: false, message: 'Server error' });
    }
};

// ── DELETE /api/ai/history ────────────────────────────────────────────────
exports.deleteHistory = async (req, res) => {
    try {
        await db.query(
        'DELETE FROM ai_conversations WHERE user_id = ?',
        [req.user.id]
    );

    res.json({
        success: true,
        message: 'Conversation history cleared',
    });
    } catch (err) {
    console.error('AI delete history error:', err);
    res.status(500).json({ success: false, message: 'Server error' });
    }
};