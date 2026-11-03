import React from 'react';
import { Tabs } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { COLORS } from '../../constants/theme';

export default function TabLayout() {
  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        tabBarStyle: {
          backgroundColor: COLORS.surface,
          borderTopColor: COLORS.surfaceBorder,
          borderTopWidth: 1,
          height: 60,
          paddingBottom: 8,
          paddingTop: 6,
        },
        tabBarActiveTintColor: COLORS.primaryLight,
        tabBarInactiveTintColor: COLORS.textMuted,
        tabBarLabelStyle: {
          fontSize: 11,
          fontWeight: '600',
        },
      }}
    >
      <Tabs.Screen
        name="dashboard"
        options={{
          title: 'Dashboard',
          tabBarIcon: ({ color, size }) => (
            <Ionicons name="grid-outline" size={size || 20} color={color} />
          ),
        }}
      />
      <Tabs.Screen
        name="simulator"
        options={{
          title: 'Simulator',
          tabBarIcon: ({ color, size }) => (
            <Ionicons name="flask-outline" size={size || 20} color={color} />
          ),
        }}
      />
      <Tabs.Screen
        name="predictions"
        options={{
          title: 'AI Predict',
          tabBarIcon: ({ color, size }) => (
            <Ionicons name="analytics-outline" size={size || 20} color={color} />
          ),
        }}
      />
      <Tabs.Screen
        name="history"
        options={{
          title: 'History',
          tabBarIcon: ({ color, size }) => (
            <Ionicons name="time-outline" size={size || 20} color={color} />
          ),
        }}
      />
      <Tabs.Screen
        name="more"
        options={{
          title: 'More',
          tabBarIcon: ({ color, size }) => (
            <Ionicons name="apps-outline" size={size || 20} color={color} />
          ),
        }}
      />
    </Tabs>
  );
}

