import React, { useMemo } from 'react';
import {
  Alert,
  Linking,
  ScrollView,
  Share,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import * as Clipboard from 'expo-clipboard';
import * as Haptics from 'expo-haptics';
import Ionicons from '@expo/vector-icons/Ionicons';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { LinearGradient } from 'expo-linear-gradient';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Avatar } from '@/components/ui/Avatar';
import { Badge } from '@/components/ui/Badge';
import { EmptyState } from '@/components/ui/EmptyState';
import { Button } from '@/components/ui/Button';
import { useAppStore } from '@/store/useAppStore';
import { showAlert } from '@/store/useAlertStore';
import { Card } from '@/components/ui/Card';
import { formatCurrency, truncateAddress } from '@/utils/formatters';
import { getExplorerUrl } from '@/utils/solana';
import { resolveTransactionDetails } from '@/utils/transactions';
import { COLORS, FONT, SPACING } from '@/utils/constants';
import { Transaction } from '@/types';

const formatDateTime = (value: string) =>
  new Date(value).toLocaleString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
    hour: 'numeric',
    minute: '2-digit',
  });

export default function TransactionDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  const insets = useSafeAreaInsets();

  const user = useAppStore((s) => s.user);
  const groups = useAppStore((s) => s.groups);
  const transactions = useAppStore((s) => s.transactions);

  const transaction = transactions.find((item) => item.id === id);
  const resolved = useMemo(
    () =>
      transaction ? resolveTransactionDetails(transaction, groups, user) : null,
    [groups, transaction, user],
  );

  if (!transaction || !resolved) {
    return (
      <LinearGradient
        colors={['#FDCBEE', '#E7D4FC', '#C1E6F5']}
        style={styles.container}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
      >
        <View style={styles.missingWrap}>
          <EmptyState
            emoji="🧾"
            title="Transaction not found"
            subtitle="This transaction may have been removed from local history."
            action={
              <Button
                title="Back to Transactions"
                onPress={() => router.replace('/(tabs)/activity')}
              />
            }
          />
        </View>
      </LinearGradient>
    );
  }

  const openExplorer = () => {
    if (!transaction.signature) return;
    Linking.openURL(getExplorerUrl(transaction.signature));
  };

  const copySignature = async () => {
    if (!transaction.signature) return;
    await Clipboard.setStringAsync(transaction.signature);
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    showAlert('Copied', 'Transaction signature copied to clipboard.');
  };

  const shareReceipt = async () => {
    const text = `SplitSOL: ${formatCurrency(transaction.amountUSDC)} - ${resolved.groupEmoji} ${resolved.groupName}\n${transaction.signature ? getExplorerUrl(transaction.signature) : ''}`;
    await Share.share({ message: text, title: 'Transaction Receipt' });
  };

  return (
    <LinearGradient
      colors={['#FDCBEE', '#E7D4FC', '#C1E6F5']}
      style={styles.container}
      start={{ x: 0, y: 0 }}
      end={{ x: 1, y: 1 }}
    >
      <ScrollView
        style={styles.scroll}
        contentContainerStyle={[
          styles.content,
          { paddingTop: insets.top + SPACING.lg, paddingBottom: insets.bottom + SPACING.xxxl },
        ]}
        showsVerticalScrollIndicator={false}
      >
        {/* Header */}
        <View style={styles.header}>
          <TouchableOpacity
            style={styles.backButton}
            onPress={() => router.back()}
            activeOpacity={0.7}
          >
            <Ionicons name="arrow-back" size={24} color="#111827" />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Transaction</Text>
        </View>

        {/* Transfer Hero Card */}
        <View style={styles.summaryCard}>
          <View style={styles.avatarRow}>
            <View style={styles.avatarWrap}>
              <Avatar name={resolved.payerName} size={60} color="#C4B5FD" />
              <Text style={styles.avatarLabel}>{resolved.payerName}</Text>
            </View>
            <View style={styles.arrowWrap}>
              <Ionicons name="arrow-forward" size={22} color="#9CA3AF" />
            </View>
            <View style={styles.avatarWrap}>
              <Avatar name={resolved.receiverName} size={60} color="#FBCFE8" />
              <Text style={styles.avatarLabel}>{resolved.receiverName}</Text>
            </View>
          </View>
          <View style={styles.amountRow}>
            <Text style={styles.amountValue}>
              {formatCurrency(transaction.amountUSDC).split(' ')[0]}
            </Text>
            <Text style={styles.amountCurrency}>USDC</Text>
          </View>
          <Text style={styles.fromGroup}>
            {resolved.groupEmoji} {resolved.groupName}
          </Text>

          {/* Status Badge */}
          <View style={{ marginTop: 16 }}>
            <Badge
              label={
                transaction.status === 'confirmed'
                  ? 'Confirmed'
                  : transaction.status === 'failed'
                    ? 'Failed'
                    : 'Pending'
              }
              variant={
                transaction.status === 'confirmed'
                  ? 'success'
                  : transaction.status === 'failed'
                    ? 'danger'
                    : 'warning'
              }
            />
          </View>
        </View>

        {/* Details List */}
        <View style={styles.detailsCard}>
          <View style={styles.txDetailsHeader}>
            <Ionicons name="list" size={22} color="#7C3AED" />
            <Text style={styles.txDetailsTitle}>Details</Text>
          </View>

          <View style={styles.txDetailRow}>
            <Text style={styles.txDetailLabel}>From Wallet</Text>
            <Text style={styles.txDetailValue}>
              {truncateAddress(transaction.payerWallet, 6)}
            </Text>
          </View>

          <View style={styles.txDetailRow}>
            <Text style={styles.txDetailLabel}>To Wallet</Text>
            <Text style={styles.txDetailValue}>
              {truncateAddress(transaction.receiverWallet, 6)}
            </Text>
          </View>

          <View style={styles.txDetailRow}>
            <Text style={styles.txDetailLabel}>Memo</Text>
            <Text style={styles.txDetailValue} numberOfLines={2}>
              {(transaction as Transaction & { memo?: string }).memo ?? '—'}
            </Text>
          </View>

          <View style={styles.txDetailRow}>
            <Text style={styles.txDetailLabel}>Signature</Text>
            <View style={styles.sigRow}>
              <Text style={styles.txDetailValue}>
                {transaction.signature
                  ? truncateAddress(transaction.signature, 8)
                  : '—'}
              </Text>
              {transaction.signature && (
                <TouchableOpacity
                  onPress={() => void copySignature()}
                  hitSlop={{ top: 12, bottom: 12, left: 12, right: 12 }}
                >
                  <Ionicons
                    name="copy-outline"
                    size={16}
                    color={COLORS.text.secondary}
                    style={{ marginLeft: 6 }}
                  />
                </TouchableOpacity>
              )}
            </View>
          </View>

          <View style={styles.txDetailRow}>
            <Text style={styles.txDetailLabel}>Time</Text>
            <Text style={styles.txDetailValue}>
              {formatDateTime(transaction.timestamp)}
            </Text>
          </View>

          <View style={styles.txDetailRow}>
            <Text style={styles.txDetailLabel}>Network</Text>
            <View style={{ alignItems: 'flex-end', flex: 1.5 }}>
              <Badge label="Devnet" variant="devnet" size="sm" />
            </View>
          </View>

          <View style={[styles.txDetailRow, { marginBottom: 0 }]}>
            <Text style={styles.txDetailLabel}>Network Fee</Text>
            <Text style={styles.txDetailValue}>~0.000005 SOL</Text>
          </View>
        </View>

        <View style={styles.actions}>
          <TouchableOpacity
            style={styles.primaryBtn}
            onPress={openExplorer}
            activeOpacity={0.8}
          >
            <Ionicons name="open-outline" size={20} color="#FFFFFF" />
            <Text style={styles.primaryBtnText}>View Explorer</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.secondaryBtn}
            onPress={() => void shareReceipt()}
            activeOpacity={0.8}
          >
            <Ionicons name="share-outline" size={20} color="#7C3AED" />
            <Text style={styles.secondaryBtnText}>Share Details</Text>
          </TouchableOpacity>
        </View>
      </ScrollView>
    </LinearGradient>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  missingWrap: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: SPACING.xl,
  },
  scroll: {
    flex: 1,
  },
  content: {
    paddingHorizontal: SPACING.xl,
    gap: SPACING.lg,
  },

  // Header
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: SPACING.md,
    paddingHorizontal: 4,
  },
  backButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: 'rgba(255, 255, 255, 0.55)',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 16,
  },
  headerTitle: {
    fontSize: 28,
    fontWeight: '800',
    color: '#111827',
  },

  // Summary card
  summaryCard: {
    backgroundColor: 'rgba(255, 255, 255, 0.65)',
    borderRadius: 28,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.8)',
    paddingVertical: 28,
    paddingHorizontal: 24,
    alignItems: 'center',
    marginBottom: SPACING.xs,
  },
  avatarRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 20,
  },
  avatarWrap: {
    alignItems: 'center',
    width: 85,
  },
  avatarLabel: {
    color: '#111827',
    fontSize: 15,
    fontWeight: '700',
    marginTop: 8,
    textAlign: 'center',
  },
  arrowWrap: {
    paddingHorizontal: 20,
  },
  amountRow: {
    flexDirection: 'row',
    alignItems: 'baseline',
    gap: 8,
    marginBottom: 8,
  },
  amountValue: {
    fontSize: 42,
    fontWeight: '900',
    color: '#111827',
    letterSpacing: -1,
  },
  amountCurrency: {
    fontSize: 20,
    fontWeight: '800',
    color: '#9CA3AF',
  },
  fromGroup: {
    color: '#6B7280',
    fontSize: 15,
    fontWeight: '600',
  },

  // Details List
  detailsCard: {
    backgroundColor: 'rgba(255, 255, 255, 0.65)',
    borderRadius: 24,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.8)',
    padding: 20,
    marginBottom: SPACING.xs,
  },
  txDetailsHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 18,
  },
  txDetailsTitle: {
    fontSize: 17,
    fontWeight: '800',
    color: '#111827',
  },
  txDetailRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 14,
  },
  txDetailLabel: {
    color: '#6B7280',
    fontSize: 14,
    fontWeight: '600',
    flex: 1,
  },
  txDetailValue: {
    color: '#111827',
    fontSize: 14,
    fontWeight: '700',
    textAlign: 'right',
    flex: 1.5,
  },
  sigRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'flex-end',
    flex: 1.5,
  },

  // Actions
  actions: {
    marginTop: 8,
    gap: 12,
  },
  primaryBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    backgroundColor: '#7C3AED',
    borderRadius: 24,
    paddingVertical: 16,
  },
  primaryBtnText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '800',
  },
  secondaryBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    backgroundColor: 'rgba(255, 255, 255, 0.6)',
    borderRadius: 24,
    paddingVertical: 16,
    borderWidth: 1.5,
    borderColor: 'rgba(124, 58, 237, 0.3)',
  },
  secondaryBtnText: {
    color: '#7C3AED',
    fontSize: 16,
    fontWeight: '800',
  },
});
