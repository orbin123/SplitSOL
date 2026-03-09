import 'react-native-get-random-values';
import { useEffect, useState } from 'react';
import { Buffer } from 'buffer';
import * as SplashScreen from 'expo-splash-screen';
import { Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { COLORS } from '@/utils/constants';
import { ScreenWrapper } from '@/components/layout/ScreenWrapper';
import { AppSplash } from '@/components/layout/AppSplash';
import { CustomAlertModal } from '@/components/ui/CustomAlertModal';

global.Buffer = global.Buffer || Buffer;

SplashScreen.preventAutoHideAsync();

export default function RootLayout() {
  const [isReady, setIsReady] = useState(false);

  useEffect(() => {
    const prepare = async () => {
      await SplashScreen.hideAsync();
      await new Promise((r) => setTimeout(r, 600));
      setIsReady(true);
    };
    void prepare();
  }, []);

  if (!isReady) {
    return (
      <>
        <StatusBar style="light" />
        <AppSplash />
      </>
    );
  }

  return (
    <>
      <StatusBar style="dark" />
      <ScreenWrapper variant="main" style={{ flex: 1 }}>
        <CustomAlertModal />
        <Stack
          screenOptions={{
            headerStyle: { backgroundColor: 'transparent' },
            headerTransparent: true,
            headerTintColor: COLORS.text.primary,
            headerTitleStyle: { fontWeight: '700', color: COLORS.text.primary },
            contentStyle: { backgroundColor: 'transparent' },
            headerShadowVisible: false,
            animation: 'slide_from_right',
          }}
        >
          <Stack.Screen name="index" options={{ headerShown: false }} />
          <Stack.Screen name="(onboarding)" options={{ headerShown: false }} />
          <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
          <Stack.Screen name="members/index" options={{
            title: 'My Members',
            headerShown: false,
          }} />
          <Stack.Screen name="members/[id]" options={{
            title: 'Member',
          }} />
          <Stack.Screen name="members/scan" options={{
            title: 'Scan Member',
            headerShown: false,
            presentation: 'fullScreenModal',
          }} />
          <Stack.Screen name="split/index" options={{
            title: 'Choose Group',
          }} />
          <Stack.Screen name="settle/index" options={{
            title: 'Settle Up',
            headerShown: false,
          }} />
          <Stack.Screen name="settle/success" options={{
            title: 'Settlement Complete',
            headerShown: false,
            gestureEnabled: false,
          }} />
          <Stack.Screen name="invite/index" options={{
            title: 'Invite',
          }} />
          <Stack.Screen name="group/create" options={{
            title: 'New Group',
            presentation: 'transparentModal',
            animation: 'slide_from_bottom',
            headerShown: false,
          }} />
          <Stack.Screen name="group/[id]/index" options={{
            title: '',
            headerShown: false,
          }} />
          <Stack.Screen name="group/[id]/settle/[settlementId]" options={{
            title: 'Settle Up',
            presentation: 'modal',
            headerShown: false,
          }} />
          <Stack.Screen name="group/[id]/add-split" options={{
            title: 'Add Split',
            headerShown: false,
          }} />
          <Stack.Screen name="group/[id]/add-member" options={{
            title: 'Add Member',
            headerShown: false,
          }} />
          <Stack.Screen name="group/invite/[id]" options={{
            title: 'Join Group',
            headerShown: false,
          }} />

          <Stack.Screen name="tx/detail/[id]" options={{
            headerShown: false,
          }} />
          <Stack.Screen name="notifications/index" options={{
            title: 'Notifications',
          }} />
          <Stack.Screen name="about" options={{
            title: 'About',
          }} />
        </Stack>
      </ScreenWrapper>
    </>
  );
}
