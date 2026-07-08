import AsyncStorage from '@react-native-async-storage/async-storage';
import { mapGoalsToApiGoal } from '../utils/calculations';
import { useOnboardingStore } from '../store/onboardingStore';

const ONBOARDING_DONE_KEY = 'onboardingCompleted';
const FIRST_SHARE_KEY = 'firstSharePromptPending';

export function buildOnboardingPayload() {
  const s = useOnboardingStore.getState();
  const goal = mapGoalsToApiGoal(s.goals);
  const onboardingData = {
    goals: s.goals,
    challenges: s.challenges,
    weightGoalKg: s.weightGoalKg,
    maintainWeightGoal: s.maintainWeightGoal,
    timeline: s.timeline,
    identityStatements: s.identityStatements,
    channelChoice: s.channelChoice,
    activityLevel: s.activityLevel,
    bmr: s.bmr,
    tdee: s.tdee,
    macros: s.macros,
    estimatedWeeks: s.estimatedWeeks,
    targetWeightKg: s.targetWeightKg,
  };
  return {
    goal,
    age: s.age,
    gender: s.gender,
    weightKg: s.currentWeightKg,
    heightCm: s.heightCm,
    dailyCalorieGoal: s.dailyCalories,
    onboardingData,
    displayName: (s.fullName || '').trim(),
    username: (s.username || '').trim(),
    routines: Array.isArray(s.routines) ? s.routines : [],
  };
}

/**
 * Persists profile + onboarding completion. Caller should refreshUser after.
 */
export async function persistOnboardingComplete(api) {
  const { goal, age, weightKg, heightCm, dailyCalorieGoal, onboardingData, displayName, username, routines } = buildOnboardingPayload();

  if (displayName.length >= 2) {
    await api.patch('/api/users/me', { displayName });
  }
  // Username best-effort: çakışırsa (409) onboarding'i durdurma
  if (username.length >= 3) {
    await api.patch('/api/users/me', { username }).catch(() => {});
  }

  const body = {
    goal,
    age,
    weightKg,
    heightCm,
    dailyCalorieGoal: dailyCalorieGoal != null ? Math.round(Number(dailyCalorieGoal)) : undefined,
    onboardingCompleted: true,
    onboardingData,
    kvkkConsent: true,
  };

  await api.patch('/api/users/me/onboarding', body);

  // Seçilen hedef rutinleri oluştur
  if (routines.length) {
    await api.post('/api/routines/bulk', { routines }).catch(() => {});
  }

  await AsyncStorage.setItem(ONBOARDING_DONE_KEY, 'true');
  await AsyncStorage.setItem(FIRST_SHARE_KEY, 'true');
}

export { FIRST_SHARE_KEY, ONBOARDING_DONE_KEY };
