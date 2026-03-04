import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
} from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useAppStore } from '@/store/useAppStore';
import { Input } from '@/components/ui/Input';
import { Button } from '@/components/ui/Button';
import { Avatar } from '@/components/ui/Avatar';
import { COLORS, SPACING, FONT, RADIUS } from '@/utils/constants';

export default function AddMember() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  const group = useAppStore((s) => s.getGroup(id));
  const addMember = useAppStore((s) => s.addMember);

  const [name, setName] = useState('');
  const [walletAddress, setWalletAddress] = useState('');

  if (!group) {
    return (
      <View style={styles.container}>
        <Text style={styles.notFound}>Group not found</Text>
      </View>
    );
  }

  const handleAdd = () => {
    const trimmed = name.trim();
    if (!trimmed) return;
    addMember(id, trimmed, walletAddress.trim() || undefined);
    router.back();
  };

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
    >
      <ScrollView
        contentContainerStyle={styles.content}
        keyboardShouldPersistTaps="handled"
      >
        <View style={styles.preview}>
          <Avatar name={name.trim() || '?'} size={64} />
          <Text style={styles.previewName}>
            {name.trim() || 'New Member'}
          </Text>
        </View>

        <Input
          label="Name"
          placeholder="e.g. Rahul"
          value={name}
          onChangeText={setName}
          autoFocus
          maxLength={30}
          returnKeyType="next"
        />

        <Input
          label="Wallet Address (optional)"
          placeholder="Solana wallet address"
          value={walletAddress}
          onChangeText={setWalletAddress}
          autoCapitalize="none"
          autoCorrect={false}
        />

        {group.members.length > 0 && (
          <View style={styles.existingSection}>
            <Text style={styles.existingLabel}>
              Current members ({group.members.length})
            </Text>
            <View style={styles.existingList}>
              {group.members.map((member) => (
                <View key={member.id} style={styles.existingMember}>
                  <Avatar name={member.name} size={32} />
                  <Text style={styles.existingName}>{member.name}</Text>
                </View>
              ))}
            </View>
          </View>
        )}

        <Button
          title="Add Member"
          onPress={handleAdd}
          disabled={!name.trim()}
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

  preview: {
    alignItems: 'center',
    gap: SPACING.md,
  },
  previewName: {
    color: COLORS.text.primary,
    fontSize: FONT.size.xl,
    fontWeight: FONT.weight.bold,
  },

  existingSection: {
    gap: SPACING.md,
  },
  existingLabel: {
    color: COLORS.text.secondary,
    fontSize: FONT.size.sm,
    fontWeight: FONT.weight.medium,
  },
  existingList: {
    gap: SPACING.sm,
  },
  existingMember: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING.md,
    paddingVertical: SPACING.sm,
    paddingHorizontal: SPACING.md,
    backgroundColor: COLORS.bg.secondary,
    borderRadius: RADIUS.md,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.04,
    shadowRadius: 4,
    elevation: 1,
  },
  existingName: {
    color: COLORS.text.primary,
    fontSize: FONT.size.md,
    fontWeight: FONT.weight.medium,
  },
});
