import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
} from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import * as Haptics from 'expo-haptics';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import Ionicons from '@expo/vector-icons/Ionicons';
import { showAlert } from '@/store/useAlertStore';
import { useAppStore } from '@/store/useAppStore';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Avatar } from '@/components/ui/Avatar';
import { truncateAddress } from '@/utils/formatters';
import { COLORS, SPACING, FONT, RADIUS } from '@/utils/constants';

export default function GroupInvite() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const group = useAppStore((s) => s.getGroup(id));
  const user = useAppStore((s) => s.user);
  const addGroupMember = useAppStore((s) => s.addGroupMember);

  if (!group) {
    return (
      <View style={[styles.container, { paddingTop: insets.top + SPACING.xl }]}>
        <Card style={styles.errorCard}>
          <Text style={styles.errorEmoji}>🔍</Text>
          <Text style={styles.errorTitle}>Group not found</Text>
          <Text style={styles.errorSub}>
            This invite link may be invalid or the group was deleted.
          </Text>
          <Button title="Go Back" onPress={() => router.back()} variant="secondary" />
        </Card>
      </View>
    );
  }

  const alreadyMember = group.members.some(
    (m) =>
      m.isCurrentUser ||
      (user.name && m.name.toLowerCase() === user.name.toLowerCase()),
  );

  const creator = group.members[0];
  const creatorName = creator?.name ?? 'Unknown';

  const handleJoin = () => {
    if (!user.name) {
      showAlert('No name set', 'Please set your name in Profile before joining a group.');
      return;
    }
    addGroupMember(group.id, user.name, user.walletAddress ?? undefined);
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    router.replace(`/group/${group.id}` as any);
  };

  return (
    <View style={[styles.container, { paddingTop: insets.top }]}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity
          onPress={() => router.back()}
          style={styles.backBtn}
          activeOpacity={0.7}
        >
          <Ionicons name="chevron-back" size={24} color={COLORS.text.primary} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Join Group</Text>
        <View style={styles.headerSpacer} />
      </View>

      <View style={styles.content}>
        <Card style={styles.mainCard}>
          <Text style={styles.emoji}>{group.emoji}</Text>
          <Text style={styles.groupName}>{group.name}</Text>
          <View style={styles.createdByRow}>
            <Avatar name={creatorName} size={20} />
            <Text style={styles.createdBy}>Created by {creatorName}</Text>
          </View>
          <Text style={styles.memberCount}>
            {group.members.length} member{group.members.length !== 1 ? 's' : ''}
          </Text>

          <View style={styles.avatarRow}>
            {group.members.slice(0, 5).map((m, idx) => (
              <View
                key={m.id}
                style={[styles.avatarWrap, idx > 0 && { marginLeft: -8 }]}
              >
                <Avatar name={m.name} size={36} />
              </View>
            ))}
            {group.members.length > 5 && (
              <View style={[styles.avatarWrap, styles.avatarOverflow, { marginLeft: -8 }]}>
                <Text style={styles.avatarOverflowText}>
                  +{group.members.length - 5}
                </Text>
              </View>
            )}
          </View>

          <View style={styles.divider} />

          {alreadyMember ? (
            <>
              <Text style={styles.alreadyEmoji}>✅</Text>
              <Text style={styles.alreadyTitle}>Already a member</Text>
              <Text style={styles.alreadySub}>
                You&apos;re already in <Text style={styles.bold}>{group.name}</Text>.
              </Text>
              <Button
                title="View Group"
                onPress={() => router.replace(`/group/${group.id}` as any)}
                style={styles.actionBtn}
              />
            </>
          ) : (
            <>
              <Text style={styles.joinAsLabel}>You&apos;ll join as:</Text>
              <View style={styles.youRow}>
                <Avatar name={user.name || 'You'} size={40} />
                <View style={styles.youInfo}>
                  <Text style={styles.youName}>{user.name ?? 'You'}</Text>
                  {user.walletAddress && (
                    <Text style={styles.youWallet}>
                      {truncateAddress(user.walletAddress, 6)}
                    </Text>
                  )}
                </View>
              </View>

              <Button
                title="Join Group"
                onPress={handleJoin}
                style={styles.actionBtn}
              />

              <TouchableOpacity
                onPress={() => router.back()}
                activeOpacity={0.7}
                style={styles.declineWrap}
              >
                <Text style={styles.declineText}>Decline</Text>
              </TouchableOpacity>
            </>
          )}
        </Card>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: 'transparent',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: SPACING.lg,
    paddingVertical: SPACING.md,
  },
  backBtn: {
    width: 36,
    height: 36,
    borderRadius: 18,
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerTitle: {
    flex: 1,
    color: COLORS.text.primary,
    fontSize: FONT.size.xl,
    fontWeight: FONT.weight.bold,
    textAlign: 'center',
  },
  headerSpacer: {
    width: 36,
  },
  content: {
    flex: 1,
    padding: SPACING.xl,
    justifyContent: 'center',
  },
  mainCard: {
    alignItems: 'center',
    paddingVertical: SPACING.xxxl,
    paddingHorizontal: SPACING.xxl,
    gap: SPACING.sm,
  },
  emoji: {
    fontSize: 48,
    marginBottom: SPACING.sm,
  },
  groupName: {
    color: COLORS.text.primary,
    fontSize: 22,
    fontWeight: FONT.weight.bold,
    textAlign: 'center',
  },
  createdByRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING.xs,
  },
  createdBy: {
    color: COLORS.text.secondary,
    fontSize: FONT.size.sm,
  },
  memberCount: {
    color: COLORS.text.secondary,
    fontSize: FONT.size.sm,
  },
  avatarRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: SPACING.sm,
  },
  avatarWrap: {
    borderWidth: 2,
    borderColor: '#FFFFFF',
    borderRadius: 20,
  },
  avatarOverflow: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: COLORS.bg.tertiary,
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarOverflowText: {
    color: COLORS.text.secondary,
    fontSize: FONT.size.xs,
    fontWeight: FONT.weight.semibold,
  },
  divider: {
    height: 1,
    backgroundColor: COLORS.border.default,
    width: '100%',
    marginVertical: SPACING.lg,
  },
  joinAsLabel: {
    color: COLORS.text.secondary,
    fontSize: FONT.size.sm,
    alignSelf: 'flex-start',
    marginBottom: SPACING.xs,
  },
  youRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING.md,
    alignSelf: 'stretch',
    marginBottom: SPACING.lg,
  },
  youInfo: {
    flex: 1,
  },
  youName: {
    color: COLORS.text.primary,
    fontSize: FONT.size.md,
    fontWeight: FONT.weight.semibold,
  },
  youWallet: {
    color: COLORS.text.secondary,
    fontSize: FONT.size.sm,
    marginTop: 2,
  },
  actionBtn: {
    width: '100%',
    marginTop: SPACING.sm,
  },
  declineWrap: {
    marginTop: SPACING.lg,
    alignSelf: 'center',
  },
  declineText: {
    color: COLORS.text.secondary,
    fontSize: FONT.size.md,
  },
  alreadyEmoji: {
    fontSize: 40,
  },
  alreadyTitle: {
    color: COLORS.text.primary,
    fontSize: FONT.size.lg,
    fontWeight: FONT.weight.bold,
  },
  alreadySub: {
    color: COLORS.text.secondary,
    fontSize: FONT.size.md,
    textAlign: 'center',
  },
  bold: {
    color: COLORS.text.primary,
    fontWeight: FONT.weight.semibold,
  },
  errorCard: {
    alignItems: 'center',
    gap: SPACING.md,
    paddingVertical: SPACING.xxxl,
  },
  errorEmoji: { fontSize: 48 },
  errorTitle: {
    color: COLORS.text.primary,
    fontSize: FONT.size.xl,
    fontWeight: FONT.weight.bold,
  },
  errorSub: {
    color: COLORS.text.secondary,
    fontSize: FONT.size.md,
    textAlign: 'center',
    lineHeight: 22,
  },
});
