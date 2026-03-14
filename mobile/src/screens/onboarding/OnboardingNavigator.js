import React, { useEffect } from 'react';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { useOnboarding } from '../../context/OnboardingContext';
import OnboardingStep1 from './OnboardingStep1';
import OnboardingStep2 from './OnboardingStep2';
import OnboardingStep3 from './OnboardingStep3';
import OnboardingStep4 from './OnboardingStep4';

const Stack = createNativeStackNavigator();

const noHeader = { headerShown: false };
const noHeaderNoBack = { headerShown: false, gestureEnabled: false };

export default function OnboardingNavigator() {
  const { resetOnboarding } = useOnboarding();
  useEffect(() => () => resetOnboarding(), [resetOnboarding]);

  return (
    <Stack.Navigator screenOptions={noHeader} initialRouteName="OnboardingStep1">
      <Stack.Screen name="OnboardingStep1" component={OnboardingStep1} options={noHeaderNoBack} />
      <Stack.Screen name="OnboardingStep2" component={OnboardingStep2} />
      <Stack.Screen name="OnboardingStep3" component={OnboardingStep3} />
      <Stack.Screen name="OnboardingStep4" component={OnboardingStep4} />
    </Stack.Navigator>
  );
}
