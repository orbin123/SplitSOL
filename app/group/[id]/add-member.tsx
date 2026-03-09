import React, { useMemo, useState } from 'react';
import {
  Alert,
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Modal,
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
import { COLORS, SPACING, FONT, RADIUS } from '@/utils/constants';
import { showAlert } from '@/store/useAlertStore';

export default function AddMember() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const group = useAppStore((s) => s.getGroup(id));
  const members = useAppStore((s) => s.members);
  const addMember = useAppStore((s) => s.addMember);
  const addGroupMember = useAppStore((s) => s.addGroupMember);
  const user = useAppStore((s) => s.user);
  const [selectedMemberIds, setSelectedMemberIds] = useState<string[]>([]);
  const [scannerVisible, setScannerVisible] = useState(false);

  if (!group) {
    return (
      <View style={styles.container}>
        <Text style={styles.notFound}>Group not found</Text>
      </View>
    );
  }

  const existingWallets = new Set(
    group.members
      .map((member) => member.walletAddress)
      .filter((wallet): wallet is string => Boolean(wallet)),
  );
  const existingMemberIds = new Set(
    group.members
      .map((member) => member.memberId)
      .filter((memberId): memberId is string => Boolean(memberId)),
  );

  const availableMembers = useMemo(() => {
    return [...members]
      .filter(
        (member) =>
          !existingMemberIds.has(member.id) &&
          !existingWallets.has(member.walletAddress),
      )
      .sort((a, b) => {
        if (a.isFavorite !== b.isFavorite) {
          return a.isFavorite ? -1 : 1;
        }

        return a.name.localeCompare(b.name);
      });
  }, [members, existingMemberIds, existingWallets]);

  const toggleSelectedMember = (memberId: string) => {
    setSelectedMemberIds((current) =>
      current.includes(memberId)
        ? current.filter((id) => id !== memberId)
        : [...current, memberId],
    );
  };

  const handleAddSelected = () => {
    if (selectedMemberIds.length === 0) return;

    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);

    selectedMemberIds.forEach((memberId) => {
      const member = members.find((item) => item.id === memberId);
      if (!member) return;
      addGroupMember(id, member.name, member.walletAddress, member.id);
    });

    router.back();
  };

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

    addGroupMember(id, payload.name, payload.wallet, memberId);
    setScannerVisible(false);
    showAlert(
      existingMember ? 'Member added' : 'Member added',
      `${payload.name} was added to the group.`,
      [{ text: 'OK', onPress: () => router.back() }],
    );
    return true;
  };

  return (
    <>
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
          <Text style={styles.headerTitle}>Add Member</Text>
          <View style={styles.headerSpacer} />
        </View>

        <ScrollView
          contentContainerStyle={styles.content}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
        >
          <Card style={styles.formCard}>
            <Text style={styles.cardTitle}>Add Members</Text>
            <Text style={styles.cardSub}>
              Choose from members or scan a new SplitSOL member.
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
                      {member.isCurrentUser ? 'You' : 'Current member'}
                    </Text>
                  </View>
                </View>
              ))}
            </View>

            <Button
              title="Scan Member QR"
              onPress={() => setScannerVisible(true)}
              variant="secondary"
              size="md"
              icon={<Ionicons name="qr-code-outline" size={20} color={COLORS.bg.accent} />}
              style={styles.scanBtn}
            />
          </Card>

          {availableMembers.length > 0 && (
            <>
              <Text style={styles.recentsTitle}>Recents</Text>
              <Text style={styles.recentsSub}>
                Favorites are pinned to the top
              </Text>
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
                        <Text style={styles.existingMeta}>{member.walletAddress}</Text>
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
                })}
              </View>
            </>
          )}

          {availableMembers.length === 0 && (
            <Card style={styles.emptyCard}>
              <EmptyState
                emoji="➕"
                title="No available members"
                subtitle="Everyone in your member list is already in this group, or you need to scan someone new."
                action={
                  <Button
                    title="Scan New Member"
                    onPress={() => setScannerVisible(true)}
                  />
                }
              />
            </Card>
          )}

          <Button
            title={
              selectedMemberIds.length > 0
                ? `Add ${selectedMemberIds.length} Member${selectedMemberIds.length === 1 ? '' : 's'}`
                : 'Select Members to Add'
            }
            onPress={handleAddSelected}
            disabled={selectedMemberIds.length === 0}
            size="lg"
            style={styles.addBtn}
          />
        </ScrollView>
      </View>

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
  checkboxTick: {
    color: COLORS.text.white,
    fontSize: FONT.size.sm,
    fontWeight: FONT.weight.bold,
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
  emptyCard: {
    minHeight: 220,
    justifyContent: 'center',
  },
  addBtn: {
    marginTop: SPACING.sm,
  },
});
