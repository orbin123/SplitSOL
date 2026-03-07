import React, { useMemo, useState } from 'react';
import {
  Alert,
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  KeyboardAvoidingView,
  Platform,
  Modal,
} from 'react-native';
import { useRouter } from 'expo-router';
import * as Haptics from 'expo-haptics';
import { useAppStore } from '@/store/useAppStore';
import { Input } from '@/components/ui/Input';
import { Button } from '@/components/ui/Button';
import { Card } from '@/components/ui/Card';
import { Avatar } from '@/components/ui/Avatar';
import { EmptyState } from '@/components/ui/EmptyState';
import { QRScanner } from '@/components/wallet/QRScanner';
import { parseContactQrPayload } from '@/utils/contactQr';
import { COLORS, SPACING, FONT, RADIUS } from '@/utils/constants';

const EMOJI_OPTIONS = [
  '🍕', '🏠', '✈️', '🎉', '🎮', '🛒',
  '🍻', '⛽', '🎬', '💼', '🏖️', '❤️',
];

export default function CreateGroup() {
  const router = useRouter();
  const user = useAppStore((s) => s.user);
  const contacts = useAppStore((s) => s.contacts);
  const addContact = useAppStore((s) => s.addContact);
  const createGroup = useAppStore((s) => s.createGroup);
  const [name, setName] = useState('');
  const [emoji, setEmoji] = useState('🍕');
  const [selectedContactIds, setSelectedContactIds] = useState<string[]>([]);
  const [scannerVisible, setScannerVisible] = useState(false);

  const sortedContacts = useMemo(() => {
    return [...contacts].sort((a, b) => {
      if (a.isFavorite !== b.isFavorite) {
        return a.isFavorite ? -1 : 1;
      }

      return a.name.localeCompare(b.name);
    });
  }, [contacts]);

  const handleCreate = () => {
    const trimmed = name.trim();
    if (!trimmed) return;
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    const groupId = createGroup(trimmed, emoji, selectedContactIds);
    router.back();
    router.push(`/group/${groupId}`);
  };

  const toggleSelectedContact = (contactId: string) => {
    setSelectedContactIds((current) =>
      current.includes(contactId)
        ? current.filter((id) => id !== contactId)
        : [...current, contactId],
    );
  };

  const handleScanContact = (data: string) => {
    const payload = parseContactQrPayload(data);

    if (!payload) {
      Alert.alert(
        'Invalid QR Code',
        'This QR code is not a valid SplitSOL contact.',
      );
      return false;
    }

    if (payload.wallet === user.walletAddress) {
      Alert.alert('This is your QR code', 'You are already included in the group.');
      return false;
    }

    const existingContact = contacts.find(
      (contact) => contact.walletAddress === payload.wallet,
    );

    const contactId =
      existingContact?.id ??
      addContact({
        name: payload.name,
        walletAddress: payload.wallet,
        isFavorite: false,
      });

    setSelectedContactIds((current) =>
      current.includes(contactId) ? current : [...current, contactId],
    );
    setScannerVisible(false);
    Alert.alert(
      existingContact ? 'Contact selected' : 'Contact added',
      `${payload.name} will be included in this group.`,
    );
    return true;
  };

  return (
    <>
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
            <Text style={styles.previewMeta}>
              {1 + selectedContactIds.length} member
              {selectedContactIds.length === 0 ? '' : 's'} total
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

          <View style={styles.memberSection}>
            <View style={styles.sectionHeader}>
              <View>
                <Text style={styles.sectionTitle}>Add Members</Text>
                <Text style={styles.sectionSub}>
                  Pick contacts or scan someone new.
                </Text>
              </View>
              <Button
                title="Scan QR"
                onPress={() => setScannerVisible(true)}
                variant="secondary"
                size="sm"
              />
            </View>

            <Card style={styles.currentUserCard}>
              <Avatar name={user.name || 'Me'} size={44} />
              <View style={styles.memberCopy}>
                <Text style={styles.memberName}>{user.name || 'You'}</Text>
                <Text style={styles.memberMeta}>You • always included</Text>
              </View>
              <View style={styles.lockBadge}>
                <Text style={styles.lockBadgeText}>Locked</Text>
              </View>
            </Card>

            {sortedContacts.length === 0 ? (
              <Card style={styles.emptyContactsCard}>
                <EmptyState
                  emoji="👥"
                  title="No contacts yet"
                  subtitle="Scan a SplitSOL QR code to add contacts and include them in this group."
                  action={
                    <Button
                      title="Scan First Contact"
                      onPress={() => setScannerVisible(true)}
                    />
                  }
                />
              </Card>
            ) : (
              sortedContacts.map((contact) => {
                const isSelected = selectedContactIds.includes(contact.id);

                return (
                  <TouchableOpacity
                    key={contact.id}
                    style={[
                      styles.contactRow,
                      isSelected && styles.contactRowSelected,
                    ]}
                    activeOpacity={0.75}
                    onPress={() => toggleSelectedContact(contact.id)}
                  >
                    <Avatar name={contact.name} size={44} />
                    <View style={styles.memberCopy}>
                      <View style={styles.contactNameRow}>
                        <Text style={styles.memberName}>{contact.name}</Text>
                        {contact.isFavorite && (
                          <Text style={styles.favoriteBadge}>Favorite</Text>
                        )}
                      </View>
                      <Text style={styles.memberMeta}>{contact.walletAddress}</Text>
                    </View>
                    <View
                      style={[
                        styles.checkbox,
                        isSelected && styles.checkboxSelected,
                      ]}
                    >
                      {isSelected && <Text style={styles.checkboxTick}>✓</Text>}
                    </View>
                  </TouchableOpacity>
                );
              })
            )}
          </View>

          <Button
            title="Create Group"
            onPress={handleCreate}
            disabled={!name.trim()}
            size="lg"
          />
        </ScrollView>
      </KeyboardAvoidingView>

      <Modal
        visible={scannerVisible}
        animationType="slide"
        presentationStyle="fullScreen"
      >
        <QRScanner
          onScan={handleScanContact}
          onClose={() => setScannerVisible(false)}
          hint="Scan a SplitSOL contact to add them to this group"
        />
      </Modal>
    </>
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
  previewMeta: {
    color: COLORS.text.secondary,
    fontSize: FONT.size.sm,
    marginTop: SPACING.xs,
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
  memberSection: {
    gap: SPACING.md,
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    gap: SPACING.md,
  },
  sectionTitle: {
    color: COLORS.text.primary,
    fontSize: FONT.size.lg,
    fontWeight: FONT.weight.bold,
  },
  sectionSub: {
    color: COLORS.text.secondary,
    fontSize: FONT.size.sm,
    marginTop: 2,
  },
  currentUserCard: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING.md,
  },
  memberCopy: {
    flex: 1,
  },
  memberName: {
    color: COLORS.text.primary,
    fontSize: FONT.size.md,
    fontWeight: FONT.weight.semibold,
  },
  memberMeta: {
    color: COLORS.text.secondary,
    fontSize: FONT.size.sm,
    marginTop: 2,
  },
  lockBadge: {
    backgroundColor: COLORS.bg.tertiary,
    borderRadius: RADIUS.full,
    paddingHorizontal: SPACING.md,
    paddingVertical: SPACING.xs,
  },
  lockBadgeText: {
    color: COLORS.text.secondary,
    fontSize: FONT.size.xs,
    fontWeight: FONT.weight.semibold,
  },
  emptyContactsCard: {
    minHeight: 240,
    justifyContent: 'center',
  },
  contactRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING.md,
    backgroundColor: COLORS.bg.secondary,
    borderRadius: RADIUS.lg,
    padding: SPACING.lg,
    borderWidth: 1.5,
    borderColor: 'transparent',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06,
    shadowRadius: 8,
    elevation: 3,
  },
  contactRowSelected: {
    borderColor: COLORS.bg.accent,
    backgroundColor: COLORS.bg.accentSoft,
  },
  contactNameRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING.sm,
  },
  favoriteBadge: {
    color: COLORS.text.accent,
    fontSize: FONT.size.xs,
    fontWeight: FONT.weight.semibold,
  },
  checkbox: {
    width: 24,
    height: 24,
    borderRadius: 12,
    borderWidth: 2,
    borderColor: COLORS.border.default,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: COLORS.bg.secondary,
  },
  checkboxSelected: {
    backgroundColor: COLORS.bg.accent,
    borderColor: COLORS.bg.accent,
  },
  checkboxTick: {
    color: COLORS.text.white,
    fontSize: FONT.size.sm,
    fontWeight: FONT.weight.bold,
  },
});
