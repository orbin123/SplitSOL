import React, { useMemo } from 'react';
import {
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import Ionicons from '@expo/vector-icons/Ionicons';
import { useRouter } from 'expo-router';
import * as Haptics from 'expo-haptics';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Card } from '@/components/ui/Card';
import { EmptyState } from '@/components/ui/EmptyState';
import { useAppStore } from '@/store/useAppStore';
import { COLORS, FONT, SPACING } from '@/utils/constants';
import { timeAgo } from '@/utils/formatters';

const ICON_BG_COLORS = {
  invite: 'rgba(59, 130, 246, 0.2)',
  settlement: 'rgba(16, 185, 129, 0.2)',
  reminder: 'rgba(124, 58, 237, 0.2)',
} as const;

export default function NotificationsScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const notifications = useAppStore((s) => s.notifications);
  const markNotificationRead = useAppStore((s) => s.markNotificationRead);

  const items = useMemo(
    () =>
      [...notifications].sort(
        (a, b) =>
          new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime(),
      ),
    [notifications],
  );

  const handlePress = (notificationId: string, groupId: string | null, paymentId: string | null) => {
    markNotificationRead(notificationId);
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);

    if (paymentId) {
      router.push(`/tx/detail/${paymentId}`);
      return;
    }

    if (groupId) {
      router.push(`/group/${groupId}`);
    }
  };

  if (items.length === 0) {
    return (
      <View style={[styles.container, { paddingTop: insets.top + SPACING.lg + 56 }]}>
        <EmptyState
          emoji="🔔"
          title="All caught up!"
          subtitle="No new notifications"
        />
      </View>
    );
  }

  return (
    <ScrollView
      style={styles.container}
      contentContainerStyle={[
        styles.content,
        { paddingTop: insets.top + SPACING.lg + 56 },
      ]}
      showsVerticalScrollIndicator={false}
    >
      {items.map((notification) => (
        <Card
          key={notification.id}
          style={styles.card}
          onPress={() =>
            handlePress(
              notification.id,
              notification.relatedGroupId,
              notification.relatedPaymentId,
            )
          }
        >
          <View style={styles.row}>
            {!notification.read && <View style={styles.unreadDot} />}
            <View
              style={[
                styles.iconWrap,
                { backgroundColor: ICON_BG_COLORS[notification.type] },
              ]}
            >
              <Ionicons
                name={
                  notification.type === 'settlement'
                    ? 'wallet-outline'
                    : notification.type === 'invite'
                      ? 'people-outline'
                      : 'notifications-outline'
                }
                size={20}
                color={
                  notification.type === 'settlement'
                    ? COLORS.text.success
                    : notification.type === 'invite'
                      ? '#3B82F6'
                      : COLORS.text.accent
                }
              />
            </View>
            <View style={styles.body}>
              <Text style={styles.title}>{notification.message}</Text>
              <Text style={styles.time}>{timeAgo(notification.timestamp)}</Text>
            </View>
            <Ionicons
              name="chevron-forward"
              size={18}
              color={COLORS.text.tertiary}
            />
          </View>
        </Card>
      ))}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: 'transparent',
  },
  content: {
    paddingHorizontal: SPACING.xl,
    paddingBottom: SPACING.xxxl,
    gap: SPACING.sm,
  },
  card: {
    paddingVertical: SPACING.md,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING.md,
  },
  unreadDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: COLORS.bg.accent,
    marginRight: SPACING.xs,
  },
  iconWrap: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
  },
  body: {
    flex: 1,
  },
  title: {
    color: COLORS.text.primary,
    fontSize: 14,
    fontWeight: FONT.weight.bold,
  },
  time: {
    color: COLORS.text.secondary,
    fontSize: 12,
    marginTop: 2,
  },
});
