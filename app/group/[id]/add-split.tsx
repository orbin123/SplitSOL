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
import Ionicons from '@expo/vector-icons/Ionicons';
import { useAppStore } from '@/store/useAppStore';
import { showAlert } from '@/store/useAlertStore';
import { Input } from '@/components/ui/Input';
import { Button } from '@/components/ui/Button';
import { Avatar } from '@/components/ui/Avatar';
import { Card } from '@/components/ui/Card';
import { formatCurrency } from '@/utils/formatters';
import { COLORS, SPACING, FONT, RADIUS } from '@/utils/constants';

export default function AddSplit() {
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
  const [validationError, setValidationError] = useState<string | null>(null);

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

  const validateSplit = (): string | null => {
    if (!description.trim()) return 'Please enter a description';
    if (!amount || parsedAmount <= 0) return 'Please enter a valid amount';
    if (parsedAmount > 1000000) return 'Amount seems too large. Please double-check.';
    if (!paidBy) return 'Select who paid';
    if (splitAmong.length === 0) return 'Select at least one person to split with';
    return null;
  };


  const handleAdd = () => {
    const error = validateSplit();
    if (error) {
      setValidationError(error);
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
      showAlert('Missing Info', error);
      return;
    }

    setValidationError(null);
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

  const hasError = !!validationError;

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
        <Text style={styles.headerTitle}>Add Split</Text>
        <View style={styles.headerSpacer} />
      </View>

      <KeyboardAvoidingView
        style={styles.keyboardWrap}
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      >
        <ScrollView
          contentContainerStyle={styles.scrollContent}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
        >
          <Card style={styles.formCard}>
            <Input
              placeholder="What's this for?"
              value={description}
              onChangeText={(t) => {
                setDescription(t);
                setValidationError(null);
              }}
              maxLength={100}
              error={
                hasError && !description.trim() && validationError
                  ? validationError
                  : undefined
              }
            />

            <View
              style={[
                styles.amountRow,
                hasError && (!amount || parsedAmount <= 0 || parsedAmount > 1000000) && styles.inputError,
              ]}
            >
              <TextInput
                style={styles.amountInput}
                value={amount}
                onChangeText={(t) => {
                  setAmount(t);
                  setValidationError(null);
                }}
                keyboardType="decimal-pad"
                placeholder="0.00"
                placeholderTextColor={COLORS.text.tertiary}
                autoFocus
              />
              <View style={styles.usdcBadge}>
                <Text style={styles.usdcText}>USDC</Text>
              </View>
            </View>
            {hasError && (!amount || parsedAmount <= 0 || parsedAmount > 1000000) && validationError && (
              <Text style={styles.errorText}>{validationError}</Text>
            )}

            <View style={styles.divider} />

            <Text style={styles.sectionLabel}>Paid by</Text>
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
                    <Avatar name={member.name} size={32} />
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

            <View style={styles.divider} />

            <Text style={styles.sectionLabel}>Split among</Text>
            <Text style={styles.equalSplitLabel}>Equal Split</Text>
            <View style={styles.splitList}>
              {group.members.map((member) => {
                const selected = splitAmong.includes(member.id);
                return (
                  <TouchableOpacity
                    key={member.id}
                    style={styles.splitRow}
                    onPress={() => toggleSplit(member.id)}
                    activeOpacity={0.7}
                  >
                    <Avatar name={member.name} size={32} />
                    <Text style={styles.splitName} numberOfLines={1}>
                      {member.isCurrentUser ? 'You' : member.name}
                    </Text>
                    <View
                      style={[
                        styles.checkbox,
                        selected && styles.checkboxActive,
                      ]}
                    >
                      {selected && (
                        <Ionicons name="checkmark" size={14} color={COLORS.text.white} />
                      )}
                    </View>
                  </TouchableOpacity>
                );
              })}
            </View>
            {parsedAmount > 0 && splitAmong.length > 0 && (
              <View style={styles.perPersonPill}>
                <Text style={styles.perPersonText}>
                  Each person pays: {formatCurrency(splitAmount)}
                </Text>
              </View>
            )}
          </Card>
        </ScrollView>

        <View style={[styles.bottomBar, { paddingBottom: insets.bottom || SPACING.lg }]}>
          <Button
            title="Add Split"
            onPress={handleAdd}
            disabled={!isValid}
            size="lg"
            style={styles.addBtn}
          />
        </View>
      </KeyboardAvoidingView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: 'transparent',
  },
  notFound: {
    color: COLORS.text.secondary,
    fontSize: FONT.size.md,
    textAlign: 'center',
    marginTop: 100,
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
  keyboardWrap: {
    flex: 1,
  },
  scrollContent: {
    padding: SPACING.xl,
    paddingBottom: SPACING.xxl,
  },
  formCard: {
    padding: SPACING.xxl,
    gap: SPACING.lg,
  },
  amountRow: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255, 255, 255, 0.7)',
    borderRadius: 16,
    borderWidth: 1,
    borderColor: '#E9D5FF',
    paddingHorizontal: SPACING.lg,
    paddingVertical: SPACING.md,
  },
  amountInput: {
    flex: 1,
    color: COLORS.text.primary,
    fontSize: 28,
    fontWeight: FONT.weight.bold,
    padding: 0,
  },
  inputError: {
    borderColor: COLORS.bg.danger,
  },
  usdcBadge: {
    backgroundColor: '#F3F4F6',
    paddingHorizontal: SPACING.md,
    paddingVertical: SPACING.xs,
    borderRadius: RADIUS.full,
  },
  usdcText: {
    color: COLORS.text.secondary,
    fontSize: FONT.size.sm,
    fontWeight: FONT.weight.medium,
  },
  errorText: {
    color: COLORS.text.danger,
    fontSize: FONT.size.xs,
    marginTop: SPACING.xs,
  },
  divider: {
    height: 1,
    backgroundColor: 'rgba(0,0,0,0.06)',
    marginVertical: SPACING.sm,
  },
  sectionLabel: {
    color: COLORS.text.secondary,
    fontSize: FONT.size.sm,
    fontWeight: FONT.weight.semibold,
  },
  memberScroll: {
    flexDirection: 'row',
    gap: SPACING.sm,
  },
  memberChip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING.sm,
    paddingVertical: SPACING.sm,
    paddingHorizontal: SPACING.md,
    borderRadius: RADIUS.full,
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: COLORS.border.default,
  },
  memberChipActive: {
    backgroundColor: COLORS.bg.accent,
    borderColor: COLORS.bg.accent,
  },
  memberChipText: {
    color: COLORS.text.secondary,
    fontSize: FONT.size.sm,
    fontWeight: FONT.weight.medium,
    maxWidth: 80,
  },
  memberChipTextActive: {
    color: COLORS.text.white,
  },
  equalSplitLabel: {
    color: COLORS.text.secondary,
    fontSize: FONT.size.sm,
    marginBottom: SPACING.sm,
  },
  splitList: {
    gap: SPACING.sm,
  },
  splitRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING.md,
  },
  splitName: {
    flex: 1,
    color: COLORS.text.primary,
    fontSize: FONT.size.md,
    fontWeight: FONT.weight.medium,
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
    backgroundColor: COLORS.bg.accent,
    borderColor: COLORS.bg.accent,
  },
  perPersonPill: {
    backgroundColor: '#EDE9FE',
    paddingHorizontal: SPACING.md,
    paddingVertical: SPACING.sm,
    borderRadius: RADIUS.full,
    alignSelf: 'flex-start',
    marginTop: SPACING.sm,
  },
  perPersonText: {
    color: COLORS.text.primary,
    fontSize: FONT.size.sm,
    fontWeight: FONT.weight.medium,
  },
  bottomBar: {
    paddingHorizontal: SPACING.xl,
    paddingTop: SPACING.lg,
    backgroundColor: 'rgba(255, 255, 255, 0.95)',
    borderTopWidth: 1,
    borderTopColor: COLORS.border.default,
  },
  addBtn: {
    width: '100%',
  },
});
