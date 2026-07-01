const ACTIVITY_MULTIPLIERS = {
  sedentary: 1.2,
  light: 1.375,
  moderate: 1.55,
  active: 1.725,
  veryActive: 1.9,
};

/**
 * Mifflin-St Jeor. `other` uses female formula per product decision.
 */
export function calculateBMR(gender, weightKg, heightCm, age) {
  if (weightKg <= 0 || heightCm <= 0 || age <= 0) return null;
  const base = 10 * weightKg + 6.25 * heightCm - 5 * age;
  if (gender === 'male') return base + 5;
  return base - 161;
}

export function calculateTDEE(bmr, activityLevel) {
  if (bmr == null) return null;
  const m = ACTIVITY_MULTIPLIERS[activityLevel] ?? ACTIVITY_MULTIPLIERS.sedentary;
  return Math.round(bmr * m);
}

/**
 * Rough macro split: 2g protein/kg, ~25% kcal from fat, rest carbs.
 */
export function calculateMacros(weightKg, dailyCalories) {
  if (weightKg <= 0 || dailyCalories <= 0) return null;
  const protein = Math.round(weightKg * 2);
  const fat = Math.round((dailyCalories * 0.25) / 9);
  const carbs = Math.round((dailyCalories - protein * 4 - fat * 9) / 4);
  if (carbs < 0) return { protein, fat: Math.round((dailyCalories * 0.3) / 9), carbs: Math.round((dailyCalories * 0.45) / 4) };
  return { protein, fat, carbs };
}

/** Healthy BMI range 18.5–24.9 for height (cm) */
export function idealWeightRangeKg(heightCm) {
  if (heightCm <= 0) return { min: null, max: null };
  const hM = heightCm / 100;
  const min = Math.round(18.5 * hM * hM * 10) / 10;
  const max = Math.round(24.9 * hM * hM * 10) / 10;
  return { min, max };
}

/** ~7700 kcal per kg fat; 500 kcal/day deficit */
export function estimateWeeksToGoal(currentKg, targetKg) {
  if (currentKg == null || targetKg == null) return null;
  const diff = Math.abs(currentKg - targetKg);
  if (diff < 0.1) return 0;
  return Math.max(1, Math.ceil((diff * 7700) / (500 * 7)));
}

/**
 * Months to lose `loseKg` at ~5 kg/month (spec messaging).
 */
export function estimateMonthsAtFiveKgPerMonth(loseKg) {
  if (loseKg == null || loseKg <= 0) return null;
  return Math.max(1, Math.ceil(loseKg / 5));
}

/**
 * Full plan from onboarding fields.
 */
export function computeNutritionPlan({
  gender,
  age,
  heightCm,
  currentWeightKg,
  targetWeightKg,
  activityLevel,
  goals,
  maintainWeightGoal,
  weightGoalKg,
}) {
  const bmr = calculateBMR(gender, currentWeightKg, heightCm, age);
  const tdee = calculateTDEE(bmr, activityLevel || 'sedentary');
  if (tdee == null) {
    return {
      bmr: null,
      tdee: null,
      dailyCalories: null,
      macros: null,
      estimatedWeeks: null,
      idealRange: idealWeightRangeKg(heightCm),
    };
  }

  // Niyeti hedeflerden + mevcut/hedef kilodan türet (ayrı "kilo hedefi" ekranı kaldırıldı)
  const diff = currentWeightKg != null && targetWeightKg != null ? currentWeightKg - targetWeightKg : null;
  const maintain =
    maintainWeightGoal ||
    goals?.includes('maintain') ||
    (diff != null && Math.abs(diff) < 1);
  const wantsGain = !maintain && (goals?.includes('gain_muscle') || (diff != null && diff < -0.5));
  const wantsLoss = !maintain && (goals?.includes('lose_weight') || (diff != null && diff > 0.5) || (weightGoalKg != null && weightGoalKg > 0));

  let dailyCalories = tdee;
  if (maintain) dailyCalories = tdee;
  else if (wantsGain) dailyCalories = Math.round(tdee + 250);
  else if (wantsLoss) dailyCalories = Math.max(1200, Math.round(tdee - 500));
  else dailyCalories = Math.round(tdee - 200);

  const macros = calculateMacros(currentWeightKg, dailyCalories);
  const estWeeks =
    currentWeightKg && targetWeightKg
      ? estimateWeeksToGoal(currentWeightKg, targetWeightKg)
      : weightGoalKg && !maintainWeightGoal
        ? estimateWeeksToGoal(currentWeightKg, currentWeightKg - weightGoalKg)
        : null;

  return {
    bmr: bmr != null ? Math.round(bmr) : null,
    tdee,
    dailyCalories,
    macros,
    estimatedWeeks: estWeeks,
    idealRange: idealWeightRangeKg(heightCm),
  };
}

/** Maps multi-select goals to backend `goal` enum. */
export function mapGoalsToApiGoal(selectedGoalIds) {
  const ids = selectedGoalIds || [];
  if (ids.includes('lose_weight')) return 'lose_weight';
  if (ids.includes('gain_muscle')) return 'gain_muscle';
  if (ids.includes('eat_healthy') || ids.includes('healthy_life')) return 'eat_healthy';
  return 'stay_active';
}
