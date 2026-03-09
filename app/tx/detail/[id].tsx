import React, { useMemo } from 'react';
import {
  Linking,
  Platform,
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
import { formatCurrency, truncateAddress } from '@/utils/formatters';
import { getExplorerUrl } from '@/utils/solana';
import { COLORS, FONT, SPACING, SOLANA } from '@/utils/constants';
import type { Group, Settlement } from '@/types';

const formatDateTime = (value: string) =>
  new Date(value).toLocaleString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
    hour: 'numeric',
    minute: '2-digit',
  });

function paymentMethodDisplay(method: string | null | undefined): string {
  if (!method || method === 'USDC') return 'Direct USDC Transfer';
  if (method === 'SOL_EQUIVALENT') return 'AutoPay — SOL equivalent (devnet)';
  if (method === 'JUPITER_SWAP') return 'AutoPay — Jupiter SOL → USDC';
  return method;
}

export default function TransactionDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  const insets = useSafeAreaInsets();

  const groups = useAppStore((s) => s.groups);
  const transactions = useAppStore((s) => s.transactions);

  // Primary: look up as a settlement ID across all groups
  const { settlement, settlementGroup } = useMemo<{
    settlement: Settlement | null;
    settlementGroup: Group | null;
  }>(() => {
    for (const group of groups) {
      const s = group.settlements.find((item) => item.id === id);
      if (s) return { settlement: s, settlementGroup: group };
    }
    return { settlement: null, settlementGroup: null };
  }, [groups, id]);

  // Secondary: also look up legacy transaction (for backward compat or if no settlement)
  const transaction = useMemo(() => {
    if (settlement?.txSignature) {
      return (
        transactions.find((t) => t.signature === settlement.txSignature) ??
        transactions.find((t) => t.id === id) ??
        null
      );
    }
    return transactions.find((t) => t.id === id) ?? null;
  }, [transactions, settlement, id]);

  // Resolve member names from the group
  const fromMember = useMemo(
    () => settlementGroup?.members.find((m) => m.id === settlement?.from) ?? null,
    [settlementGroup, settlement],
  );
  const toMember = useMemo(
    () => settlementGroup?.members.find((m) => m.id === settlement?.to) ?? null,
    [settlementGroup, settlement],
  );

  if (!settlement && !transaction) {
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
                title="Back to Activity"
                onPress={() => router.replace('/(tabs)/activity')}
              />
            }
          />
        </View>
      </LinearGradient>
    );
  }

  // ── Resolved display values ──────────────────────────────────────────────
  const txSignature = settlement?.txSignature ?? transaction?.signature ?? null;
  const amount = settlement?.amount ?? transaction?.amountUSDC ?? 0;
  const status = settlement?.status ?? transaction?.status ?? 'pending';
  const memo = settlement?.memo ?? transaction?.memo ?? null;
  const paymentMethod = settlement?.paymentMethod ?? null;
  const timestamp = settlement?.settledAt ?? transaction?.timestamp ?? new Date().toISOString();
  const confirmedAt = settlement?.confirmedAt ?? null;
  const networkFee = transaction?.chain?.networkFee ?? SOLANA.NETWORK_FEE;

  // Names
  const payerName = fromMember?.name ?? truncateAddress(transaction?.payerWallet ?? '', 5) ?? 'Unknown';
  const receiverName = toMember?.name ?? truncateAddress(transaction?.receiverWallet ?? '', 5) ?? 'Unknown';

  // Wallets
  const fromWallet =
    fromMember?.walletAddress ??
    transaction?.payerWallet ??
    settlement?.fromWallet ??
    null;
  const toWallet =
    toMember?.walletAddress ??
    transaction?.receiverWallet ??
    settlement?.toWallet ??
    null;

  // Group
  const groupName = settlementGroup?.name ?? 'Unknown group';
  const groupEmoji = settlementGroup?.emoji ?? '🧾';

  const openExplorer = () => {
    if (!txSignature) return;
    Linking.openURL(getExplorerUrl(txSignature));
  };

  const copySignature = async () => {
    if (!txSignature) return;
    await Clipboard.setStringAsync(txSignature);
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    showAlert('Copied', 'Transaction signature copied to clipboard.');
  };

  const shareReceipt = async () => {
    const lines = [
      `SplitSOL Settlement Receipt`,
      ``,
      `💰 Amount: ${formatCurrency(amount)}`,
      `👤 From: ${payerName}`,
      `👤 To: ${receiverName}`,
      `📁 Group: ${groupEmoji} ${groupName}`,
      `🔗 Method: ${paymentMethodDisplay(paymentMethod)}`,
      memo ? `📝 Memo: ${memo}` : null,
      `⏱ Time: ${formatDateTime(timestamp)}`,
      `🌐 Network: Solana ${SOLANA.CLUSTER}`,
      txSignature ? `🆔 Tx: ${txSignature}` : null,
      txSignature ? `🔍 Explorer: ${getExplorerUrl(txSignature)}` : null,
      ``,
      `Powered by SplitSOL ⚡`,
    ]
      .filter(Boolean)
      .join('\n');

    try {
      await Share.share({ message: lines, title: 'SplitSOL Receipt' });
    } catch {
      // user cancelled
    }
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
              <Avatar name={payerName} size={60} color="#C4B5FD" />
              <Text style={styles.avatarLabel}>{payerName}</Text>
            </View>
            <View style={styles.arrowWrap}>
              <Ionicons name="arrow-forward" size={22} color="#9CA3AF" />
            </View>
            <View style={styles.avatarWrap}>
              <Avatar name={receiverName} size={60} color="#FBCFE8" />
              <Text style={styles.avatarLabel}>{receiverName}</Text>
            </View>
          </View>

          <View style={styles.amountRow}>
            <Text style={styles.amountValue}>
              {amount.toFixed(2)}
            </Text>
            <Text style={styles.amountCurrency}>USDC</Text>
          </View>

          <Text style={styles.fromGroup}>{groupEmoji} {groupName}</Text>

          <View style={styles.badgeRow}>
            <Badge
              label={
                status === 'confirmed' ? 'Confirmed' :
                status === 'failed' ? 'Failed' : 'Pending'
              }
              variant={
                status === 'confirmed' ? 'success' :
                status === 'failed' ? 'danger' : 'warning'
              }
            />
            <Badge
              label={SOLANA.CLUSTER === 'devnet' ? 'Devnet' : 'Mainnet'}
              variant="devnet"
            />
          </View>
        </View>

        {/* Details Card */}
        <View style={styles.detailsCard}>
          <View style={styles.detailsHeader}>
            <Ionicons name="receipt-outline" size={20} color="#7C3AED" />
            <Text style={styles.detailsTitle}>Details</Text>
          </View>

          <DetailRow label="Payment method" value={paymentMethodDisplay(paymentMethod)} />

          {fromWallet ? (
            <DetailRow
              label="From wallet"
              value={truncateAddress(fromWallet, 6)}
              mono
            />
          ) : null}

          {toWallet ? (
            <DetailRow
              label="To wallet"
              value={truncateAddress(toWallet, 6)}
              mono
            />
          ) : null}

          {memo ? <DetailRow label="Memo" value={memo} multiline /> : null}

          <DetailRow label="Date" value={formatDateTime(timestamp)} />

          {confirmedAt && confirmedAt !== timestamp ? (
            <DetailRow label="Confirmed at" value={formatDateTime(confirmedAt)} />
          ) : null}

          <DetailRow label="Network fee" value={`~${networkFee} SOL`} />

          {txSignature ? (
            <View style={styles.detailRow}>
              <Text style={styles.detailLabel}>Signature</Text>
              <TouchableOpacity
                style={styles.sigRow}
                onPress={() => void copySignature()}
                activeOpacity={0.7}
              >
                <Text style={[styles.detailValue, styles.mono]} numberOfLines={1}>
                  {truncateAddress(txSignature, 8)}
                </Text>
                <Ionicons
                  name="copy-outline"
                  size={15}
                  color={COLORS.text.secondary}
                  style={{ marginLeft: 6 }}
                />
              </TouchableOpacity>
            </View>
          ) : null}
        </View>

        {/* Full signature block (copyable) */}
        {txSignature && (
          <TouchableOpacity
            style={styles.sigCard}
            onPress={() => void copySignature()}
            activeOpacity={0.75}
          >
            <View style={styles.sigCardHeader}>
              <Ionicons name="key-outline" size={16} color="#7C3AED" />
              <Text style={styles.sigCardLabel}>Full Signature</Text>
              <Ionicons name="copy-outline" size={15} color="#7C3AED" />
            </View>
            <Text style={styles.sigFull} selectable numberOfLines={3}>
              {txSignature}
            </Text>
          </TouchableOpacity>
        )}

        {/* Actions */}
        <View style={styles.actions}>
          {txSignature ? (
            <TouchableOpacity
              style={styles.primaryBtn}
              onPress={openExplorer}
              activeOpacity={0.8}
            >
              <Ionicons name="open-outline" size={20} color="#FFFFFF" />
              <Text style={styles.primaryBtnText}>View on Explorer</Text>
            </TouchableOpacity>
          ) : null}

          <TouchableOpacity
            style={styles.secondaryBtn}
            onPress={() => void shareReceipt()}
            activeOpacity={0.8}
          >
            <Ionicons name="share-outline" size={20} color="#7C3AED" />
            <Text style={styles.secondaryBtnText}>Share Receipt</Text>
          </TouchableOpacity>
        </View>
      </ScrollView>
    </LinearGradient>
  );
}

function DetailRow({
  label,
  value,
  mono = false,
  multiline = false,
}: {
  label: string;
  value: string;
  mono?: boolean;
  multiline?: boolean;
}) {
  return (
    <View style={[styles.detailRow, multiline && { alignItems: 'flex-start' }]}>
      <Text style={styles.detailLabel}>{label}</Text>
      <Text
        style={[styles.detailValue, mono && styles.mono]}
        numberOfLines={multiline ? 4 : 1}
      >
        {value}
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  missingWrap: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: SPACING.xl,
  },
  scroll: { flex: 1 },
  content: { paddingHorizontal: SPACING.xl, gap: SPACING.lg },

  // Header
  header: {
    flexDirection: 'row',
    alignItems: 'center',
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
  headerTitle: { fontSize: 28, fontWeight: '800', color: '#111827' },

  // Summary card
  summaryCard: {
    backgroundColor: 'rgba(255, 255, 255, 0.65)',
    borderRadius: 28,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.8)',
    paddingVertical: 28,
    paddingHorizontal: 24,
    alignItems: 'center',
  },
  avatarRow: { flexDirection: 'row', alignItems: 'center', marginBottom: 20 },
  avatarWrap: { alignItems: 'center', width: 85 },
  avatarLabel: {
    color: '#111827', fontSize: 15, fontWeight: '700',
    marginTop: 8, textAlign: 'center',
  },
  arrowWrap: { paddingHorizontal: 20 },
  amountRow: {
    flexDirection: 'row', alignItems: 'baseline',
    gap: 8, marginBottom: 8,
  },
  amountValue: { fontSize: 42, fontWeight: '900', color: '#111827', letterSpacing: -1 },
  amountCurrency: { fontSize: 20, fontWeight: '800', color: '#9CA3AF' },
  fromGroup: { color: '#6B7280', fontSize: 15, fontWeight: '600', marginBottom: 16 },
  badgeRow: { flexDirection: 'row', gap: 8 },

  // Details Card
  detailsCard: {
    backgroundColor: 'rgba(255, 255, 255, 0.65)',
    borderRadius: 24,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.8)',
    padding: 20,
  },
  detailsHeader: {
    flexDirection: 'row', alignItems: 'center',
    gap: 8, marginBottom: 18,
  },
  detailsTitle: { fontSize: 17, fontWeight: '800', color: '#111827' },
  detailRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 11,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(0,0,0,0.05)',
  },
  detailLabel: { color: '#6B7280', fontSize: 14, fontWeight: '600', flex: 1 },
  detailValue: {
    color: '#111827', fontSize: 14, fontWeight: '700',
    textAlign: 'right', flex: 1.5,
  },
  mono: {
    fontFamily: Platform.OS === 'ios' ? 'Menlo' : 'monospace',
    fontSize: 13,
  },
  sigRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'flex-end',
    flex: 1.5,
  },

  // Full signature card
  sigCard: {
    backgroundColor: 'rgba(255, 255, 255, 0.55)',
    borderRadius: 20,
    borderWidth: 1,
    borderColor: 'rgba(124, 58, 237, 0.2)',
    padding: 16,
    gap: 10,
  },
  sigCardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  sigCardLabel: { flex: 1, color: '#7C3AED', fontSize: 14, fontWeight: '700' },
  sigFull: {
    fontFamily: Platform.OS === 'ios' ? 'Menlo' : 'monospace',
    fontSize: 12,
    color: '#374151',
    lineHeight: 18,
  },

  // Actions
  actions: { gap: 12 },
  primaryBtn: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center',
    gap: 8, backgroundColor: '#7C3AED', borderRadius: 24, paddingVertical: 16,
  },
  primaryBtnText: { color: '#FFFFFF', fontSize: 16, fontWeight: '800' },
  secondaryBtn: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center',
    gap: 8,
    backgroundColor: 'rgba(255, 255, 255, 0.6)',
    borderRadius: 24, paddingVertical: 16,
    borderWidth: 1.5,
    borderColor: 'rgba(124, 58, 237, 0.3)',
  },
  secondaryBtnText: { color: '#7C3AED', fontSize: 16, fontWeight: '800' },
});
