import { Redirect } from 'expo-router';
import { useAppStore } from '@/store/useAppStore';

export default function Index() {
  const onboardingComplete = useAppStore((s) => s.user.onboardingComplete);

  if (!onboardingComplete) {
    return <Redirect href="/(onboarding)/welcome" />;
  }
  return <Redirect href="/(tabs)/groups" />;
}