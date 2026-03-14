import React from 'react';
import { StatusBar } from 'expo-status-bar';
import { NavigationContainer } from '@react-navigation/native';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { AuthProvider, useAuth } from './src/context/AuthContext';
import AuthStack from './src/navigation/AuthStack';
import MainTabs from './src/navigation/MainTabs';
import { OnboardingProvider } from './src/context/OnboardingContext';
import OnboardingNavigator from './src/screens/onboarding/OnboardingNavigator';

function RootNavigator() {
  const { token, user, loading } = useAuth();

  if (loading) return null;

  if (!token) {
    return (
      <>
        <StatusBar style="auto" />
        <AuthStack />
      </>
    );
  }

  const onboardingCompleted = user?.profile?.onboardingCompleted === true;

  if (!onboardingCompleted) {
    const handleOnboardingComplete = async () => {
      // AuthContext.refreshUser will be called in OnboardingStep4,
      // which updates user.profile.onboardingCompleted → re-render shows MainTabs.
    };
    return (
      <>
        <StatusBar style="auto" />
        <OnboardingProvider onComplete={handleOnboardingComplete}>
          <OnboardingNavigator />
        </OnboardingProvider>
      </>
    );
  }

  return (
    <>
      <StatusBar style="auto" />
      <MainTabs />
    </>
  );
}

export default function App() {
  return (
    <SafeAreaProvider>
      <AuthProvider>
        <NavigationContainer>
          <RootNavigator />
        </NavigationContainer>
      </AuthProvider>
    </SafeAreaProvider>
  );
}
