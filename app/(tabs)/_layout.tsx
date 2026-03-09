import { Tabs } from 'expo-router';
import { COLORS } from '@/utils/constants';
import { FloatingTabBar } from '@/components/navigation/FloatingTabBar';

export default function TabLayout() {
  return (
    <Tabs
      tabBar={(props) => <FloatingTabBar {...props} />}
      screenOptions={{
        headerStyle: { backgroundColor: 'transparent' },
        headerTransparent: true,
        headerTintColor: COLORS.text.primary,
        headerTitleStyle: { color: COLORS.bg.dark, fontWeight: '700' },
        headerShadowVisible: false,
      }}
    >
      <Tabs.Screen
        name="home"
        options={{ title: 'Home', headerShown: false }}
      />
      <Tabs.Screen
        name="activity"
        options={{ title: 'Transactions', headerShown: false }}
      />
      <Tabs.Screen
        name="wallet"
        options={{ title: 'Wallet', headerShown: false }}
      />
      <Tabs.Screen
        name="profile"
        options={{ title: 'Profile', headerShown: false }}
      />
      <Tabs.Screen
        name="groups"
        options={{ href: null }}
      />
    </Tabs>
  );
}
