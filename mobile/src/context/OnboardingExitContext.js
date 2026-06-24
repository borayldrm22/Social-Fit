import React, { createContext, useContext } from 'react';

const OnboardingExitContext = createContext({ dismissParentOnComplete: false });

export function OnboardingExitProvider({ dismissParentOnComplete, children }) {
  return (
    <OnboardingExitContext.Provider value={{ dismissParentOnComplete: !!dismissParentOnComplete }}>
      {children}
    </OnboardingExitContext.Provider>
  );
}

export function useOnboardingExit() {
  return useContext(OnboardingExitContext);
}
