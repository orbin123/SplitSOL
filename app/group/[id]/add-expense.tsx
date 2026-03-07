import React, { useState, useMemo } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  KeyboardAvoidingView,
  Platform,
  TextInput,
  Alert,
} from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import * as Haptics from 'expo-haptics';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import Ionicons from '@expo/vector-icons/Ionicons';
import { useAppStore } from '@/store/useAppStore';
import { Input } from '@/components/ui/Input';
import { Button } from '@/components/ui/Button';
import { Avatar } from '@/components/ui/Avatar';
import { formatCurrency } from '@/utils/formatters';
import { COLORS, GRADIENTS, SPACING, FONT, RADIUS } from '@/utils/constants';

export default function AddExpense() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const group = useAppStore((s) => s.getGroup(id));
  const addExpense = useAppStore((s) => s.addExpense);

  const [description, setDescription] = useState('');
  const [amount, setAmount] = useState('');
  const [paidBy, setPaidBy] = useState<string>(
    group?.members.find((m) => m.isCurrentUser)?.id ?? '',
  );
  const [splitAmong, setSplitAmong] = useState<string[]>(
    group?.members.map((m) => m.id) ?? [],
  );

  const parsedAmount = parseFloat(amount) || 0;
  const splitAmount = useMemo(() => {
    if (splitAmong.length === 0 || parsedAmount <= 0) return 0;
    return Math.round((parsedAmount / splitAmong.length) * 100) / 100;
  }, [parsedAmount, splitAmong.length]);

  if (!group) {
    return (
      <View style={styles.container}>
        <Text style={styles.notFound}>Group not found</Text>
      </View>
    );
  }

  const toggleSplit = (memberId: string) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    setSplitAmong((prev) =>
      prev.includes(memberId)
        ? prev.filter((i) => i !== memberId)
        : [...prev, memberId],
    );
  };

  const validateExpense = (): string | null => {
    if (!description.trim()) return 'Please enter a description';
    if (!amount || parsedAmount <= 0) return 'Please enter a valid amount';
    if (parsedAmount > 1000000) return 'Amount seems too large. Please double-check.';
    if (!paidBy) return 'Select who paid';
    if (splitAmong.length === 0) return 'Select at least one person to split with';
    return null;
  };

  const handleAdd = () => {
    const error = validateExpense();
    if (error) {
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
      Alert.alert('Missing Info', error);
      return;
    }

    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    addExpense(id, {
      description: description.trim(),
      amount: parsedAmount,
      paidBy,
      splitAmong,
      splitType: 'equal',
    });

    router.back();
  };

  const isValid =
    description.trim() && parsedAmount > 0 && paidBy && splitAmong.length > 0;

  return (
    <KeyboardAvoidingView
      style={[styles.container, { paddingTop: insets.top }]}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
    >
      <ScrollView
        contentContainerStyle={styles.scrollContent}
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}
      >
        {/* Amount Card */}
        <LinearGradient
          colors={GRADIENTS.purple}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={styles.amountCard}
        >
          <TouchableOpacity
            onPress={() => router.back()}
            style={styles.backBtn}
            activeOpacity={0.7}
          >
            <Ionicons
              name="chevron-back"
              size={24}
              color={COLORS.text.primary}
            />
          </TouchableOpacity>

          <Text style={styles.amountLabel}>AMOUNT</Text>
          <View style={styles.amountInputRow}>
            <TextInput
              style={styles.amountInput}
              value={amount}
              onChangeText={setAmount}
              keyboardType="decimal-pad"
              placeholder="0"
              placeholderTextColor={COLORS.text.tertiary}
              autoFocus
            />
          </View>
          <View style={styles.currencyBadge}>
            <Text style={styles.currencyText}>USDC</Text>
            <Ionicons
              name="chevron-down"
              size={14}
              color={COLORS.text.secondary}
            />
          </View>
        </LinearGradient>

        {/* Description */}
        <View style={styles.section}>
          <Text style={styles.sectionLabel}>DESCRIPTION</Text>
          <Input
            placeholder="e.g. Dinner, Uber, Groceries"
            value={description}
            onChangeText={setDescription}
            maxLength={100}
          />
        </View>

        {/* Paid by */}
        <View style={styles.section}>
          <Text style={styles.sectionLabel}>PAID BY</Text>
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={styles.memberScroll}
          >
            {group.members.map((member) => {
              const isActive = paidBy === member.id;
              return (
                <TouchableOpacity
                  key={member.id}
                  style={[
                    styles.memberChip,
                    isActive && styles.memberChipActive,
                  ]}
                  onPress={() => {
                    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                    setPaidBy(member.id);
                  }}
                  activeOpacity={0.7}
                >
                  <Avatar name={member.name} size={28} />
                  <Text
                    style={[
                      styles.memberChipText,
                      isActive && styles.memberChipTextActive,
                    ]}
                    numberOfLines={1}
                  >
                    {member.isCurrentUser ? 'You' : member.name}
                  </Text>
                </TouchableOpacity>
              );
            })}
          </ScrollView>
        </View>

        {/* Split among */}
        <View style={styles.section}>
          <Text style={styles.sectionLabel}>SPLIT AMONG</Text>
          <View style={styles.splitList}>
            {group.members.map((member) => {
              const selected = splitAmong.includes(member.id);
              return (
                <TouchableOpacity
                  key={member.id}
                  style={[
                    styles.splitRow,
                    selected && styles.splitRowActive,
                  ]}
                  onPress={() => toggleSplit(member.id)}
                  activeOpacity={0.7}
                >
                  <Avatar name={member.name} size={32} />
                  <Text
                    style={[
                      styles.splitName,
                      selected && styles.splitNameActive,
                    ]}
                    numberOfLines={1}
                  >
                    {member.isCurrentUser ? 'You' : member.name}
                  </Text>
                  <Text style={styles.splitAmount}>
                    {selected && parsedAmount > 0
                      ? formatCurrency(splitAmount)
                      : ''}
                  </Text>
                  <View
                    style={[
                      styles.checkbox,
                      selected && styles.checkboxActive,
                    ]}
                  >
                    {selected && (
                      <Ionicons
                        name="checkmark"
                        size={14}
                        color={COLORS.text.white}
                      />
                    )}
                  </View>
                </TouchableOpacity>
              );
            })}
          </View>
        </View>
      </ScrollView>

      {/* Bottom Button */}
      <View
        style={[styles.bottomBar, { paddingBottom: insets.bottom || SPACING.lg }]}
      >
        <Button
          title="Add Expense →"
          variant="dark"
          size="lg"
          onPress={handleAdd}
          disabled={!isValid}
          style={styles.addBtn}
        />
      </View>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.bg.primary,
  },
  notFound: {
    color: COLORS.text.secondary,
    fontSize: FONT.size.md,
    textAlign: 'center',
    marginTop: 100,
  },
  scrollContent: {
    paddingBottom: SPACING.xxl,
  },

  amountCard: {
    paddingTop: SPACING.lg,
    paddingBottom: SPACING.xxl,
    paddingHorizontal: SPACING.xxl,
    alignItems: 'center',
    borderBottomLeftRadius: RADIUS.xxl,
    borderBottomRightRadius: RADIUS.xxl,
  },
  backBtn: {
    alignSelf: 'flex-start',
    width: 36,
    height: 36,
    borderRadius: 18,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: SPACING.md,
  },
  amountLabel: {
    color: COLORS.text.accent,
    fontSize: FONT.size.xs,
    fontWeight: FONT.weight.semibold,
    letterSpacing: 1,
    marginBottom: SPACING.sm,
  },
  amountInputRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  amountInput: {
    color: COLORS.text.primary,
    fontSize: 36,
    fontWeight: FONT.weight.extrabold,
    minWidth: 60,
    textAlign: 'center',
  },
  currencyBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255,255,255,0.5)',
    paddingHorizontal: SPACING.md,
    paddingVertical: SPACING.xs,
    borderRadius: RADIUS.full,
    gap: SPACING.xs,
    marginTop: SPACING.md,
  },
  currencyText: {
    color: COLORS.text.secondary,
    fontSize: FONT.size.sm,
    fontWeight: FONT.weight.medium,
  },

  section: {
    paddingHorizontal: SPACING.xxl,
    marginTop: SPACING.xxl,
    gap: SPACING.md,
  },
  sectionLabel: {
    color: COLORS.text.secondary,
    fontSize: FONT.size.xs,
    fontWeight: FONT.weight.semibold,
    letterSpacing: 1,
  },

  memberScroll: {
    gap: SPACING.sm,
  },
  memberChip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING.sm,
    paddingVertical: SPACING.sm,
    paddingHorizontal: SPACING.md,
    borderRadius: RADIUS.full,
    backgroundColor: COLORS.bg.secondary,
    borderWidth: 1.5,
    borderColor: COLORS.border.default,
  },
  memberChipActive: {
    borderColor: COLORS.bg.accent,
    backgroundColor: COLORS.bg.accentSoft,
  },
  memberChipText: {
    color: COLORS.text.secondary,
    fontSize: FONT.size.sm,
    fontWeight: FONT.weight.medium,
    maxWidth: 80,
  },
  memberChipTextActive: {
    color: COLORS.text.primary,
  },

  splitList: {
    gap: SPACING.sm,
  },
  splitRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING.md,
    paddingVertical: SPACING.md,
    paddingHorizontal: SPACING.lg,
    borderRadius: RADIUS.md,
    backgroundColor: COLORS.bg.secondary,
    borderWidth: 1.5,
    borderColor: COLORS.border.default,
  },
  splitRowActive: {
    borderColor: COLORS.bg.success,
    backgroundColor: 'rgba(16, 185, 129, 0.04)',
  },
  splitName: {
    color: COLORS.text.secondary,
    fontSize: FONT.size.md,
    fontWeight: FONT.weight.medium,
    flex: 1,
  },
  splitNameActive: {
    color: COLORS.text.primary,
  },
  splitAmount: {
    color: COLORS.text.success,
    fontSize: FONT.size.sm,
    fontWeight: FONT.weight.semibold,
    minWidth: 60,
    textAlign: 'right',
  },
  checkbox: {
    width: 24,
    height: 24,
    borderRadius: 12,
    borderWidth: 2,
    borderColor: COLORS.border.default,
    alignItems: 'center',
    justifyContent: 'center',
  },
  checkboxActive: {
    backgroundColor: COLORS.bg.success,
    borderColor: COLORS.bg.success,
  },

  bottomBar: {
    paddingHorizontal: SPACING.xxl,
    paddingTop: SPACING.lg,
    backgroundColor: COLORS.bg.primary,
    borderTopWidth: 1,
    borderTopColor: COLORS.border.default,
  },
  addBtn: {
    width: '100%',
    borderRadius: RADIUS.lg,
  },
});
