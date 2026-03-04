import { Tabs } from 'expo-router';
import { COLORS } from '@/utils/constants';
import { FloatingTabBar } from '@/components/navigation/FloatingTabBar';

export default function TabLayout() {
  return (
    <Tabs
      tabBar={(props) => <FloatingTabBar {...props} />}
      screenOptions={{
        headerStyle: { backgroundColor: COLORS.bg.primary },
        headerTintColor: COLORS.text.primary,
        headerShadowVisible: false,
      }}
    >
      <Tabs.Screen
        name="home"
        options={{ title: 'Home', headerShown: false }}
      />
      <Tabs.Screen
        name="activity"
        options={{ title: 'Activity' }}
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
