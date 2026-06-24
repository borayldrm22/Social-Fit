import React, { useEffect } from 'react';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { useOnboardingStore } from '../../store/onboardingStore';
import OnboardingWelcome from './OnboardingWelcome';
import OnboardingGoals from './OnboardingGoals';
import OnboardingMotivation from './OnboardingMotivation';
import OnboardingChallenge from './OnboardingChallenge';
import OnboardingWeightGoal from './OnboardingWeightGoal';
import OnboardingTimeline from './OnboardingTimeline';
import OnboardingProfile from './OnboardingProfile';
import OnboardingActivity from './OnboardingActivity';
import OnboardingIdentity from './OnboardingIdentity';
import OnboardingChannels from './OnboardingChannels';
import OnboardingCommitment from './OnboardingCommitment';
import OnboardingResult from './OnboardingResult';
import OnboardingSocialStep from './OnboardingSocialStep';

const Stack = createNativeStackNavigator();

const noHeader = { headerShown: false };
const noHeaderNoBack = { headerShown: false, gestureEnabled: false };

export default function OnboardingNavigator() {
  const reset = useOnboardingStore((s) => s.reset);
  useEffect(() => () => reset(), [reset]);

  return (
    <Stack.Navigator screenOptions={noHeader} initialRouteName="OnboardingWelcome">
      <Stack.Screen name="OnboardingWelcome" component={OnboardingWelcome} options={noHeaderNoBack} />
      <Stack.Screen name="OnboardingGoals" component={OnboardingGoals} />
      <Stack.Screen name="OnboardingMotivation" component={OnboardingMotivation} />
      <Stack.Screen name="OnboardingChallenge" component={OnboardingChallenge} />
      <Stack.Screen name="OnboardingWeightGoal" component={OnboardingWeightGoal} />
      <Stack.Screen name="OnboardingTimeline" component={OnboardingTimeline} />
      <Stack.Screen name="OnboardingProfile" component={OnboardingProfile} />
      <Stack.Screen name="OnboardingActivity" component={OnboardingActivity} />
      <Stack.Screen name="OnboardingIdentity" component={OnboardingIdentity} />
      <Stack.Screen name="OnboardingChannels" component={OnboardingChannels} />
      <Stack.Screen name="OnboardingCommitment" component={OnboardingCommitment} />
      <Stack.Screen name="OnboardingResult" component={OnboardingResult} />
      <Stack.Screen name="OnboardingSocial" component={OnboardingSocialStep} />
    </Stack.Navigator>
  );
}
