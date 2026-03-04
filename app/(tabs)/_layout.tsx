import { Tabs } from 'expo-router';
import { COLORS, FONT } from '@/utils/constants';
import { Text } from 'react-native';

export default function TabLayout() {
  return (
    <Tabs
      screenOptions={{
        tabBarStyle: {
          backgroundColor: COLORS.bg.secondary,
          borderTopColor: COLORS.border.default,
          height: 60,
          paddingBottom: 8,
          paddingTop: 8,
        },
        tabBarActiveTintColor: COLORS.bg.accent,
        tabBarInactiveTintColor: COLORS.text.tertiary,
        tabBarLabelStyle: {
          fontSize: FONT.size.xs,
          fontWeight: FONT.weight.medium,
        },
        headerStyle: { backgroundColor: COLORS.bg.primary },
        headerTintColor: COLORS.text.primary,
        headerShadowVisible: false,
      }}
    >
      <Tabs.Screen
        name="groups"
        options={{
          title: 'Groups',
          tabBarIcon: ({ color }) => <Text style={{ fontSize: 22 }}>👥</Text>,
        }}
      />
      <Tabs.Screen
        name="activity"
        options={{
          title: 'Activity',
          tabBarIcon: ({ color }) => <Text style={{ fontSize: 22 }}>📋</Text>,
        }}
      />
      <Tabs.Screen
        name="profile"
        options={{
          title: 'Profile',
          tabBarIcon: ({ color }) => <Text style={{ fontSize: 22 }}>👤</Text>,
        }}
      />
    </Tabs>
  );
}