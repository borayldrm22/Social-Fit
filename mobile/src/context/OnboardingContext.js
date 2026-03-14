import React, { createContext, useContext, useState, useCallback } from 'react';

const OnboardingContext = createContext(null);

const initialState = {
  goal: null,
  age: null,
  weightKg: null,
  heightCm: null,
  dailyCalorieGoal: null,
};

export function OnboardingProvider({ children, onComplete }) {
  const [data, setDataState] = useState(initialState);

  const setData = useCallback((updater) => {
    setDataState((prev) => (typeof updater === 'function' ? updater(prev) : { ...prev, ...updater }));
  }, []);

  const resetOnboarding = useCallback(() => {
    setDataState(initialState);
  }, []);

  const value = { ...data, setData, resetOnboarding, onComplete: onComplete || (() => {}) };
  return (
    <OnboardingContext.Provider value={value}>
      {children}
    </OnboardingContext.Provider>
  );
}

export function useOnboarding() {
  const ctx = useContext(OnboardingContext);
  if (!ctx) throw new Error('useOnboarding must be used within OnboardingProvider');
  return ctx;
}
