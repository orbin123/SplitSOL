import React, { useMemo } from 'react';
import {
  Alert,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import * as Clipboard from 'expo-clipboard';
import * as Haptics from 'expo-haptics';
import Ionicons from '@expo/vector-icons/Ionicons';
import { useAppStore } from '@/store/useAppStore';
import { Avatar } from '@/components/ui/Avatar';
import { Button } from '@/components/ui/Button';
import { Card } from '@/components/ui/Card';
import { EmptyState } from '@/components/ui/EmptyState';
import { formatCurrency, timeAgo, truncateAddress } from '@/utils/formatters';
import { COLORS, FONT, RADIUS, SPACING } from '@/utils/constants';

export default function MemberDetailScreen() {
  const router = useRouter();
  const { id } = useLocalSearchParams<{ id: string }>();
  const user = useAppStore((s) => s.user);
  const members = useAppStore((s) => s.members);
  const groups = useAppStore((s) => s.groups);
  const transactions = useAppStore((s) => s.transactions);
  const toggleFavorite = useAppStore((s) => s.toggleFavorite);
  const removeMemberFromList = useAppStore((s) => s.removeMemberFromList);

  const member = members.find((item) => item.id === id);

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
    Alert.alert('Copied', 'Wallet address copied to clipboard.');
  };

  const handleRemove = () => {
    Alert.alert('Remove Member', `Remove ${member.name} from your members?`, [
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
    <ScrollView
      style={styles.container}
      contentContainerStyle={styles.content}
      showsVerticalScrollIndicator={false}
    >
      <View style={styles.header}>
        <Avatar name={member.name} size={88} />
        <Text style={styles.name}>{member.name}</Text>
        <TouchableOpacity
          style={styles.favoritePill}
          activeOpacity={0.75}
          onPress={() => toggleFavorite(member.id)}
        >
          <Ionicons
            name={member.isFavorite ? 'star' : 'star-outline'}
            size={18}
            color={member.isFavorite ? COLORS.bg.warning : COLORS.text.accent}
          />
          <Text style={styles.favoriteText}>
            {member.isFavorite ? 'Favorite' : 'Mark Favorite'}
          </Text>
        </TouchableOpacity>
      </View>

      <Card style={styles.addressCard}>
        <Text style={styles.sectionLabel}>Wallet address</Text>
        <Text style={styles.fullAddress}>{member.walletAddress}</Text>
        <Button
          title="Copy Address"
          onPress={() => {
            void copyAddress();
          }}
          variant="secondary"
          size="sm"
          style={styles.copyButton}
        />
      </Card>

      <Card>
        <View style={styles.metaRow}>
          <Text style={styles.metaLabel}>Added</Text>
          <Text style={styles.metaValue}>{timeAgo(member.addedAt)}</Text>
        </View>
        <View style={styles.divider} />
        <View style={styles.metaRow}>
          <Text style={styles.metaLabel}>Last transaction</Text>
          <Text style={styles.metaValue}>
            {member.lastTransactionAt
              ? timeAgo(member.lastTransactionAt)
              : 'No transactions yet'}
          </Text>
        </View>
      </Card>

      <View style={styles.sectionHeader}>
        <Text style={styles.sectionTitle}>Transaction History</Text>
        <Text style={styles.sectionCount}>
          {relatedTransactions.length} item
          {relatedTransactions.length === 1 ? '' : 's'}
        </Text>
      </View>

      {relatedTransactions.length === 0 ? (
        <Card style={styles.emptyHistoryCard}>
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
              <View style={styles.txHeader}>
                <Text style={styles.txTitle}>
                  {youPaid ? 'You paid' : `${member.name} paid`}
                </Text>
                <View
                  style={[
                    styles.statusBadge,
                    tx.status === 'confirmed'
                      ? styles.confirmedBadge
                      : tx.status === 'failed'
                        ? styles.failedBadge
                        : styles.pendingBadge,
                  ]}
                >
                  <Text style={styles.statusText}>{tx.status}</Text>
                </View>
              </View>
              <Text style={styles.txAmount}>{formatCurrency(tx.amountUSDC)}</Text>
              <Text style={styles.txMeta}>
                {groupName} · {timeAgo(tx.timestamp)}
              </Text>
              <Text style={styles.txAddress}>
                {truncateAddress(tx.payerWallet, 5)} {'->'}{' '}
                {truncateAddress(tx.receiverWallet, 5)}
              </Text>
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
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.bg.primary,
  },
  content: {
    padding: SPACING.xl,
    gap: SPACING.lg,
    paddingBottom: SPACING.xxxl,
  },
  missingWrap: {
    flex: 1,
    backgroundColor: COLORS.bg.primary,
  },
  header: {
    alignItems: 'center',
    gap: SPACING.sm,
    marginTop: SPACING.md,
  },
  name: {
    color: COLORS.text.primary,
    fontSize: FONT.size.xxl,
    fontWeight: FONT.weight.bold,
  },
  favoritePill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING.sm,
    backgroundColor: COLORS.bg.accentSoft,
    borderRadius: RADIUS.full,
    paddingHorizontal: SPACING.lg,
    paddingVertical: SPACING.sm,
  },
  favoriteText: {
    color: COLORS.text.accent,
    fontSize: FONT.size.sm,
    fontWeight: FONT.weight.semibold,
  },
  addressCard: {
    gap: SPACING.sm,
  },
  sectionLabel: {
    color: COLORS.text.tertiary,
    fontSize: FONT.size.xs,
    fontWeight: FONT.weight.semibold,
    textTransform: 'uppercase',
    letterSpacing: 1,
  },
  fullAddress: {
    color: COLORS.text.primary,
    fontSize: FONT.size.md,
    lineHeight: 24,
    fontWeight: FONT.weight.medium,
  },
  copyButton: {
    alignSelf: 'flex-start',
    marginTop: SPACING.sm,
  },
  metaRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  metaLabel: {
    color: COLORS.text.secondary,
    fontSize: FONT.size.sm,
  },
  metaValue: {
    color: COLORS.text.primary,
    fontSize: FONT.size.sm,
    fontWeight: FONT.weight.semibold,
  },
  divider: {
    height: 1,
    backgroundColor: COLORS.border.default,
    marginVertical: SPACING.md,
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  sectionTitle: {
    color: COLORS.text.primary,
    fontSize: FONT.size.lg,
    fontWeight: FONT.weight.bold,
  },
  sectionCount: {
    color: COLORS.text.tertiary,
    fontSize: FONT.size.sm,
  },
  emptyHistoryCard: {
    minHeight: 220,
    justifyContent: 'center',
  },
  txCard: {
    gap: SPACING.xs,
  },
  txHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    gap: SPACING.md,
  },
  txTitle: {
    color: COLORS.text.primary,
    fontSize: FONT.size.md,
    fontWeight: FONT.weight.semibold,
  },
  txAmount: {
    color: COLORS.bg.accent,
    fontSize: FONT.size.xl,
    fontWeight: FONT.weight.bold,
  },
  txMeta: {
    color: COLORS.text.secondary,
    fontSize: FONT.size.sm,
  },
  txAddress: {
    color: COLORS.text.tertiary,
    fontSize: FONT.size.xs,
  },
  statusBadge: {
    borderRadius: RADIUS.full,
    paddingHorizontal: SPACING.sm,
    paddingVertical: 4,
  },
  confirmedBadge: {
    backgroundColor: 'rgba(16, 185, 129, 0.12)',
  },
  failedBadge: {
    backgroundColor: 'rgba(239, 68, 68, 0.12)',
  },
  pendingBadge: {
    backgroundColor: 'rgba(245, 158, 11, 0.12)',
  },
  statusText: {
    color: COLORS.text.primary,
    fontSize: FONT.size.xs,
    fontWeight: FONT.weight.semibold,
    textTransform: 'capitalize',
  },
  removeButton: {
    marginTop: SPACING.sm,
  },
});
