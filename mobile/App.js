import React from 'react';
import { StatusBar } from 'expo-status-bar';
import { NavigationContainer } from '@react-navigation/native';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { AuthProvider, useAuth } from './src/context/AuthContext';
import AuthStack from './src/navigation/AuthStack';
import MainTabs from './src/navigation/MainTabs';

// Set to true to bypass login and go straight into the app (for frontend dev)
const DEV_BYPASS_LOGIN = false;

function RootNavigator() {
  const { token } = useAuth();
  const showMainApp = DEV_BYPASS_LOGIN || token;
  return (
    <>
      <StatusBar style="auto" />
      {showMainApp ? <MainTabs /> : <AuthStack />}
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
