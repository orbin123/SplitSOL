import React, { useMemo } from 'react';
import {
  Alert,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { Stack, useLocalSearchParams, useRouter } from 'expo-router';
import * as Clipboard from 'expo-clipboard';
import * as Haptics from 'expo-haptics';
import Ionicons from '@expo/vector-icons/Ionicons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useAppStore } from '@/store/useAppStore';
import { Avatar } from '@/components/ui/Avatar';
import { Badge } from '@/components/ui/Badge';
import { Button } from '@/components/ui/Button';
import { Card } from '@/components/ui/Card';
import { EmptyState } from '@/components/ui/EmptyState';
import { formatCurrency, timeAgo, truncateAddress } from '@/utils/formatters';
import { showAlert } from '@/store/useAlertStore';
import { COLORS, FONT, RADIUS, SPACING } from '@/utils/constants';

export default function MemberDetailScreen() {
  const router = useRouter();
  const { id } = useLocalSearchParams<{ id: string }>();
  const insets = useSafeAreaInsets();
  const user = useAppStore((s) => s.user);
  const members = useAppStore((s) => s.members);
  const groups = useAppStore((s) => s.groups);
  const transactions = useAppStore((s) => s.transactions);
  const getBalances = useAppStore((s) => s.getBalances);
  const toggleFavorite = useAppStore((s) => s.toggleFavorite);
  const removeMemberFromList = useAppStore((s) => s.removeMemberFromList);

  const member = members.find((item) => item.id === id);

  const sharedGroups = useMemo(() => {
    if (!member) return [];

    return groups
      .filter((group) => {
        const hasCurrentUser = group.members.some((m) => m.isCurrentUser);
        const hasMember = group.members.some((m) => m.memberId === member.id);
        return hasCurrentUser && hasMember;
      })
      .map((group) => {
        const balances = getBalances(group.id);
        const groupMember = group.members.find((m) => m.memberId === member.id);
        const balanceEntry = groupMember
          ? balances.find((b) => b.memberId === groupMember.id)
          : null;
        const amount = balanceEntry?.amount ?? 0;
        return { group, amount };
      });
  }, [member, groups, getBalances]);

  const relatedTransactions = useMemo(() => {
    if (!member) return [];

    return transactions
      .filter((tx) => {
        if (
          tx.payerWallet !== member.walletAddress &&
          tx.receiverWallet !== member.walletAddress
        ) {
          return false;
        }

        if (!user.walletAddress) return true;

        return (
          tx.payerWallet === user.walletAddress ||
          tx.receiverWallet === user.walletAddress
        );
      })
      .sort(
        (a, b) =>
          new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime(),
      );
  }, [member, transactions, user.walletAddress]);

  if (!member) {
    return (
      <View style={styles.missingWrap}>
        <EmptyState
          emoji="😵"
          title="Member not found"
          subtitle="This member may have been removed."
          action={
            <Button
              title="Back to Members"
              onPress={() => router.replace('/members' as any)}
            />
          }
        />
      </View>
    );
  }

  const copyAddress = async () => {
    await Clipboard.setStringAsync(member.walletAddress);
    await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    showAlert('Copied', 'Wallet address copied to clipboard.');
  };

  const handleRemove = () => {
    showAlert('Remove Member', `Remove ${member.name} from your members?`, [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Remove',
        style: 'destructive',
        onPress: () => {
          removeMemberFromList(member.id);
          router.replace('/members' as any);
        },
      },
    ]);
  };

  return (
    <>
      {member && (
        <Stack.Screen options={{ title: member.name }} />
      )}
      <ScrollView
        style={styles.container}
        contentContainerStyle={[
          styles.content,
          { paddingTop: insets.top + SPACING.lg + 56, paddingBottom: SPACING.xxxl },
        ]}
        showsVerticalScrollIndicator={false}
      >
        <Card style={styles.profileCard}>
          <Avatar name={member.name} size={64} />
          <Text style={styles.name}>{member.name}</Text>
          {member.walletAddress ? (
            <View style={styles.addressRow}>
              <Text style={styles.addressText}>
                {truncateAddress(member.walletAddress, 8)}
              </Text>
              <TouchableOpacity
                onPress={() => void copyAddress()}
                hitSlop={12}
                style={styles.copyIcon}
              >
                <Ionicons name="copy-outline" size={18} color={COLORS.text.secondary} />
              </TouchableOpacity>
            </View>
          ) : null}
          <Badge
            label={member.walletAddress ? 'Connected' : 'No Wallet'}
            variant={member.walletAddress ? 'success' : 'neutral'}
            size="sm"
          />
          <TouchableOpacity
            style={styles.favoriteBtn}
            activeOpacity={0.75}
            onPress={() => toggleFavorite(member.id)}
          >
            <Ionicons
              name={member.isFavorite ? 'star' : 'star-outline'}
              size={24}
              color={member.isFavorite ? COLORS.bg.warning : COLORS.text.tertiary}
            />
          </TouchableOpacity>
        </Card>

        <Text style={styles.sectionTitle}>Shared Groups</Text>
        {sharedGroups.length === 0 ? (
          <Card style={styles.emptyCard}>
            <Text style={styles.emptyText}>No shared groups yet</Text>
          </Card>
        ) : (
          sharedGroups.map(({ group, amount }) => (
            <Card key={group.id} style={styles.groupCard}>
              <View style={styles.groupRow}>
                <Text style={styles.groupEmoji}>{group.emoji}</Text>
                <Text style={styles.groupName}>{group.name}</Text>
                <Text
                  style={[
                    styles.balanceAmount,
                    amount > 0 ? styles.balanceRed : styles.balanceGreen,
                  ]}
                >
                  {amount > 0
                    ? `You owe ${formatCurrency(amount)}`
                    : amount < 0
                      ? `They owe you ${formatCurrency(Math.abs(amount))}`
                      : 'Settled'}
                </Text>
              </View>
            </Card>
          ))
        )}

        <Text style={styles.sectionTitle}>History</Text>
        {relatedTransactions.length === 0 ? (
          <Card style={styles.emptyCard}>
            <EmptyState
              emoji="🧾"
              title="No transactions yet"
              subtitle="Payments and settlements with this member will show up here."
            />
          </Card>
        ) : (
          relatedTransactions.map((tx) => {
            const groupName =
              groups.find((group) => group.id === tx.groupId)?.name ?? 'Unknown group';
            const youPaid = tx.payerWallet === user.walletAddress;

            return (
              <Card key={tx.id} style={styles.txCard}>
                <View style={styles.txRow}>
                  <View style={styles.txCopy}>
                    <Text style={styles.txDate}>
                      {new Date(tx.timestamp).toLocaleDateString()}
                    </Text>
                    <Text style={styles.txDirection}>
                      {youPaid ? 'You paid' : `${member.name} paid`} {formatCurrency(tx.amountUSDC)}
                    </Text>
                    <Text style={styles.txMeta}>{groupName}</Text>
                  </View>
                  <Badge
                    label={tx.status}
                    variant={
                      tx.status === 'confirmed'
                        ? 'success'
                        : tx.status === 'failed'
                          ? 'danger'
                          : 'warning'
                    }
                    size="sm"
                  />
                </View>
              </Card>
            );
          })
        )}

        <Button
          title="Remove Member"
          onPress={handleRemove}
          variant="danger"
          style={styles.removeButton}
        />
      </ScrollView>
    </>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: 'transparent',
  },
  content: {
    paddingHorizontal: SPACING.xl,
    gap: SPACING.lg,
  },
  missingWrap: {
    flex: 1,
    backgroundColor: 'transparent',
  },
  profileCard: {
    alignItems: 'center',
    paddingVertical: SPACING.xxl,
    position: 'relative',
  },
  name: {
    color: COLORS.text.primary,
    fontSize: 20,
    fontWeight: FONT.weight.bold,
    marginTop: SPACING.md,
  },
  addressRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING.xs,
    marginTop: SPACING.sm,
  },
  addressText: {
    color: COLORS.text.secondary,
    fontSize: FONT.size.sm,
  },
  copyIcon: {
    padding: SPACING.xs,
  },
  favoriteBtn: {
    position: 'absolute',
    top: SPACING.lg,
    right: SPACING.lg,
  },
  sectionTitle: {
    color: COLORS.text.primary,
    fontSize: FONT.size.lg,
    fontWeight: FONT.weight.bold,
  },
  emptyCard: {
    minHeight: 80,
    justifyContent: 'center',
    alignItems: 'center',
  },
  emptyText: {
    color: COLORS.text.secondary,
    fontSize: FONT.size.sm,
  },
  groupCard: {
    paddingVertical: SPACING.md,
  },
  groupRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING.md,
  },
  groupEmoji: {
    fontSize: 24,
  },
  groupName: {
    flex: 1,
    color: COLORS.text.primary,
    fontSize: FONT.size.md,
    fontWeight: FONT.weight.semibold,
  },
  balanceAmount: {
    fontSize: FONT.size.sm,
    fontWeight: FONT.weight.semibold,
  },
  balanceRed: {
    color: COLORS.text.danger,
  },
  balanceGreen: {
    color: COLORS.text.success,
  },
  txCard: {
    paddingVertical: SPACING.md,
  },
  txRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: SPACING.md,
  },
  txCopy: {
    flex: 1,
  },
  txDate: {
    color: COLORS.text.secondary,
    fontSize: FONT.size.xs,
    marginBottom: 2,
  },
  txDirection: {
    color: COLORS.text.primary,
    fontSize: FONT.size.md,
    fontWeight: FONT.weight.semibold,
  },
  txMeta: {
    color: COLORS.text.secondary,
    fontSize: FONT.size.sm,
    marginTop: 2,
  },
  removeButton: {
    marginTop: SPACING.sm,
  },
});
