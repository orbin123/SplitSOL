import React, { useMemo, useState } from 'react';
import {
  KeyboardAvoidingView,
  Modal,
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import * as Haptics from 'expo-haptics';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import Ionicons from '@expo/vector-icons/Ionicons';
import { useAppStore } from '@/store/useAppStore';
import { Button } from '@/components/ui/Button';
import { Card } from '@/components/ui/Card';
import { Avatar } from '@/components/ui/Avatar';
import { EmptyState } from '@/components/ui/EmptyState';
import { QRScanner } from '@/components/ui/QRScanner';
import { SplitSolQrPayload } from '@/utils/memberQr';
import { isValidWalletAddress } from '@/utils/memberQr';
import { COLORS, SPACING, FONT, RADIUS } from '@/utils/constants';
import { truncateAddress } from '@/utils/formatters';
import { showAlert } from '@/store/useAlertStore';

type Mode = 'list' | 'manual';

export default function AddMember() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const group = useAppStore((s) => s.getGroup(id));
  const members = useAppStore((s) => s.members);
  const addMember = useAppStore((s) => s.addMember);
  const addGroupMember = useAppStore((s) => s.addGroupMember);
  const user = useAppStore((s) => s.user);

  const [mode, setMode] = useState<Mode>('list');
  const [selectedMemberIds, setSelectedMemberIds] = useState<string[]>([]);
  const [scannerVisible, setScannerVisible] = useState(false);

  // Manual entry state
  const [manualName, setManualName] = useState('');
  const [manualWallet, setManualWallet] = useState('');

  if (!group) {
    return (
      <View style={styles.container}>
        <Text style={styles.notFound}>Group not found</Text>
      </View>
    );
  }

  const existingWallets = new Set(
    group.members
      .map((m) => m.walletAddress)
      .filter((w): w is string => Boolean(w)),
  );
  const existingMemberIds = new Set(
    group.members
      .map((m) => m.memberId)
      .filter((mid): mid is string => Boolean(mid)),
  );

  const availableMembers = useMemo(
    () =>
      [...members]
        .filter(
          (m) =>
            !existingMemberIds.has(m.id) && !existingWallets.has(m.walletAddress),
        )
        .sort((a, b) => {
          if (a.isFavorite !== b.isFavorite) return a.isFavorite ? -1 : 1;
          return a.name.localeCompare(b.name);
        }),
    [members, existingMemberIds, existingWallets],
  );

  const toggleSelectedMember = (memberId: string) => {
    setSelectedMemberIds((cur) =>
      cur.includes(memberId) ? cur.filter((x) => x !== memberId) : [...cur, memberId],
    );
  };

  const handleAddSelected = () => {
    if (selectedMemberIds.length === 0) return;
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    selectedMemberIds.forEach((memberId) => {
      const member = members.find((m) => m.id === memberId);
      if (!member) return;
      addGroupMember(id, member.name, member.walletAddress, member.id);
    });
    router.back();
  };

  // ── Manual entry ──────────────────────────────────────────────────────────
  const trimmedName = manualName.trim();
  const trimmedWallet = manualWallet.trim();

  const walletError =
    trimmedWallet && !isValidWalletAddress(trimmedWallet)
      ? 'Invalid Solana address'
      : trimmedWallet && existingWallets.has(trimmedWallet)
        ? 'Already in this group'
        : null;

  const canAddManual = trimmedName.length > 0 && !walletError;

  const handleAddManual = () => {
    if (!canAddManual) return;
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    const wallet = trimmedWallet || null;
    const memberId = addMember({ name: trimmedName, walletAddress: wallet ?? '', isFavorite: false });
    addGroupMember(id, trimmedName, wallet ?? undefined, memberId);
    setManualName('');
    setManualWallet('');
    setMode('list');
    showAlert('Member Added', `${trimmedName} was added to the group.`, [
      { text: 'OK', onPress: () => router.back() },
    ]);
  };

  // ── QR scan ───────────────────────────────────────────────────────────────
  const handleScanMember = (payload: SplitSolQrPayload) => {
    if (payload.type !== 'member') {
      showAlert('Invalid QR Code', 'Please scan a valid SplitSOL member code.');
      return false;
    }
    if (payload.wallet === user.walletAddress) {
      showAlert("Can't add yourself", 'You are already in this group.');
      return false;
    }
    if (existingWallets.has(payload.wallet)) {
      showAlert('Already in group', `${payload.name} is already a member.`);
      return false;
    }

    const existing = members.find((m) => m.walletAddress === payload.wallet);
    const memberId =
      existing?.id ??
      addMember({ name: payload.name, walletAddress: payload.wallet, isFavorite: false });

    addGroupMember(id, payload.name, payload.wallet, memberId);
    setScannerVisible(false);
    showAlert('Member Added', `${payload.name} was added to the group.`, [
      { text: 'OK', onPress: () => router.back() },
    ]);
    return true;
  };

  return (
    <>
      <KeyboardAvoidingView
        style={{ flex: 1 }}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      >
        <View style={[styles.container, { paddingTop: insets.top }]}>
          {/* Header */}
          <View style={styles.header}>
            <TouchableOpacity
              onPress={() => (mode === 'manual' ? setMode('list') : router.back())}
              style={styles.backBtn}
              activeOpacity={0.7}
            >
              <Ionicons name="chevron-back" size={24} color={COLORS.text.primary} />
            </TouchableOpacity>
            <Text style={styles.headerTitle}>
              {mode === 'manual' ? 'Add Manually' : 'Add Member'}
            </Text>
            <View style={styles.headerSpacer} />
          </View>

          {/* Mode tabs */}
          <View style={styles.modeTabs}>
            <TouchableOpacity
              style={[styles.modeTab, mode === 'list' && styles.modeTabActive]}
              onPress={() => setMode('list')}
              activeOpacity={0.7}
            >
              <Ionicons
                name="people-outline"
                size={16}
                color={mode === 'list' ? COLORS.bg.accent : COLORS.text.secondary}
              />
              <Text
                style={[styles.modeTabText, mode === 'list' && styles.modeTabTextActive]}
              >
                Scan / Contacts
              </Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.modeTab, mode === 'manual' && styles.modeTabActive]}
              onPress={() => setMode('manual')}
              activeOpacity={0.7}
            >
              <Ionicons
                name="pencil-outline"
                size={16}
                color={mode === 'manual' ? COLORS.bg.accent : COLORS.text.secondary}
              />
              <Text
                style={[styles.modeTabText, mode === 'manual' && styles.modeTabTextActive]}
              >
                Add Manually
              </Text>
            </TouchableOpacity>
          </View>

          <ScrollView
            contentContainerStyle={styles.content}
            keyboardShouldPersistTaps="handled"
            showsVerticalScrollIndicator={false}
          >
            {mode === 'manual' ? (
              /* ── Manual entry form ──────────────────────────────────── */
              <Card style={styles.formCard}>
                <Text style={styles.cardTitle}>Add Member Manually</Text>
                <Text style={styles.cardSub}>
                  Name is required. Wallet address is optional — they can add it later.
                </Text>

                <Text style={styles.fieldLabel}>Display Name *</Text>
                <TextInput
                  style={styles.textInput}
                  placeholder="e.g. Alice"
                  placeholderTextColor={COLORS.text.tertiary}
                  value={manualName}
                  onChangeText={setManualName}
                  autoCapitalize="words"
                  autoCorrect={false}
                  maxLength={20}
                  returnKeyType="next"
                />

                <Text style={styles.fieldLabel}>Wallet Address (optional)</Text>
                <TextInput
                  style={[styles.textInput, walletError ? styles.textInputError : null]}
                  placeholder="Solana public key"
                  placeholderTextColor={COLORS.text.tertiary}
                  value={manualWallet}
                  onChangeText={setManualWallet}
                  autoCapitalize="none"
                  autoCorrect={false}
                  returnKeyType="done"
                  onSubmitEditing={handleAddManual}
                />
                {walletError && (
                  <Text style={styles.fieldError}>{walletError}</Text>
                )}

                <Button
                  title="Add to Group"
                  onPress={handleAddManual}
                  disabled={!canAddManual}
                  size="lg"
                  style={styles.addBtn}
                />
              </Card>
            ) : (
              /* ── Scan + contacts list ───────────────────────────────── */
              <>
                <Card style={styles.formCard}>
                  <Text style={styles.cardTitle}>Add Members</Text>
                  <Text style={styles.cardSub}>
                    Scan a SplitSOL QR code or pick from your contacts.
                  </Text>

                  <Text style={styles.sectionTitle}>Current Members</Text>
                  <Text style={styles.sectionSub}>
                    {group.members.length} already in this group
                  </Text>
                  <View style={styles.existingList}>
                    {group.members.map((member) => (
                      <View key={member.id} style={styles.existingMember}>
                        <Avatar name={member.name} size={36} />
                        <View style={styles.memberCopy}>
                          <Text style={styles.existingName}>{member.name}</Text>
                          <Text style={styles.existingMeta}>
                            {member.isCurrentUser
                              ? 'You'
                              : member.walletAddress
                                ? truncateAddress(member.walletAddress, 4)
                                : 'No wallet'}
                          </Text>
                        </View>
                      </View>
                    ))}
                  </View>

                  <Button
                    title="Scan QR Code"
                    onPress={() => setScannerVisible(true)}
                    variant="secondary"
                    size="md"
                    icon={
                      <Ionicons
                        name="qr-code-outline"
                        size={20}
                        color={COLORS.bg.accent}
                      />
                    }
                    style={styles.scanBtn}
                  />
                </Card>

                {availableMembers.length > 0 ? (
                  <>
                    <Text style={styles.recentsTitle}>Your Contacts</Text>
                    <Text style={styles.recentsSub}>Favorites pinned to the top</Text>
                    <View style={styles.memberList}>
                      {availableMembers.map((member) => {
                        const isSelected = selectedMemberIds.includes(member.id);
                        return (
                          <TouchableOpacity
                            key={member.id}
                            style={[
                              styles.memberRow,
                              isSelected && styles.memberRowSelected,
                            ]}
                            activeOpacity={0.75}
                            onPress={() => toggleSelectedMember(member.id)}
                          >
                            <Avatar name={member.name} size={44} />
                            <View style={styles.memberCopy}>
                              <View style={styles.memberNameRow}>
                                <Text style={styles.existingName}>{member.name}</Text>
                                {member.isFavorite && (
                                  <Text style={styles.favoriteBadge}>Favorite</Text>
                                )}
                              </View>
                              {member.walletAddress ? (
                                <View style={styles.walletRow}>
                                  <View style={styles.walletDot} />
                                  <Text style={styles.existingMeta}>
                                    {truncateAddress(member.walletAddress, 4)}
                                  </Text>
                                </View>
                              ) : (
                                <Text style={styles.existingMeta}>No wallet</Text>
                              )}
                            </View>
                            <View
                              style={[
                                styles.checkbox,
                                isSelected && styles.checkboxSelected,
                              ]}
                            >
                              {isSelected && (
                                <Ionicons name="checkmark" size={14} color="#FFFFFF" />
                              )}
                            </View>
                          </TouchableOpacity>
                        );
                      })}
                    </View>
                  </>
                ) : (
                  <Card style={styles.emptyCard}>
                    <EmptyState
                      emoji="➕"
                      title="No contacts available"
                      subtitle="Scan a QR code to add someone new, or switch to Add Manually."
                    />
                  </Card>
                )}

                {selectedMemberIds.length > 0 && (
                  <Button
                    title={`Add ${selectedMemberIds.length} Member${selectedMemberIds.length === 1 ? '' : 's'}`}
                    onPress={handleAddSelected}
                    size="lg"
                    style={styles.addBtn}
                  />
                )}
              </>
            )}
          </ScrollView>
        </View>
      </KeyboardAvoidingView>

      <Modal visible={scannerVisible} animationType="slide" presentationStyle="fullScreen">
        <QRScanner
          onScan={handleScanMember}
          onClose={() => setScannerVisible(false)}
          hint="Scan a SplitSOL member QR code"
        />
      </Modal>
    </>
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

  // Mode tabs
  modeTabs: {
    flexDirection: 'row',
    marginHorizontal: SPACING.xxl,
    marginBottom: SPACING.lg,
    backgroundColor: COLORS.bg.tertiary,
    borderRadius: RADIUS.lg,
    padding: 4,
    gap: 4,
  },
  modeTab: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    paddingVertical: 10,
    borderRadius: RADIUS.md,
  },
  modeTabActive: {
    backgroundColor: '#FFFFFF',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.06,
    shadowRadius: 4,
    elevation: 2,
  },
  modeTabText: {
    color: COLORS.text.secondary,
    fontSize: FONT.size.sm,
    fontWeight: FONT.weight.semibold,
  },
  modeTabTextActive: {
    color: COLORS.bg.accent,
  },

  content: {
    padding: SPACING.xxl,
    paddingBottom: SPACING.xxxl,
    gap: SPACING.xl,
  },
  formCard: {
    padding: SPACING.xxl,
    gap: SPACING.md,
  },
  cardTitle: {
    color: COLORS.text.primary,
    fontSize: FONT.size.xl,
    fontWeight: FONT.weight.bold,
  },
  cardSub: {
    color: COLORS.text.secondary,
    fontSize: FONT.size.sm,
    lineHeight: 20,
  },
  sectionTitle: {
    color: COLORS.text.primary,
    fontSize: FONT.size.lg,
    fontWeight: FONT.weight.bold,
    marginTop: SPACING.sm,
  },
  sectionSub: {
    color: COLORS.text.secondary,
    fontSize: FONT.size.sm,
    marginTop: 2,
  },
  existingList: {
    gap: SPACING.sm,
  },
  existingMember: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING.md,
    paddingVertical: SPACING.sm,
  },
  memberCopy: {
    flex: 1,
  },
  existingName: {
    color: COLORS.text.primary,
    fontSize: FONT.size.md,
    fontWeight: FONT.weight.medium,
  },
  existingMeta: {
    color: COLORS.text.secondary,
    fontSize: FONT.size.sm,
    marginTop: 2,
  },
  walletRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    marginTop: 2,
  },
  walletDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: COLORS.bg.success,
  },
  scanBtn: {
    alignSelf: 'stretch',
    marginTop: SPACING.sm,
  },
  recentsTitle: {
    color: COLORS.text.primary,
    fontSize: FONT.size.lg,
    fontWeight: FONT.weight.bold,
  },
  recentsSub: {
    color: COLORS.text.secondary,
    fontSize: FONT.size.sm,
    marginTop: 2,
    marginBottom: SPACING.sm,
  },
  memberList: {
    gap: SPACING.sm,
  },
  memberRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING.md,
    padding: SPACING.lg,
    borderRadius: RADIUS.lg,
    backgroundColor: 'rgba(255, 255, 255, 0.85)',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.6)',
  },
  memberRowSelected: {
    borderColor: COLORS.bg.accent,
    backgroundColor: COLORS.bg.accentSoft,
  },
  memberNameRow: {
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
    backgroundColor: 'rgba(255, 255, 255, 0.5)',
  },
  checkboxSelected: {
    backgroundColor: COLORS.bg.accent,
    borderColor: COLORS.bg.accent,
  },
  emptyCard: {
    minHeight: 200,
    justifyContent: 'center',
  },

  // Manual form
  fieldLabel: {
    color: COLORS.text.primary,
    fontSize: FONT.size.sm,
    fontWeight: FONT.weight.semibold,
    marginTop: SPACING.sm,
    marginBottom: 6,
  },
  textInput: {
    backgroundColor: COLORS.bg.tertiary,
    borderWidth: 1,
    borderColor: COLORS.border.default,
    borderRadius: RADIUS.md,
    paddingHorizontal: SPACING.lg,
    paddingVertical: 14,
    fontSize: FONT.size.md,
    color: COLORS.text.primary,
  },
  textInputError: {
    borderColor: COLORS.bg.danger,
  },
  fieldError: {
    color: COLORS.bg.danger,
    fontSize: FONT.size.xs,
    marginTop: 4,
  },

  addBtn: {
    marginTop: SPACING.sm,
  },
});
