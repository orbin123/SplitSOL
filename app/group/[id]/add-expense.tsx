import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useAppStore } from '@/store/useAppStore';
import { Input } from '@/components/ui/Input';
import { Button } from '@/components/ui/Button';
import { Avatar } from '@/components/ui/Avatar';
import { COLORS, SPACING, FONT, RADIUS } from '@/utils/constants';

export default function AddExpense() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  const group = useAppStore((s) => s.getGroup(id));
  const addExpense = useAppStore((s) => s.addExpense);

  const [description, setDescription] = useState('');
  const [amount, setAmount] = useState('');
  const [paidBy, setPaidBy] = useState<string>(
    group?.members.find((m) => m.isCurrentUser)?.id ?? ''
  );
  const [splitAmong, setSplitAmong] = useState<string[]>(
    group?.members.map((m) => m.id) ?? []
  );

  if (!group) {
    return (
      <View style={styles.container}>
        <Text style={styles.notFound}>Group not found</Text>
      </View>
    );
  }

  const toggleSplit = (memberId: string) => {
    setSplitAmong((prev) =>
      prev.includes(memberId)
        ? prev.filter((id) => id !== memberId)
        : [...prev, memberId]
    );
  };

  const handleAdd = () => {
    const trimmedDesc = description.trim();
    const parsedAmount = parseFloat(amount);
    if (!trimmedDesc || isNaN(parsedAmount) || parsedAmount <= 0) return;
    if (!paidBy || splitAmong.length === 0) return;

    addExpense(id, {
      description: trimmedDesc,
      amount: parsedAmount,
      paidBy,
      splitAmong,
      splitType: 'equal',
    });

    router.back();
  };

  const isValid =
    description.trim() &&
    parseFloat(amount) > 0 &&
    paidBy &&
    splitAmong.length > 0;

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
    >
      <ScrollView
        contentContainerStyle={styles.content}
        keyboardShouldPersistTaps="handled"
      >
        <Input
          label="What's this for?"
          placeholder="e.g. Dinner, Uber, Groceries"
          value={description}
          onChangeText={setDescription}
          autoFocus
          maxLength={100}
        />

        <Input
          label="Amount"
          placeholder="0.00"
          value={amount}
          onChangeText={setAmount}
          keyboardType="decimal-pad"
        />

        {/* Paid by */}
        <View style={styles.section}>
          <Text style={styles.sectionLabel}>Paid by</Text>
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={styles.memberScroll}
          >
            {group.members.map((member) => (
              <TouchableOpacity
                key={member.id}
                style={[
                  styles.memberChip,
                  paidBy === member.id && styles.memberChipActive,
                ]}
                onPress={() => setPaidBy(member.id)}
                activeOpacity={0.7}
              >
                <Avatar name={member.name} size={28} />
                <Text
                  style={[
                    styles.memberChipText,
                    paidBy === member.id && styles.memberChipTextActive,
                  ]}
                  numberOfLines={1}
                >
                  {member.name}
                </Text>
              </TouchableOpacity>
            ))}
          </ScrollView>
        </View>

        {/* Split among */}
        <View style={styles.section}>
          <Text style={styles.sectionLabel}>Split among</Text>
          <View style={styles.splitGrid}>
            {group.members.map((member) => {
              const selected = splitAmong.includes(member.id);
              return (
                <TouchableOpacity
                  key={member.id}
                  style={[
                    styles.splitChip,
                    selected && styles.splitChipActive,
                  ]}
                  onPress={() => toggleSplit(member.id)}
                  activeOpacity={0.7}
                >
                  <View style={styles.checkbox}>
                    {selected && <View style={styles.checkboxInner} />}
                  </View>
                  <Avatar name={member.name} size={24} />
                  <Text
                    style={[
                      styles.splitChipText,
                      selected && styles.splitChipTextActive,
                    ]}
                    numberOfLines={1}
                  >
                    {member.name}
                  </Text>
                </TouchableOpacity>
              );
            })}
          </View>
        </View>

        <Button
          title="Add Expense"
          onPress={handleAdd}
          disabled={!isValid}
          size="lg"
        />
      </ScrollView>
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
  content: {
    padding: SPACING.xxl,
    gap: SPACING.xxl,
  },

  // Sections
  section: {
    gap: SPACING.md,
  },
  sectionLabel: {
    color: COLORS.text.secondary,
    fontSize: FONT.size.sm,
    fontWeight: FONT.weight.medium,
  },

  // Paid by chips
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
    backgroundColor: COLORS.bg.tertiary,
    borderWidth: 1.5,
    borderColor: 'transparent',
  },
  memberChipActive: {
    borderColor: COLORS.bg.accent,
    backgroundColor: COLORS.bg.secondary,
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

  // Split checkboxes
  splitGrid: {
    gap: SPACING.sm,
  },
  splitChip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING.md,
    paddingVertical: SPACING.md,
    paddingHorizontal: SPACING.lg,
    borderRadius: RADIUS.md,
    backgroundColor: COLORS.bg.tertiary,
    borderWidth: 1.5,
    borderColor: 'transparent',
  },
  splitChipActive: {
    borderColor: COLORS.bg.accent,
    backgroundColor: COLORS.bg.secondary,
  },
  checkbox: {
    width: 20,
    height: 20,
    borderRadius: 4,
    borderWidth: 2,
    borderColor: COLORS.text.tertiary,
    alignItems: 'center',
    justifyContent: 'center',
  },
  checkboxInner: {
    width: 12,
    height: 12,
    borderRadius: 2,
    backgroundColor: COLORS.bg.accent,
  },
  splitChipText: {
    color: COLORS.text.secondary,
    fontSize: FONT.size.md,
    fontWeight: FONT.weight.medium,
    flex: 1,
  },
  splitChipTextActive: {
    color: COLORS.text.primary,
  },
});
