/**
 * BMI — Body Mass Index
 * Formula: weight(kg) / height(m)²
 */
function calculateBMI(weightKg, heightCm) {
  const heightM = heightCm / 100;
  const bmi = weightKg / (heightM * heightM);
  return parseFloat(bmi.toFixed(2));
}

/**
 * BMI classification (WHO standard)
 */
function classifyBMI(bmi) {
  if (bmi < 18.5) return { key: 'underweight', label: 'نحيف' };
  if (bmi < 25)   return { key: 'normal',      label: 'طبيعي' };
  if (bmi < 30)   return { key: 'overweight',  label: 'زائد' };
  return             { key: 'obese',        label: 'سمنة' };
}

/**
 * BMR — Basal Metabolic Rate (Mifflin-St Jeor)
 * Male:   10×weight + 6.25×height − 5×age + 5
 * Female: 10×weight + 6.25×height − 5×age − 161
 */
function calculateBMR(weightKg, heightCm, age, gender) {
  const base = 10 * weightKg + 6.25 * heightCm - 5 * age;
  const bmr  = gender === 'male' ? base + 5 : base - 161;
  return parseFloat(bmr.toFixed(2));
}

/**
 * TDEE — Total Daily Energy Expenditure
 * BMR × activity multiplier
 */
const ACTIVITY_MULTIPLIERS = {
  sedentary:          1.2,
  lightly_active:     1.375,
  moderately_active:  1.55,
  very_active:        1.725,
  extra_active:       1.9,
};

function calculateTDEE(bmr, activityLevel) {
  const multiplier = ACTIVITY_MULTIPLIERS[activityLevel] ?? 1.2;
  return parseFloat((bmr * multiplier).toFixed(2));
}

module.exports = { calculateBMI, classifyBMI, calculateBMR, calculateTDEE };
