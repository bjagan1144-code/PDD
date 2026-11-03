import React from 'react';
import { Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { ConfigProvider } from '../context/ConfigContext';
import { AuthProvider } from '../context/AuthContext';
import { COLORS } from '../constants/theme';

export default function RootLayout() {
  return (
    <SafeAreaProvider>
      <ConfigProvider>
        <AuthProvider>
          <StatusBar style="light" backgroundColor={COLORS.background} />
          <Stack
            screenOptions={{
              headerShown: false,
              contentStyle: { backgroundColor: COLORS.background },
              animation: 'fade',
            }}
          >
            <Stack.Screen name="index" />
            <Stack.Screen name="explore" />
            <Stack.Screen name="login" />
            <Stack.Screen name="register" />
            <Stack.Screen name="(tabs)" />
            <Stack.Screen name="drugs" />
            <Stack.Screen name="polymers" />
            <Stack.Screen name="monitor" />
            <Stack.Screen name="reports" />
            <Stack.Screen name="profile" />
            <Stack.Screen name="settings" />
          </Stack>
        </AuthProvider>
      </ConfigProvider>
    </SafeAreaProvider>
  );
}

