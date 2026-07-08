import React, { useEffect } from 'react';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { useOnboardingStore } from '../../store/onboardingStore';
import OnboardingWelcome from './OnboardingWelcome';
import OnboardingGoals from './OnboardingGoals';
import OnboardingProfile from './OnboardingProfile';
import OnboardingActivity from './OnboardingActivity';
import OnboardingRoutines from './OnboardingRoutines';
import OnboardingChallenge from './OnboardingChallenge';
import OnboardingResult from './OnboardingResult';
import OnboardingSocialStep from './OnboardingSocialStep';

const Stack = createNativeStackNavigator();

const noHeader = { headerShown: false };
const noHeaderNoBack = { headerShown: false, gestureEnabled: false };

// Akış: Ad Soyad+username → Profile/BMI → Activity → Goals → Rutinler → Zorlanma → Sonuç → Kanal
export default function OnboardingNavigator() {
  const reset = useOnboardingStore((s) => s.reset);
  useEffect(() => () => reset(), [reset]);

  return (
    <Stack.Navigator screenOptions={noHeader} initialRouteName="OnboardingWelcome">
      <Stack.Screen name="OnboardingWelcome" component={OnboardingWelcome} options={noHeaderNoBack} />
      <Stack.Screen name="OnboardingProfile" component={OnboardingProfile} />
      <Stack.Screen name="OnboardingActivity" component={OnboardingActivity} />
      <Stack.Screen name="OnboardingGoals" component={OnboardingGoals} />
      <Stack.Screen name="OnboardingRoutines" component={OnboardingRoutines} />
      <Stack.Screen name="OnboardingChallenge" component={OnboardingChallenge} />
      <Stack.Screen name="OnboardingResult" component={OnboardingResult} />
      <Stack.Screen name="OnboardingSocial" component={OnboardingSocialStep} />
    </Stack.Navigator>
  );
}
