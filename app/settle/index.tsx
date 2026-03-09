import React, { useMemo } from 'react';
import {
  ScrollView,
  StyleSheet,
  Text,
  View,
  TouchableOpacity,
} from 'react-native';
import { useRouter } from 'expo-router';
import * as Haptics from 'expo-haptics';
import { LinearGradient } from 'expo-linear-gradient';
import Ionicons from '@expo/vector-icons/Ionicons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useAppStore } from '@/store/useAppStore';
import { EmptyState } from '@/components/ui/EmptyState';
import { COLORS, FONT, RADIUS, SPACING } from '@/utils/constants';

interface PendingDebtItem {
  groupId: string;
  groupName: string;
  groupEmoji: string;
  creditorId: string;
  creditorName: string;
  amount: number;
  settlementId: string;
}

const AVATAR_COLORS = [
  { bg: '#FCE7F3', text: '#BE185D' }, // pink
  { bg: '#DBEAFE', text: '#1D4ED8' }, // blue
  { bg: '#D1FAE5', text: '#047857' }, // green
  { bg: '#FEF3C7', text: '#B45309' }, // yellow
  { bg: '#F3E8FF', text: '#7E22CE' }, // purple
];

function getAvatarColors(name: string) {
  let hash = 0;
  for (let i = 0; i < name.length; i++) {
    hash = name.charCodeAt(i) + ((hash << 5) - hash);
  }
  return AVATAR_COLORS[Math.abs(hash) % AVATAR_COLORS.length];
}

export default function SettleHubScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const groups = useAppStore((s) => s.groups);
  const getSimplifiedDebts = useAppStore((s) => s.getSimplifiedDebts);

  const pendingDebts = useMemo(() => {
    const items: PendingDebtItem[] = [];

    for (const group of groups) {
      const debts = getSimplifiedDebts(group.id);

      for (const debt of debts) {
        if (!debt.from.isCurrentUser) continue;

        items.push({
          groupId: group.id,
          groupName: group.name,
          groupEmoji: group.emoji,
          creditorId: debt.to.id,
          creditorName: debt.to.name,
          amount: debt.amount,
          settlementId: `${debt.from.id}_${debt.to.id}`,
        });
      }
    }

    return items.sort((a, b) => b.amount - a.amount);
  }, [getSimplifiedDebts, groups]);

  const totalOwed = pendingDebts.reduce((sum, debt) => sum + debt.amount, 0);
  const groupCount = new Set(pendingDebts.map((d) => d.groupId)).size;

  return (
    <LinearGradient
      colors={['#FDCBEE', '#E7D4FC', '#C1E6F5']}
      style={styles.container}
      start={{ x: 0, y: 0 }}
      end={{ x: 1, y: 1 }}
    >
      <ScrollView
        contentContainerStyle={[
          styles.content,
          { paddingTop: insets.top + SPACING.lg },
        ]}
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.header}>
          <TouchableOpacity
            style={styles.backButton}
            onPress={() => router.back()}
            activeOpacity={0.7}
          >
            <Ionicons name="arrow-back" size={24} color="#111827" />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Settle Up</Text>
        </View>

        <View style={styles.heroCard}>
          <LinearGradient
            colors={['rgba(255, 255, 255, 0.9)', 'rgba(255, 255, 255, 0.8)']}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
            style={styles.heroGradient}
          >
            <Text style={styles.heroLabel}>Total to Settle</Text>
            <View style={styles.heroAmountRow}>
              <Text style={styles.heroAmount}>{totalOwed.toFixed(2)}</Text>
              <Text style={styles.heroCurrency}>USDC</Text>
            </View>
            <Text style={styles.heroSub}>
              {pendingDebts.length === 0
                ? "You're all settled up."
                : `across ${groupCount} group${groupCount === 1 ? '' : 's'}`}
            </Text>
          </LinearGradient>
        </View>

        {pendingDebts.length === 0 ? (
          <EmptyState
            emoji="✅"
            title="You're all settled up!"
            subtitle="No payments are due across any of your groups."
          />
        ) : (
          <View style={styles.list}>
            {pendingDebts.map((debt) => {
              const colors = getAvatarColors(debt.creditorName);
              return (
                <View key={`${debt.groupId}-${debt.creditorId}`} style={styles.debtCard}>
                  <View style={[styles.avatar, { backgroundColor: colors.bg }]}>
                    <Text style={[styles.avatarText, { color: colors.text }]}>
                      {debt.creditorName.charAt(0).toUpperCase()}
                    </Text>
                  </View>

                  <View style={styles.debtInfo}>
                    <Text style={styles.debtOweText}>You owe</Text>
                    <Text style={styles.debtName}>{debt.creditorName}</Text>
                    <Text style={styles.debtContext}>{debt.groupName}</Text>
                  </View>

                  <View style={styles.debtRight}>
                    <Text style={styles.debtAmount}>{debt.amount.toFixed(2)}</Text>
                    <TouchableOpacity
                      style={styles.settleBtn}
                      onPress={() => {
                        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                        router.push(
                          `/group/${debt.groupId}/settle/${debt.settlementId}` as any,
                        );
                      }}
                      activeOpacity={0.8}
                    >
                      <Text style={styles.settleBtnText}>Settle</Text>
                    </TouchableOpacity>
                  </View>
                </View>
              );
            })}
          </View>
        )}

        {pendingDebts.length > 0 && (
          <View style={styles.infoRow}>
            <Ionicons
              name="information-circle-outline"
              size={20}
              color="#2563EB"
              style={styles.infoIcon}
            />
            <Text style={styles.infoText}>
              Settlements are processed on Solana devnet. Ensure you have devnet SOL for gas fees.
            </Text>
          </View>
        )}
      </ScrollView>
    </LinearGradient>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  content: {
    paddingHorizontal: SPACING.xl,
    paddingBottom: SPACING.xxxl + 40,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: SPACING.xxxl,
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
  heroCard: {
    borderRadius: 32,
    overflow: 'hidden',
    backgroundColor: 'rgba(255, 255, 255, 0.45)',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.8)',
    marginBottom: SPACING.xxl,
  },
  heroGradient: {
    paddingVertical: 32,
    alignItems: 'center',
    borderRadius: 32,
  },
  heroLabel: {
    color: '#6B7280',
    fontSize: 15,
    fontWeight: '600',
    marginBottom: 8,
  },
  heroAmountRow: {
    flexDirection: 'row',
    alignItems: 'baseline',
    gap: 8,
    marginBottom: 12,
  },
  heroAmount: {
    color: '#EF4444',
    fontSize: 48,
    fontWeight: '900',
    letterSpacing: -1,
  },
  heroCurrency: {
    color: '#9CA3AF',
    fontSize: 22,
    fontWeight: '800',
  },
  heroSub: {
    color: '#6B7280',
    fontSize: 15,
    fontWeight: '600',
  },
  list: {
    gap: 16,
    marginBottom: SPACING.xxl,
  },
  debtCard: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 20,
    backgroundColor: 'rgba(255, 255, 255, 0.65)',
    borderRadius: 28,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.8)',
  },
  avatar: {
    width: 52,
    height: 52,
    borderRadius: 26,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 16,
  },
  avatarText: {
    fontSize: 22,
    fontWeight: '800',
  },
  debtInfo: {
    flex: 1,
  },
  debtOweText: {
    color: '#111827',
    fontSize: 16,
    fontWeight: '800',
    marginBottom: 2,
  },
  debtName: {
    color: '#111827',
    fontSize: 16,
    fontWeight: '800',
    marginBottom: 2,
  },
  debtContext: {
    color: '#6B7280',
    fontSize: 13,
    fontWeight: '500',
  },
  debtRight: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 16,
  },
  debtAmount: {
    color: '#EF4444',
    fontSize: 18,
    fontWeight: '900',
  },
  settleBtn: {
    backgroundColor: '#7C3AED',
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 20,
  },
  settleBtnText: {
    color: '#FFFFFF',
    fontSize: 15,
    fontWeight: '700',
  },
  infoRow: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(239, 246, 255, 0.65)',
    borderRadius: 20,
    paddingHorizontal: 20,
    paddingVertical: 16,
    borderWidth: 1,
    borderColor: 'rgba(219, 234, 254, 0.8)',
    gap: 12,
  },
  infoIcon: {
    marginTop: 2,
    alignSelf: 'flex-start',
  },
  infoText: {
    flex: 1,
    color: '#2563EB',
    fontSize: 14,
    fontWeight: '600',
    lineHeight: 20,
  },
});
