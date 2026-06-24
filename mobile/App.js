import 'react-native-gesture-handler';
import React from 'react';
import { StatusBar } from 'expo-status-bar';
import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { AuthProvider, useAuth } from './src/context/AuthContext';
import AuthStack from './src/navigation/AuthStack';
import MainTabs from './src/navigation/MainTabs';
import OnboardingNavigator from './src/screens/onboarding/OnboardingNavigator';
import { OnboardingExitProvider } from './src/context/OnboardingExitContext';

const RootStack = createNativeStackNavigator();

function OnboardingRoot() {
  return (
    <OnboardingExitProvider dismissParentOnComplete={false}>
      <OnboardingNavigator />
    </OnboardingExitProvider>
  );
}

function RootNavigator() {
  const { token, user, loading } = useAuth();
  const onboardingCompleted = user?.profile?.onboardingCompleted === true;

  if (loading) return null;

  const rootKey = !token ? 'guest' : !onboardingCompleted ? 'onboarding' : 'app';
  const initialRouteName = !token ? 'Auth' : !onboardingCompleted ? 'Onboarding' : 'Main';

  return (
    <>
      <StatusBar style="auto" />
      <RootStack.Navigator
        key={rootKey}
        initialRouteName={initialRouteName}
        screenOptions={{ headerShown: false }}
      >
        {!token ? (
          <RootStack.Screen name="Auth" component={AuthStack} />
        ) : !onboardingCompleted ? (
          <RootStack.Screen name="Onboarding" component={OnboardingRoot} />
        ) : (
          <RootStack.Screen name="Main" component={MainTabs} />
        )}
      </RootStack.Navigator>
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
