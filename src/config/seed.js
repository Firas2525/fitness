require('dotenv').config({ path: require('path').join(__dirname, '../../.env') });
const db = require('./db');

const exercises = [
    { name: 'Running',           goal: 'weight_loss',     sets: 1, reps: null, duration_s: 1200, met_value: 8.0 },
    { name: 'Jump Rope',         goal: 'weight_loss',     sets: 3, reps: 30,   duration_s: 60,   met_value: 10.0 },
    { name: 'Burpees',           goal: 'weight_loss',     sets: 3, reps: 15,   duration_s: 45,   met_value: 8.0 },
    { name: 'Cycling',           goal: 'weight_loss',     sets: 1, reps: null, duration_s: 1800, met_value: 7.5 },
    { name: 'Mountain Climbers', goal: 'weight_loss',     sets: 3, reps: 20,   duration_s: 40,   met_value: 8.0 },
    { name: 'Bench Press',       goal: 'muscle_gain',     sets: 4, reps: 10,   duration_s: 60,   met_value: 5.0 },
    { name: 'Squats',            goal: 'muscle_gain',     sets: 4, reps: 12,   duration_s: 60,   met_value: 5.0 },
    { name: 'Deadlift',          goal: 'muscle_gain',     sets: 3, reps: 8,    duration_s: 90,   met_value: 6.0 },
    { name: 'Pull Ups',          goal: 'muscle_gain',     sets: 3, reps: 10,   duration_s: 45,   met_value: 5.0 },
    { name: 'Shoulder Press',    goal: 'muscle_gain',     sets: 3, reps: 12,   duration_s: 60,   met_value: 4.5 },
    { name: 'Push Ups',          goal: 'general_fitness', sets: 3, reps: 15,   duration_s: 45,   met_value: 4.0 },
    { name: 'Plank',             goal: 'general_fitness', sets: 3, reps: null, duration_s: 60,   met_value: 3.5 },
    { name: 'Walking',           goal: 'general_fitness', sets: 1, reps: null, duration_s: 1800, met_value: 3.5 },
    { name: 'Yoga',              goal: 'general_fitness', sets: 1, reps: null, duration_s: 2400, met_value: 2.5 },
    { name: 'Stretching',        goal: 'general_fitness', sets: 1, reps: null, duration_s: 600,  met_value: 2.0 },
];

async function seed() {
    try {
    await db.query('DELETE FROM exercises');
    for (const ex of exercises) {
        await db.query(
        `INSERT INTO exercises (name, goal, sets, reps, duration_s, met_value)
        VALUES (?, ?, ?, ?, ?, ?)`,
        [ex.name, ex.goal, ex.sets, ex.reps, ex.duration_s, ex.met_value]
    );
    }
    console.log(`Seeded ${exercises.length} exercises`);
    process.exit(0);
    } catch (err) {
    console.error('Seed failed:', err.message);
    process.exit(1);
    }
}

seed();