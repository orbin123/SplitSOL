import React, { useMemo } from 'react';
import { ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import Ionicons from '@expo/vector-icons/Ionicons';
import { useRouter } from 'expo-router';
import * as Haptics from 'expo-haptics';
import { Card } from '@/components/ui/Card';
import { EmptyState } from '@/components/ui/EmptyState';
import { useAppStore } from '@/store/useAppStore';
import { COLORS, FONT, SPACING } from '@/utils/constants';
import { timeAgo } from '@/utils/formatters';

const NOTIFICATION_ICONS = {
  invite: 'people-outline',
  settlement: 'swap-horizontal-outline',
  reminder: 'alarm-outline',
} as const;

export default function NotificationsScreen() {
  const router = useRouter();
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
      <View style={styles.container}>
        <EmptyState
          emoji="🔔"
          title="No notifications yet"
          subtitle="Group activity, settlements, and reminders will show up here."
        />
      </View>
    );
  }

  return (
    <ScrollView
      style={styles.container}
      contentContainerStyle={styles.content}
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
            <View style={styles.iconWrap}>
              <Ionicons
                name={NOTIFICATION_ICONS[notification.type] as any}
                size={20}
                color={COLORS.text.accent}
              />
            </View>
            <View style={styles.body}>
              <Text style={styles.message}>{notification.message}</Text>
              <Text style={styles.time}>{timeAgo(notification.timestamp)}</Text>
            </View>
            {!notification.read && <View style={styles.unreadDot} />}
          </View>
        </Card>
      ))}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.bg.primary,
  },
  content: {
    padding: SPACING.lg,
    gap: SPACING.md,
  },
  card: {
    paddingVertical: SPACING.md,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING.md,
  },
  iconWrap: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: COLORS.bg.accentSoft,
  },
  body: {
    flex: 1,
  },
  message: {
    color: COLORS.text.primary,
    fontSize: FONT.size.md,
    fontWeight: FONT.weight.medium,
  },
  time: {
    color: COLORS.text.secondary,
    fontSize: FONT.size.sm,
    marginTop: SPACING.xs,
  },
  unreadDot: {
    width: 10,
    height: 10,
    borderRadius: 5,
    backgroundColor: '#3B82F6',
  },
});
