require('dotenv').config({ path: require('path').join(__dirname, '../../.env') });
const db = require('./db');

const meals = [
  // ── Weight Loss ────────────────────────────────────────────────────────
    { name: 'Oatmeal with Banana',        meal_type: 'breakfast', goal: 'weight_loss',     calories: 320, protein_g: 8,  carbs_g: 58, fat_g: 6  },
    { name: 'Greek Yogurt with Berries',  meal_type: 'breakfast', goal: 'weight_loss',     calories: 180, protein_g: 15, carbs_g: 22, fat_g: 2  },
    { name: 'Grilled Chicken Salad',      meal_type: 'lunch',     goal: 'weight_loss',     calories: 350, protein_g: 40, carbs_g: 15, fat_g: 10 },
    { name: 'Tuna with Vegetables',       meal_type: 'lunch',     goal: 'weight_loss',     calories: 300, protein_g: 35, carbs_g: 12, fat_g: 8  },
    { name: 'Vegetable Soup',             meal_type: 'dinner',    goal: 'weight_loss',     calories: 200, protein_g: 10, carbs_g: 28, fat_g: 4  },
    { name: 'Grilled Fish with Salad',    meal_type: 'dinner',    goal: 'weight_loss',     calories: 280, protein_g: 35, carbs_g: 10, fat_g: 8  },

  // ── Muscle Gain ────────────────────────────────────────────────────────
    { name: 'Eggs with Whole Bread',      meal_type: 'breakfast', goal: 'muscle_gain',     calories: 520, protein_g: 30, carbs_g: 45, fat_g: 18 },
    { name: 'Protein Shake with Oats',    meal_type: 'breakfast', goal: 'muscle_gain',     calories: 480, protein_g: 35, carbs_g: 55, fat_g: 8  },
    { name: 'Rice with Chicken Breast',   meal_type: 'lunch',     goal: 'muscle_gain',     calories: 650, protein_g: 50, carbs_g: 75, fat_g: 10 },
    { name: 'Pasta with Beef',            meal_type: 'lunch',     goal: 'muscle_gain',     calories: 700, protein_g: 45, carbs_g: 80, fat_g: 15 },
    { name: 'Tuna with Rice',             meal_type: 'dinner',    goal: 'muscle_gain',     calories: 550, protein_g: 48, carbs_g: 60, fat_g: 8  },
    { name: 'Chicken with Sweet Potato',  meal_type: 'dinner',    goal: 'muscle_gain',     calories: 600, protein_g: 50, carbs_g: 65, fat_g: 10 },

  // ── General Fitness ────────────────────────────────────────────────────
    { name: 'Fruit Salad with Yogurt',    meal_type: 'breakfast', goal: 'general_fitness', calories: 280, protein_g: 10, carbs_g: 45, fat_g: 6  },
    { name: 'Avocado Toast with Eggs',    meal_type: 'breakfast', goal: 'general_fitness', calories: 380, protein_g: 18, carbs_g: 35, fat_g: 18 },
    { name: 'Quinoa Salad with Chicken',  meal_type: 'lunch',     goal: 'general_fitness', calories: 450, protein_g: 35, carbs_g: 45, fat_g: 12 },
    { name: 'Lentil Soup with Bread',     meal_type: 'lunch',     goal: 'general_fitness', calories: 400, protein_g: 20, carbs_g: 60, fat_g: 8  },
    { name: 'Grilled Salmon with Vegs',   meal_type: 'dinner',    goal: 'general_fitness', calories: 420, protein_g: 40, carbs_g: 20, fat_g: 18 },
    { name: 'Chicken Stir Fry',           meal_type: 'dinner',    goal: 'general_fitness', calories: 380, protein_g: 35, carbs_g: 30, fat_g: 12 },
];

async function seedMeals() {
    try {
        await db.query('DELETE FROM meals');
        for (const meal of meals) {
        await db.query(
            `INSERT INTO meals (name, meal_type, calories, protein_g, carbs_g, fat_g)
            VALUES (?, ?, ?, ?, ?, ?)`,
            [meal.name, meal.meal_type, meal.calories, meal.protein_g, meal.carbs_g, meal.fat_g]
        );
        }
        console.log(`Seeded ${meals.length} meals`);
        process.exit(0);
    } catch (err) {
        console.error('Seed meals failed:', err.message);
        process.exit(1);
    }
}

seedMeals();