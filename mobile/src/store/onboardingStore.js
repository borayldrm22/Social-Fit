import { create } from 'zustand';
import { computeNutritionPlan } from '../utils/calculations';

function initialState() {
  return {
    fullName: '',
    username: '',
    routines: [],
    goals: [],
    challenges: [],
    weightGoalKg: null,
    maintainWeightGoal: false,
    currentWeightKg: null,
    targetWeightKg: null,
    timeline: '',
    gender: null,
    age: null,
    heightCm: null,
    activityLevel: '',
    identityStatements: [],
    channelChoice: null,
    bmr: null,
    tdee: null,
    dailyCalories: null,
    macros: null,
    estimatedWeeks: null,
  };
}

export const useOnboardingStore = create((set, get) => ({
  ...initialState(),

  reset: () => set(initialState()),

  setFullName: (fullName) => set({ fullName }),
  setUsername: (username) => set({ username }),
  setRoutines: (routines) => set({ routines }),
  setGoals: (goals) => set({ goals }),
  setChallenges: (challenges) => set({ challenges }),
  setWeightGoalKg: (weightGoalKg) => set({ weightGoalKg }),
  setMaintainWeightGoal: (maintainWeightGoal) => set({ maintainWeightGoal }),
  setCurrentWeightKg: (currentWeightKg) => set({ currentWeightKg }),
  setTargetWeightKg: (targetWeightKg) => set({ targetWeightKg }),
  setTimeline: (timeline) => set({ timeline }),
  setGender: (gender) => set({ gender }),
  setAge: (age) => set({ age }),
  setHeightCm: (heightCm) => set({ heightCm }),
  setActivityLevel: (activityLevel) => set({ activityLevel }),
  setIdentityStatements: (identityStatements) => set({ identityStatements }),
  setChannelChoice: (channelChoice) => set({ channelChoice }),

  runNutritionPlan: () => {
    const s = get();
    const plan = computeNutritionPlan({
      gender: s.gender,
      age: s.age,
      heightCm: s.heightCm,
      currentWeightKg: s.currentWeightKg,
      targetWeightKg: s.targetWeightKg,
      activityLevel: s.activityLevel,
      goals: s.goals,
      maintainWeightGoal: s.maintainWeightGoal,
      weightGoalKg: s.weightGoalKg,
    });
    set({
      bmr: plan.bmr,
      tdee: plan.tdee,
      dailyCalories: plan.dailyCalories,
      macros: plan.macros,
      estimatedWeeks: plan.estimatedWeeks ?? s.estimatedWeeks,
    });
  },

}));
