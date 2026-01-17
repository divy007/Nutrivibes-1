import React from 'react';
import { Tabs } from 'expo-router';
import { LayoutDashboard, Activity, Calendar } from 'lucide-react-native';

import Colors from '@/constants/Colors';
import { useColorScheme } from '@/components/useColorScheme';
import { useClientOnlyValue } from '@/components/useClientOnlyValue';

import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Platform } from 'react-native';

export default function TabLayout() {
  const colorScheme = useColorScheme();
  const theme = Colors[colorScheme ?? 'light'];
  const insets = useSafeAreaInsets();

  return (
    <Tabs
      screenOptions={{
        tabBarActiveTintColor: theme.tint,
        tabBarInactiveTintColor: theme.tabIconDefault,
        tabBarStyle: {
          backgroundColor: theme.background,
          borderTopColor: 'rgba(0,0,0,0.05)',
          height: 60 + insets.bottom,
          paddingBottom: 8 + insets.bottom,
          paddingTop: 8,
        },
        headerStyle: {
          backgroundColor: theme.background,
        },
        headerTitleStyle: {
          fontWeight: '900',
          color: theme.brandForest,
          fontSize: 20,
        },
        headerShown: useClientOnlyValue(false, true),
      }}>
      <Tabs.Screen
        name="index"
        options={{
          title: 'Dashboard',
          headerShown: false,
          tabBarIcon: ({ color }) => <LayoutDashboard size={24} color={color} />,
        }}
      />
      <Tabs.Screen
        name="audit"
        options={{
          title: 'Wellness Audit',
          tabBarIcon: ({ color }) => <Activity size={24} color={color} />,
        }}
      />
      <Tabs.Screen
        name="plans"
        options={{
          title: 'Plans',
          tabBarIcon: ({ color }) => <Calendar size={24} color={color} />, // Using Calendar for now or change to something like List
        }}
      />
      <Tabs.Screen
        name="diet"
        options={{
          title: 'Diet Plan',
          tabBarIcon: ({ color }) => <Calendar size={24} color={color} />,
        }}
      />
    </Tabs>
  );
}
