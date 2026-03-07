import { useEffect } from 'react';
import { Buffer } from 'buffer';
import * as SplashScreen from 'expo-splash-screen';
import { Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { COLORS } from '@/utils/constants';

global.Buffer = global.Buffer || Buffer;

SplashScreen.preventAutoHideAsync();

export default function RootLayout() {
  useEffect(() => {
    SplashScreen.hideAsync();
  }, []);

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
        <Stack.Screen name="contacts/index" options={{
          title: 'My Contacts',
        }} />
        <Stack.Screen name="contacts/[id]" options={{
          title: 'Contact',
        }} />
        <Stack.Screen name="contacts/scan" options={{
          title: 'Scan Contact',
          headerShown: false,
          presentation: 'fullScreenModal',
        }} />
        <Stack.Screen name="split/index" options={{
          title: 'Choose Group',
        }} />
        <Stack.Screen name="settle/index" options={{
          title: 'Settle',
        }} />
        <Stack.Screen name="invite/index" options={{
          title: 'Invite',
        }} />
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
        <Stack.Screen name="group/[id]/add-split" options={{
          title: 'Add Split',
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
