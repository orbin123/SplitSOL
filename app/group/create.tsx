import React, { useMemo, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  KeyboardAvoidingView,
  Platform,
  Modal,
  FlatList,
  TextInput,
} from 'react-native';
import { useRouter } from 'expo-router';
import { BlurView } from 'expo-blur';
import * as Haptics from 'expo-haptics';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import Ionicons from '@expo/vector-icons/Ionicons';
import { useAppStore } from '@/store/useAppStore';
import { showAlert } from '@/store/useAlertStore';
import { Input } from '@/components/ui/Input';
import { Button } from '@/components/ui/Button';
import { Avatar } from '@/components/ui/Avatar';
import { Badge } from '@/components/ui/Badge';
import { EmptyState } from '@/components/ui/EmptyState';
import { QRScanner } from '@/components/ui/QRScanner';
import { SplitSolQrPayload, isValidWalletAddress } from '@/utils/memberQr';
import { COLORS, SPACING, FONT, RADIUS } from '@/utils/constants';
import { Member } from '@/types';

const EMOJI_OPTIONS = [
  '🏠', '✈️', '🍽️', '🎮', '🏋️', '🎵', '💼', '🎉'
];

export default function CreateGroup() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const user = useAppStore((s) => s.user);
  const members = useAppStore((s) => s.members);
  const addMember = useAppStore((s) => s.addMember);
  const createGroup = useAppStore((s) => s.createGroup);
  const [name, setName] = useState('');
  const [emoji, setEmoji] = useState('🍕');
  const [selectedMemberIds, setSelectedMemberIds] = useState<string[]>([]);
  const [scannerVisible, setScannerVisible] = useState(false);
  const [showMemberPicker, setShowMemberPicker] = useState(false);
  const [pickerSelection, setPickerSelection] = useState<string[]>([]);
  const [showManualModal, setShowManualModal] = useState(false);
  const [manualName, setManualName] = useState('');
  const [manualWallet, setManualWallet] = useState('');

  const availableMembers = useMemo(() => {
    return [...members]
      .filter((m) => !selectedMemberIds.includes(m.id))
      .sort((a, b) => {
        if (a.isFavorite !== b.isFavorite) return a.isFavorite ? -1 : 1;
        return a.name.localeCompare(b.name);
      });
  }, [members, selectedMemberIds]);

  const openMemberPicker = () => {
    setPickerSelection([]);
    setShowMemberPicker(true);
  };

  const togglePickerMember = (memberId: string) => {
    setPickerSelection((current) =>
      current.includes(memberId)
        ? current.filter((id) => id !== memberId)
        : [...current, memberId],
    );
  };

  const confirmPickerSelection = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    setSelectedMemberIds((current) => [
      ...current,
      ...pickerSelection.filter((id) => !current.includes(id)),
    ]);
    setShowMemberPicker(false);
    setPickerSelection([]);
  };

  const sortedMembers = useMemo(() => {
    return [...members].sort((a, b) => {
      if (a.isFavorite !== b.isFavorite) {
        return a.isFavorite ? -1 : 1;
      }

      return a.name.localeCompare(b.name);
    });
  }, [members]);

  const manualWalletError =
    manualWallet.trim() && !isValidWalletAddress(manualWallet.trim())
      ? 'Invalid Solana address'
      : null;
  const canAddManual = manualName.trim().length > 0 && !manualWalletError;

  const handleAddManual = () => {
    if (!canAddManual) return;
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    const wallet = manualWallet.trim() || null;
    const memberId = addMember({
      name: manualName.trim(),
      walletAddress: wallet,
      isFavorite: false,
    });
    setSelectedMemberIds((cur) =>
      cur.includes(memberId) ? cur : [...cur, memberId],
    );
    setManualName('');
    setManualWallet('');
    setShowManualModal(false);
  };

  const handleCreate = () => {
    const trimmed = name.trim();
    if (!trimmed) return;
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    const groupId = createGroup(trimmed, emoji, selectedMemberIds);
    router.replace(`/group/${groupId}`);
  };

  const toggleSelectedMember = (memberId: string) => {
    setSelectedMemberIds((current) =>
      current.includes(memberId)
        ? current.filter((id) => id !== memberId)
        : [...current, memberId],
    );
  };

  const removeMember = (memberId: string) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    setSelectedMemberIds((current) => current.filter((id) => id !== memberId));
  };

  const handleScanMember = (payload: SplitSolQrPayload) => {
    if (payload.type !== 'member') {
      showAlert('Invalid QR Code', 'Please scan a valid SplitSOL member code.');
      return false;
    }

    if (payload.wallet === user.walletAddress) {
      showAlert("Can't add yourself", 'You are already included in the group.');
      return false;
    }

    const existingMember = members.find(
      (member) => member.walletAddress === payload.wallet,
    );

    const memberId =
      existingMember?.id ??
      addMember({
        name: payload.name,
        walletAddress: payload.wallet,
        isFavorite: false,
      });

    setSelectedMemberIds((current) =>
      current.includes(memberId) ? current : [...current, memberId],
    );
    setScannerVisible(false);
    showAlert(
      existingMember ? 'Member selected' : 'Member added',
      `${payload.name} will be included in this group.`,
    );
    return true;
  };

  return (
    <>
      <BlurView intensity={15} tint="dark" style={styles.blurContainer}>
        <TouchableOpacity style={styles.flexArea} onPress={() => router.back()} activeOpacity={1} />
        <View style={[styles.modalContainer, { paddingBottom: Math.max(insets.bottom, SPACING.xl) }]}>

          {/* Drag handle pill */}
          <View style={styles.dragHandleWrap}>
            <View style={styles.dragHandle} />
          </View>

          {/* Header */}
          <View style={styles.header}>
            <Text style={styles.title}>New Group</Text>
            <TouchableOpacity
              onPress={() => router.back()}
              style={styles.closeButton}
              activeOpacity={0.7}
            >
              <Ionicons name="close" size={20} color={COLORS.text.secondary} />
            </TouchableOpacity>
          </View>

          <KeyboardAvoidingView
            style={styles.keyboardWrap}
            behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
          >
            <ScrollView
              contentContainerStyle={styles.content}
              keyboardShouldPersistTaps="handled"
              showsVerticalScrollIndicator={false}
            >
              {/* Emoji picker - horizontal ScrollView */}
              <ScrollView
                horizontal
                showsHorizontalScrollIndicator={false}
                contentContainerStyle={styles.emojiScroll}
              >
                {EMOJI_OPTIONS.map((e) => (
                  <TouchableOpacity
                    key={e}
                    style={[
                      styles.emojiCircle,
                      emoji === e && styles.emojiCircleSelected,
                    ]}
                    onPress={() => {
                      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                      setEmoji(e);
                    }}
                    activeOpacity={0.7}
                  >
                    <Text style={styles.emojiText}>{e}</Text>
                  </TouchableOpacity>
                ))}
              </ScrollView>

              <View style={styles.inputContainer}>
                <Input
                  placeholder="Enter group name"
                  value={name}
                  onChangeText={setName}
                  autoFocus
                  maxLength={40}
                  returnKeyType="done"
                  onSubmitEditing={handleCreate}
                  style={styles.nameInput}
                />
              </View>

              <Text style={styles.membersTitle}>Members</Text>

              {/* Current user row */}
              <View style={styles.memberCard}>
                <View style={[styles.avatarBox, { backgroundColor: '#EBE0FF' }]}>
                  <Text style={[styles.avatarText, { color: '#7C3AED' }]}>
                    {user.name ? user.name.charAt(0).toUpperCase() : 'A'}
                  </Text>
                </View>
                <View style={styles.memberCopy}>
                  <Text style={styles.memberName}>{user.name || 'Alex'} <Text style={styles.memberYouText}>(You)</Text></Text>
                </View>
                <View style={styles.checkmarkWrap}>
                  <View style={styles.greenCheckBg}>
                    <Ionicons name="checkmark" size={16} color="#FFFFFF" />
                  </View>
                </View>
              </View>

              {/* Added members */}
              {sortedMembers
                .filter((m) => selectedMemberIds.includes(m.id))
                .map((member) => (
                  <View key={member.id} style={styles.memberCard}>
                    <View style={[styles.avatarBox, { backgroundColor: '#FCE7F3' }]}>
                      <Text style={[styles.avatarText, { color: '#EC4899' }]}>
                        {member.name ? member.name.charAt(0).toUpperCase() : 'U'}
                      </Text>
                    </View>
                    <View style={styles.memberCopy}>
                      <Text style={styles.memberName}>{member.name}</Text>
                      {member.walletAddress && (
                        <View style={styles.walletStatus}>
                          <View style={styles.walletDot} />
                          <Text style={styles.walletText}>Wallet connected</Text>
                        </View>
                      )}
                    </View>
                    <TouchableOpacity
                      style={styles.removeIconBtn}
                      onPress={() => removeMember(member.id)}
                      activeOpacity={0.7}
                    >
                      <Ionicons name="close" size={20} color="#9CA3AF" />
                    </TouchableOpacity>
                  </View>
                ))}

              {/* Add Member row — opens existing-member picker */}
              <TouchableOpacity
                style={styles.actionCardDashed}
                onPress={openMemberPicker}
                activeOpacity={0.7}
              >
                <View style={styles.actionIconBox}>
                  <Ionicons name="people-outline" size={20} color="#9CA3AF" />
                </View>
                <Text style={styles.actionText}>Add Member</Text>
              </TouchableOpacity>

              {sortedMembers.length === 0 && selectedMemberIds.length === 0 && (
                <EmptyState
                  emoji="👥"
                  title="No members yet"
                  subtitle="Scan a SplitSOL QR code to add members and include them in this group."
                />
              )}

              <TouchableOpacity
                style={styles.actionCardSolid}
                onPress={() => setScannerVisible(true)}
                activeOpacity={0.7}
              >
                <Ionicons name="qr-code-outline" size={20} color="#6B7280" />
                <Text style={styles.actionTextBold}>Scan QR to Add</Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={styles.actionCardSolid}
                onPress={() => setShowManualModal(true)}
                activeOpacity={0.7}
              >
                <Ionicons name="pencil-outline" size={20} color="#6B7280" />
                <Text style={styles.actionTextBold}>Add Manually</Text>
              </TouchableOpacity>

              <Button
                title="Create Group"
                onPress={handleCreate}
                disabled={!name.trim()}
                size="lg"
                style={styles.createBtn}
              />
            </ScrollView>
          </KeyboardAvoidingView>
        </View>
      </BlurView>

      {/* QR Scanner Modal */}
      <Modal
        visible={scannerVisible}
        animationType="slide"
        presentationStyle="fullScreen"
      >
        <QRScanner
          onScan={handleScanMember}
          onClose={() => setScannerVisible(false)}
          hint="Scan a SplitSOL member to add them to this group"
        />
      </Modal>

      {/* Manual Add Modal */}
      <Modal
        visible={showManualModal}
        transparent
        animationType="fade"
        onRequestClose={() => setShowManualModal(false)}
      >
        <View style={manualStyles.overlay}>
          <View style={manualStyles.card}>
            <View style={manualStyles.header}>
              <Text style={manualStyles.title}>Add Member Manually</Text>
              <TouchableOpacity
                onPress={() => setShowManualModal(false)}
                style={manualStyles.closeBtn}
                activeOpacity={0.7}
              >
                <Ionicons name="close" size={20} color={COLORS.text.secondary} />
              </TouchableOpacity>
            </View>

            <Text style={manualStyles.fieldLabel}>Display Name *</Text>
            <TextInput
              style={manualStyles.input}
              placeholder="e.g. Alice"
              placeholderTextColor={COLORS.text.tertiary}
              value={manualName}
              onChangeText={setManualName}
              autoCapitalize="words"
              autoCorrect={false}
              maxLength={20}
              autoFocus
            />

            <Text style={manualStyles.fieldLabel}>Wallet Address (optional)</Text>
            <TextInput
              style={[manualStyles.input, manualWalletError ? manualStyles.inputError : null]}
              placeholder="Solana public key"
              placeholderTextColor={COLORS.text.tertiary}
              value={manualWallet}
              onChangeText={setManualWallet}
              autoCapitalize="none"
              autoCorrect={false}
            />
            {manualWalletError && (
              <Text style={manualStyles.fieldError}>{manualWalletError}</Text>
            )}

            <Button
              title="Add to Group"
              onPress={handleAddManual}
              disabled={!canAddManual}
              size="lg"
              style={manualStyles.addBtn}
            />
            <TouchableOpacity
              onPress={() => setShowManualModal(false)}
              style={manualStyles.cancelWrap}
              activeOpacity={0.7}
            >
              <Text style={manualStyles.cancelText}>Cancel</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>

      {/* Member Picker Modal */}
      <Modal
        visible={showMemberPicker}
        transparent
        animationType="fade"
        onRequestClose={() => setShowMemberPicker(false)}
      >
        <View style={pickerStyles.overlay}>
          <View style={pickerStyles.card}>
            {/* Header */}
            <View style={pickerStyles.header}>
              <Text style={pickerStyles.title}>Select Members</Text>
              <TouchableOpacity
                onPress={() => setShowMemberPicker(false)}
                style={pickerStyles.closeBtn}
                activeOpacity={0.7}
              >
                <Ionicons name="close" size={20} color={COLORS.text.secondary} />
              </TouchableOpacity>
            </View>
            <Text style={pickerStyles.subtitle}>
              Choose from your existing members
            </Text>

            {availableMembers.length === 0 ? (
              <View style={pickerStyles.emptyWrap}>
                <EmptyState
                  emoji="👥"
                  title="No available members"
                  subtitle={members.length === 0
                    ? 'Scan a QR code to add your first member.'
                    : 'All your members are already selected.'}
                />
              </View>
            ) : (
              <FlatList
                data={availableMembers}
                keyExtractor={(item) => item.id}
                style={pickerStyles.list}
                contentContainerStyle={pickerStyles.listContent}
                showsVerticalScrollIndicator={false}
                ItemSeparatorComponent={() => <View style={{ height: 8 }} />}
                renderItem={({ item }: { item: Member }) => {
                  const isSelected = pickerSelection.includes(item.id);
                  return (
                    <TouchableOpacity
                      style={[
                        pickerStyles.memberRow,
                        isSelected && pickerStyles.memberRowSelected,
                      ]}
                      activeOpacity={0.75}
                      onPress={() => togglePickerMember(item.id)}
                    >
                      <Avatar name={item.name} size={44} />
                      <View style={pickerStyles.memberInfo}>
                        <View style={pickerStyles.memberNameRow}>
                          <Text style={pickerStyles.memberName}>{item.name}</Text>
                          {item.isFavorite && (
                            <Text style={pickerStyles.favBadge}>Favorite</Text>
                          )}
                        </View>
                        {item.walletAddress && (
                          <View style={pickerStyles.walletRow}>
                            <View style={pickerStyles.walletDot} />
                            <Text style={pickerStyles.walletLabel}>Wallet connected</Text>
                          </View>
                        )}
                      </View>
                      <View
                        style={[
                          pickerStyles.checkbox,
                          isSelected && pickerStyles.checkboxSelected,
                        ]}
                      >
                        {isSelected && (
                          <Ionicons name="checkmark" size={14} color="#FFFFFF" />
                        )}
                      </View>
                    </TouchableOpacity>
                  );
                }}
              />
            )}

            {/* Bottom actions */}
            <View style={pickerStyles.actions}>
              <Button
                title={
                  pickerSelection.length > 0
                    ? `Add ${pickerSelection.length} Member${pickerSelection.length === 1 ? '' : 's'}`
                    : 'Select Members'
                }
                onPress={confirmPickerSelection}
                disabled={pickerSelection.length === 0}
                size="lg"
                style={pickerStyles.confirmBtn}
              />
              <TouchableOpacity
                onPress={() => setShowMemberPicker(false)}
                activeOpacity={0.7}
                style={pickerStyles.cancelWrap}
              >
                <Text style={pickerStyles.cancelText}>Cancel</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </>
  );
}

const styles = StyleSheet.create({
  blurContainer: {
    flex: 1,
    justifyContent: 'flex-end',
  },
  flexArea: {
    flex: 1,
  },
  modalContainer: {
    height: '85%',
    backgroundColor: '#FFFFFF',
    borderTopLeftRadius: 32,
    borderTopRightRadius: 32,
    overflow: 'hidden',
  },
  dragHandleWrap: {
    alignItems: 'center',
    paddingTop: SPACING.md,
    paddingBottom: SPACING.xs,
  },
  dragHandle: {
    width: 48,
    height: 6,
    borderRadius: 3,
    backgroundColor: '#E5E7EB',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingTop: SPACING.sm,
    marginBottom: SPACING.xl,
    position: 'relative',
    paddingHorizontal: SPACING.xl,
  },
  title: {
    fontSize: 22,
    fontWeight: '800',
    color: '#111827',
  },
  closeButton: {
    position: 'absolute',
    right: SPACING.xl,
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: '#F3F4F6',
    alignItems: 'center',
    justifyContent: 'center',
  },
  keyboardWrap: {
    flex: 1,
  },
  content: {
    paddingHorizontal: SPACING.xxl,
    paddingBottom: SPACING.xxxl,
    gap: SPACING.xl,
  },
  emojiScroll: {
    flexDirection: 'row',
    gap: SPACING.md,
    paddingVertical: SPACING.sm,
  },
  emojiCircle: {
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: '#F9FAFB',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 2,
    borderColor: 'transparent',
  },
  emojiCircleSelected: {
    borderColor: '#7C3AED',
    backgroundColor: '#FFFFFF',
    shadowColor: '#7C3AED',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 8,
    elevation: 4,
  },
  emojiText: {
    fontSize: 28,
  },
  inputContainer: {
    marginTop: SPACING.xs,
  },
  nameInput: {
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#E5E7EB',
    borderRadius: 16,
    paddingHorizontal: 20,
    paddingVertical: 16,
    fontSize: 16,
    fontWeight: '500',
  },
  membersTitle: {
    fontSize: 16,
    fontWeight: '800',
    color: '#111827',
    marginTop: SPACING.md,
  },
  memberCard: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#F3F4F6',
    borderRadius: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.03,
    shadowRadius: 8,
    elevation: 2,
  },
  avatarBox: {
    width: 44,
    height: 44,
    borderRadius: 22,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 16,
  },
  avatarText: {
    fontSize: 18,
    fontWeight: 'bold',
  },
  memberCopy: {
    flex: 1,
  },
  memberName: {
    color: '#111827',
    fontSize: 16,
    fontWeight: '700',
  },
  memberYouText: {
    color: '#6B7280',
    fontWeight: '500',
  },
  walletStatus: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 4,
  },
  walletDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: '#10B981',
    marginRight: 6,
  },
  walletText: {
    fontSize: 12,
    color: '#6B7280',
    fontWeight: '500',
  },
  checkmarkWrap: {
    paddingLeft: 8,
  },
  greenCheckBg: {
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: '#10B981',
    alignItems: 'center',
    justifyContent: 'center',
  },
  removeIconBtn: {
    padding: 8,
  },
  actionCardDashed: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#E5E7EB',
    borderStyle: 'dashed',
    borderRadius: 20,
    marginTop: 4,
  },
  actionIconBox: {
    width: 32,
    height: 32,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: '#E5E7EB',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 16,
  },
  actionText: {
    color: '#6B7280',
    fontSize: 16,
    fontWeight: '600',
  },
  actionCardSolid: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 18,
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#E5E7EB',
    borderRadius: 20,
    marginTop: 8,
    gap: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.03,
    shadowRadius: 8,
    elevation: 2,
  },
  actionTextBold: {
    color: '#374151',
    fontSize: 16,
    fontWeight: '700',
  },
  createBtn: {
    width: '100%',
    marginTop: SPACING.xl,
  },
});

/* ── Member Picker Modal Styles ── */
const pickerStyles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.45)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: SPACING.xl,
  },
  card: {
    backgroundColor: COLORS.bg.secondary,
    borderRadius: RADIUS.xxl,
    padding: SPACING.xxl,
    width: '100%',
    maxHeight: '80%',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    position: 'relative',
    marginBottom: SPACING.xs,
  },
  title: {
    fontSize: FONT.size.xl,
    fontWeight: FONT.weight.bold,
    color: COLORS.text.primary,
  },
  closeBtn: {
    position: 'absolute',
    right: 0,
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: COLORS.bg.tertiary,
    alignItems: 'center',
    justifyContent: 'center',
  },
  subtitle: {
    color: COLORS.text.secondary,
    fontSize: FONT.size.sm,
    textAlign: 'center',
    marginBottom: SPACING.lg,
  },
  emptyWrap: {
    paddingVertical: SPACING.xxxl,
  },
  list: {
    flexGrow: 0,
    maxHeight: 340,
  },
  listContent: {
    paddingBottom: SPACING.sm,
  },
  memberRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING.md,
    padding: SPACING.lg,
    borderRadius: RADIUS.lg,
    backgroundColor: COLORS.bg.tertiary,
    borderWidth: 1,
    borderColor: 'transparent',
  },
  memberRowSelected: {
    borderColor: COLORS.bg.accent,
    backgroundColor: COLORS.bg.accentSoft,
  },
  memberInfo: {
    flex: 1,
  },
  memberNameRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING.sm,
  },
  memberName: {
    color: COLORS.text.primary,
    fontSize: FONT.size.md,
    fontWeight: FONT.weight.semibold,
  },
  favBadge: {
    color: COLORS.text.accent,
    fontSize: FONT.size.xs,
    fontWeight: FONT.weight.semibold,
  },
  walletRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 3,
  },
  walletDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: COLORS.bg.success,
    marginRight: 6,
  },
  walletLabel: {
    color: COLORS.text.secondary,
    fontSize: FONT.size.xs,
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
    backgroundColor: COLORS.bg.secondary,
  },
  checkboxSelected: {
    backgroundColor: COLORS.bg.accent,
    borderColor: COLORS.bg.accent,
  },
  actions: {
    marginTop: SPACING.lg,
    gap: SPACING.sm,
    alignItems: 'center',
  },
  confirmBtn: {
    width: '100%',
  },
  cancelWrap: {
    paddingVertical: SPACING.sm,
  },
  cancelText: {
    color: COLORS.text.secondary,
    fontSize: FONT.size.md,
    fontWeight: FONT.weight.medium,
  },
});

/* ── Manual Add Modal Styles ── */
const manualStyles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.45)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: SPACING.xl,
  },
  card: {
    backgroundColor: COLORS.bg.secondary,
    borderRadius: RADIUS.xxl,
    padding: SPACING.xxl,
    width: '100%',
    gap: SPACING.xs,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    position: 'relative',
    marginBottom: SPACING.md,
  },
  title: {
    fontSize: FONT.size.xl,
    fontWeight: FONT.weight.bold,
    color: COLORS.text.primary,
  },
  closeBtn: {
    position: 'absolute',
    right: 0,
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: COLORS.bg.tertiary,
    alignItems: 'center',
    justifyContent: 'center',
  },
  fieldLabel: {
    color: COLORS.text.primary,
    fontSize: FONT.size.sm,
    fontWeight: FONT.weight.semibold,
    marginTop: SPACING.sm,
    marginBottom: 6,
  },
  input: {
    backgroundColor: COLORS.bg.tertiary,
    borderWidth: 1,
    borderColor: COLORS.border.default,
    borderRadius: RADIUS.md,
    paddingHorizontal: SPACING.lg,
    paddingVertical: 14,
    fontSize: FONT.size.md,
    color: COLORS.text.primary,
  },
  inputError: {
    borderColor: COLORS.bg.danger,
  },
  fieldError: {
    color: COLORS.bg.danger,
    fontSize: FONT.size.xs,
    marginTop: 2,
  },
  addBtn: {
    marginTop: SPACING.lg,
  },
  cancelWrap: {
    alignItems: 'center',
    paddingVertical: SPACING.sm,
  },
  cancelText: {
    color: COLORS.text.secondary,
    fontSize: FONT.size.md,
    fontWeight: FONT.weight.medium,
  },
});
