import { Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { COLORS } from '@/utils/constants';

export default function RootLayout() {
  return (
    <>
      <StatusBar style="dark" />
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
        <Stack.Screen name="group/[id]/index" options={{
          title: '',
          headerShown: false,
        }} />
        <Stack.Screen name="group/[id]/settle/[settlementId]" options={{
          title: 'Settle Up',
          presentation: 'modal',
        }} />
        <Stack.Screen name="group/[id]/add-expense" options={{
          title: 'Add Expense',
          headerShown: false,
        }} />
        <Stack.Screen name="group/[id]/add-member" options={{
          title: 'Add Member',
        }} />
        <Stack.Screen name="group/invite/[id]" options={{
          title: 'Join Group',
        }} />
        <Stack.Screen name="tx/[signature]" options={{
          title: 'Settlement Confirmed',
          headerBackVisible: false,
        }} />
      </Stack>
    </>
  );
}
