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
import { useAppStore } from '@/store/useAppStore';
import { Button } from '@/components/ui/Button';
import { Card } from '@/components/ui/Card';
import { Avatar } from '@/components/ui/Avatar';
import { EmptyState } from '@/components/ui/EmptyState';
import { QRScanner } from '@/components/ui/QRScanner';
import { SplitSolQrPayload } from '@/utils/memberQr';
import { COLORS, SPACING, FONT, RADIUS } from '@/utils/constants';

export default function AddMember() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
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
    if (payload.wallet === user.walletAddress) {
      Alert.alert("Can't add yourself", 'You are already in this group.');
      return false;
    }

    if (existingWallets.has(payload.wallet)) {
      Alert.alert('Already in group', `${payload.name} is already a member.`);
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
    Alert.alert(
      existingMember ? 'Member added' : 'Member added',
      `${payload.name} was added to the group.`,
      [{ text: 'OK', onPress: () => router.back() }],
    );
    return true;
  };

  return (
    <>
      <View style={styles.container}>
      <ScrollView
        contentContainerStyle={styles.content}
        keyboardShouldPersistTaps="handled"
      >
        <View style={styles.previewCard}>
          <Text style={styles.previewTitle}>Add Members</Text>
          <Text style={styles.previewSub}>
            Choose from members or scan a new SplitSOL member.
          </Text>
        </View>

        <View style={styles.sectionHeader}>
          <View>
            <Text style={styles.sectionTitle}>Current Members</Text>
            <Text style={styles.sectionSub}>
              {group.members.length} already in this group
            </Text>
          </View>
        </View>

        <View style={styles.existingList}>
          {group.members.map((member) => (
            <Card key={member.id} style={styles.existingMember}>
              <Avatar name={member.name} size={36} />
              <View style={styles.memberCopy}>
                <Text style={styles.existingName}>{member.name}</Text>
                <Text style={styles.existingMeta}>
                  {member.isCurrentUser ? 'You' : 'Current member'}
                </Text>
              </View>
            </Card>
          ))}
        </View>

        <View style={styles.sectionHeader}>
          <View>
            <Text style={styles.sectionTitle}>Add From Members</Text>
            <Text style={styles.sectionSub}>
              Favorites are pinned to the top
            </Text>
          </View>
          <Button
            title="Scan QR"
            onPress={() => setScannerVisible(true)}
            variant="secondary"
            size="sm"
          />
        </View>

        {availableMembers.length === 0 ? (
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
        ) : (
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
    gap: SPACING.xl,
    paddingBottom: SPACING.xxxl,
  },
  previewCard: {
    alignItems: 'center',
    backgroundColor: COLORS.bg.secondary,
    borderRadius: RADIUS.xl,
    paddingVertical: SPACING.xxl,
    paddingHorizontal: SPACING.xl,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06,
    shadowRadius: 8,
    elevation: 3,
  },
  previewTitle: {
    color: COLORS.text.primary,
    fontSize: FONT.size.xl,
    fontWeight: FONT.weight.bold,
  },
  previewSub: {
    color: COLORS.text.secondary,
    fontSize: FONT.size.sm,
    textAlign: 'center',
    marginTop: SPACING.sm,
    lineHeight: 20,
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
  existingList: {
    gap: SPACING.sm,
  },
  existingMember: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING.md,
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
  emptyCard: {
    minHeight: 220,
    justifyContent: 'center',
  },
  memberList: {
    gap: SPACING.sm,
  },
  memberRow: {
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
