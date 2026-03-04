import { Buffer } from 'buffer';
global.Buffer = global.Buffer || Buffer;

import { Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { COLORS } from '@/utils/constants';

export default function RootLayout() {
  return (
    <>
      <StatusBar style="light" />
      <Stack
        screenOptions={{
          headerStyle: { backgroundColor: COLORS.bg.primary },
          headerTintColor: COLORS.text.primary,
          headerTitleStyle: { fontWeight: '700' },
          contentStyle: { backgroundColor: COLORS.bg.primary },
          headerShadowVisible: false,
          animation: 'slide_from_right',
        }}
      >
        <Stack.Screen name="(onboarding)" options={{ headerShown: false }} />
        <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
        <Stack.Screen name="group/create" options={{
          title: 'New Group',
          presentation: 'modal',
        }} />
        <Stack.Screen name="group/[id]" options={{ title: '' }} />
        <Stack.Screen name="group/[id]/settle/[settlementId]" options={{
          title: 'Settle Up',
          presentation: 'modal',
        }} />
        <Stack.Screen name="tx/[signature]" options={{
          title: 'Settlement Confirmed',
          headerBackVisible: false,
        }} />
      </Stack>
    </>
  );
}