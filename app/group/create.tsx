import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import { useRouter } from 'expo-router';
import { useAppStore } from '@/store/useAppStore';
import { Input } from '@/components/ui/Input';
import { Button } from '@/components/ui/Button';
import { COLORS, SPACING, FONT, RADIUS } from '@/utils/constants';

const EMOJI_OPTIONS = [
  '🍕', '🏠', '✈️', '🎉', '🎮', '🛒',
  '🍻', '⛽', '🎬', '💼', '🏖️', '❤️',
];

export default function CreateGroup() {
  const router = useRouter();
  const createGroup = useAppStore((s) => s.createGroup);
  const [name, setName] = useState('');
  const [emoji, setEmoji] = useState('🍕');

  const handleCreate = () => {
    const trimmed = name.trim();
    if (!trimmed) return;
    const groupId = createGroup(trimmed, emoji);
    router.back();
    router.push(`/group/${groupId}`);
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
        <View style={styles.previewCard}>
          <Text style={styles.previewEmoji}>{emoji}</Text>
          <Text style={styles.previewName}>
            {name.trim() || 'Group Name'}
          </Text>
        </View>

        <Input
          label="Group Name"
          placeholder="e.g. Goa Trip, Roommates"
          value={name}
          onChangeText={setName}
          autoFocus
          maxLength={40}
          returnKeyType="done"
          onSubmitEditing={handleCreate}
        />

        <View style={styles.emojiSection}>
          <Text style={styles.emojiLabel}>Pick an icon</Text>
          <View style={styles.emojiGrid}>
            {EMOJI_OPTIONS.map((e) => (
              <TouchableOpacity
                key={e}
                style={[
                  styles.emojiButton,
                  emoji === e && styles.emojiSelected,
                ]}
                onPress={() => setEmoji(e)}
                activeOpacity={0.7}
              >
                <Text style={styles.emojiText}>{e}</Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>

        <Button
          title="Create Group"
          onPress={handleCreate}
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
  content: {
    padding: SPACING.xxl,
    gap: SPACING.xxl,
  },
  previewCard: {
    alignItems: 'center',
    backgroundColor: COLORS.bg.secondary,
    borderRadius: RADIUS.xl,
    paddingVertical: SPACING.xxxl,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06,
    shadowRadius: 8,
    elevation: 3,
  },
  previewEmoji: {
    fontSize: 48,
    marginBottom: SPACING.md,
  },
  previewName: {
    color: COLORS.text.primary,
    fontSize: FONT.size.xl,
    fontWeight: FONT.weight.bold,
  },
  emojiSection: {
    gap: SPACING.md,
  },
  emojiLabel: {
    color: COLORS.text.secondary,
    fontSize: FONT.size.sm,
    fontWeight: FONT.weight.medium,
  },
  emojiGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: SPACING.sm,
  },
  emojiButton: {
    width: 48,
    height: 48,
    borderRadius: RADIUS.md,
    backgroundColor: COLORS.bg.tertiary,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 2,
    borderColor: 'transparent',
  },
  emojiSelected: {
    borderColor: COLORS.bg.accent,
    backgroundColor: COLORS.bg.accentSoft,
  },
  emojiText: {
    fontSize: 24,
  },
});
