import React, { useState } from 'react';
import {
  View,
  Text,
  FlatList,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  Alert,
  Modal,
  Pressable,
} from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import * as Haptics from 'expo-haptics';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import Ionicons from '@expo/vector-icons/Ionicons';
import { useAppStore } from '@/store/useAppStore';
import { Avatar } from '@/components/ui/Avatar';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { EmptyState } from '@/components/ui/EmptyState';
import { formatCurrency } from '@/utils/formatters';
import { getTotalExpenses } from '@/utils/calculations';
import { COLORS, SPACING, FONT, RADIUS } from '@/utils/constants';
import { buildGroupInviteQrPayload } from '@/utils/memberQr';
import { Expense, SimplifiedDebt } from '@/store/types';

let QRCode: any = null;
try {
  const mod = require('react-native-qrcode-svg');
  QRCode = mod.default || mod;
} catch { }

type Tab = 'expenses' | 'balances';

export default function GroupDetail() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const group = useAppStore((s) => s.getGroup(id));
  const deleteGroup = useAppStore((s) => s.deleteGroup);
  const removeMember = useAppStore((s) => s.removeMember);
  const getSimplifiedDebts = useAppStore((s) => s.getSimplifiedDebts);
  const getBalances = useAppStore((s) => s.getBalances);
  const addNotification = useAppStore((s) => s.addNotification);
  const members = useAppStore((s) => s.members);
  const addGroupMember = useAppStore((s) => s.addGroupMember);

  const [activeTab, setActiveTab] = useState<Tab>('expenses');
  const [showInviteQr, setShowInviteQr] = useState(false);
  const [showMemberPicker, setShowMemberPicker] = useState(false);
  const [pickerSelection, setPickerSelection] = useState<string[]>([]);
  const [showSettingsModal, setShowSettingsModal] = useState(false);
  const [showDeleteConfirmModal, setShowDeleteConfirmModal] = useState(false);
  const [showSuccessModal, setShowSuccessModal] = useState(false);

  if (!group) {
    return (
      <View style={styles.container}>
        <Text style={styles.notFound}>Group not found</Text>
      </View>
    );
  }

  const debts = getSimplifiedDebts(id);
  const balances = getBalances(id);
  const totalExpenses = getTotalExpenses(group.expenses);
  const myBalance = balances.find((b) => {
    const member = group.members.find((m) => m.id === b.memberId);
    return member?.isCurrentUser;
  })?.amount ?? 0;

  const getAvailableMembers = () => {
    const groupMemberIds = group.members.map((m) => m.id);
    return [...members]
      .filter((m) => !groupMemberIds.includes(m.id))
      .sort((a, b) => {
        if (a.isFavorite !== b.isFavorite) return a.isFavorite ? -1 : 1;
        return a.name.localeCompare(b.name);
      });
  };

  const availableMembers = getAvailableMembers();

  const togglePickerMember = (memberId: string) => {
    setPickerSelection((current) =>
      current.includes(memberId)
        ? current.filter((id) => id !== memberId)
        : [...current, memberId],
    );
  };

  const confirmPickerSelection = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    pickerSelection.forEach((memberId) => {
      const globalMember = members.find((m) => m.id === memberId);
      if (globalMember) {
        addGroupMember(id, globalMember.name, globalMember.walletAddress, globalMember.id);
      }
    });
    setShowMemberPicker(false);
    setPickerSelection([]);
    setShowSuccessModal(true);
  };

  const renderExpenseItem = ({ item }: { item: Expense }) => {
    const payer = group.members.find((m) => m.id === item.paidBy);
    const isMePayer = payer?.isCurrentUser;
    const payerName = isMePayer ? 'You' : payer?.name?.split(' ')[0] ?? 'Unknown';
    const splitCount = item.splitAmong.length;

    const mySplit = item.splitAmong.find((uid) => {
      const mem = group.members.find((m) => m.id === uid);
      return mem?.isCurrentUser;
    });

    let shareText1 = '';
    let shareText2 = '';
    let shareColor = COLORS.text.secondary;

    if (mySplit) {
      const shareAmt = item.amount / splitCount;
      if (isMePayer) {
        const owedToMe = item.amount - shareAmt;
        shareText1 = 'You lent';
        shareText2 = `${formatCurrency(owedToMe)}`;
        shareColor = COLORS.text.success;
      } else {
        shareText1 = 'You owe';
        shareText2 = `${formatCurrency(shareAmt)}`;
        shareColor = COLORS.text.danger;
      }
    } else {
      if (isMePayer) {
        shareText1 = 'You lent';
        shareText2 = `${formatCurrency(item.amount)}`;
        shareColor = COLORS.text.success;
      } else {
        shareText1 = 'Not involved';
        shareText2 = '';
        shareColor = COLORS.text.tertiary;
      }
    }

    const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
    const d = new Date(item.createdAt);
    const month = months[d.getMonth()];
    const day = d.getDate();
    let hours = d.getHours();
    const mins = d.getMinutes().toString().padStart(2, '0');
    const ampm = hours >= 12 ? 'PM' : 'AM';
    hours = hours % 12;
    hours = hours ? hours : 12;

    const dateLine1 = `${month} ${day}, ${hours}:${mins}`;
    const dateLine2 = ampm;

    return (
      <Card style={styles.expenseCard}>
        <View style={styles.expenseRowOuter}>
          <View style={styles.expenseAvatar}>
            <Avatar name={payer?.name ?? 'Unknown'} size={46} />
          </View>
          <View style={styles.expenseInfoCol}>

            <View style={styles.expenseHeaderRow}>
              <Text style={styles.expenseDesc} numberOfLines={1}>{item.description}</Text>
              <Text style={styles.expenseAmountMain}>{formatCurrency(item.amount)}</Text>
            </View>

            <View style={styles.expensePillRow}>
              <View style={styles.payerPill}>
                <Text style={styles.payerPillText}>Paid by {payerName}</Text>
              </View>
            </View>

            <View style={styles.expenseFooterRow}>
              <View style={styles.expenseFooterLeft}>
                <Text style={styles.splitText}>
                  Split {splitCount} way{splitCount !== 1 ? 's' : ''} •{' '}
                  <Text style={[styles.splitText, { color: shareColor }]}>{shareText1}</Text>
                </Text>
                {shareText2 ? (
                  <Text style={[styles.splitText, { color: shareColor }]}>{shareText2}</Text>
                ) : null}
              </View>
              <View style={styles.expenseDateContainer}>
                <Text style={styles.expenseDateStr}>{dateLine1}</Text>
                <Text style={styles.expenseDateStr}>{dateLine2}</Text>
              </View>
            </View>

          </View>
        </View>
      </Card>
    );
  };

  const renderDebtItem = (debt: SimplifiedDebt, index: number) => {
    const isYouOwe = debt.from.isCurrentUser;
    const label = isYouOwe
      ? `You owe ${debt.to.name}`
      : `${debt.from.name} owes you`;
    const amountColor = isYouOwe ? COLORS.text.danger : COLORS.text.success;

    return (
      <Card key={index} style={styles.debtCard}>
        <View style={styles.debtRow}>
          <View style={styles.debtAvatars}>
            <Avatar name={debt.from.name} size={36} />
            <View style={styles.debtArrowWrap}>
              <Ionicons name="arrow-forward" size={16} color={COLORS.bg.accent} />
            </View>
            <Avatar name={debt.to.name} size={36} />
          </View>
          <View style={styles.debtInfo}>
            <Text style={styles.debtLabel}>{label}</Text>
            <Text style={[styles.debtAmount, { color: amountColor }]}>
              {formatCurrency(debt.amount)}
            </Text>
          </View>
          <View style={styles.debtActions}>
            {debt.from.isCurrentUser ? (
              <Button
                title="Settle"
                variant="primary"
                size="sm"
                onPress={() => {
                  Haptics.notificationAsync(Haptics.NotificationFeedbackType.Warning);
                  router.push(
                    `/group/${id}/settle/${debt.from.id}_${debt.to.id}`,
                  );
                }}
              />
            ) : (
              <Button
                title="Remind"
                variant="secondary"
                size="sm"
                onPress={() => {
                  Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                  addNotification({
                    type: 'reminder',
                    relatedGroupId: id,
                    relatedPaymentId: null,
                    message: `Reminder: ${debt.from.name} owes ${formatCurrency(debt.amount)} to ${debt.to.name} in ${group.name}.`,
                  });
                  Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
                  Alert.alert('Reminder Sent', 'A local reminder has been added to notifications.');
                }}
              />
            )}
          </View>
        </View>
      </Card>
    );
  };

  const openSettings = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    setShowSettingsModal(true);
  };

  return (
    <LinearGradient
      colors={['#FDCBEE', '#E7D4FC', '#C1E6F5']}
      style={[styles.container, { paddingTop: insets.top }]}
      start={{ x: 0, y: 0 }}
      end={{ x: 1, y: 1 }}
    >
      {/* Header */}
      <View style={styles.headerBar}>
        <TouchableOpacity
          onPress={() => {
            Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
            router.back();
          }}
          style={styles.backBtnWrapper}
          activeOpacity={0.7}
        >
          <View style={styles.backBtnCircle}>
            <Ionicons name="arrow-back" size={24} color="#111827" />
          </View>
        </TouchableOpacity>

        <View style={styles.headerTitleRow}>
          <Text style={styles.headerEmoji}>{group.emoji}</Text>
          <Text style={styles.headerTitle} numberOfLines={1}>
            {group.name}
          </Text>
        </View>

        <TouchableOpacity
          activeOpacity={0.7}
          style={styles.settingsBtn}
          onPress={openSettings}
        >
          <Ionicons name="settings-outline" size={24} color="#111827" />
        </TouchableOpacity>
      </View>

      {/* Hero Card */}
      <Card style={styles.heroCard}>
        <View style={styles.heroContent}>
          <Text style={styles.heroLabel}>Total group spending</Text>
          <Text style={styles.heroTotalAmount}>
            {formatCurrency(totalExpenses).split(' ')[0]} <Text style={styles.heroTotalCurrency}>USDC</Text>
          </Text>

          <View style={styles.heroBalanceRow}>
            <View style={styles.heroBalanceCol}>
              <Text style={styles.heroLabel}>Your balance</Text>
              <Text style={[styles.heroMyBalance, myBalance >= 0 ? styles.heroBalanceGreen : styles.heroBalanceRed]}>
                {myBalance > 0 ? '+' : ''}{formatCurrency(myBalance)}
              </Text>
            </View>
            <View style={styles.heroAvatars}>
              {group.members.slice(0, 3).map((member, idx) => (
                <View key={member.id} style={[styles.avatarOverlap, idx > 0 && { marginLeft: -12 }]}>
                  <Avatar name={member.name} size={32} />
                </View>
              ))}
              {group.members.length > 3 && (
                <View style={[styles.avatarOverlap, styles.avatarOverflow, { marginLeft: -12 }]}>
                  <Text style={styles.avatarOverflowText}>+{group.members.length - 3}</Text>
                </View>
              )}
            </View>
          </View>
        </View>
      </Card>

      {/* Action Buttons */}
      <View style={styles.actionRow}>
        <TouchableOpacity
          style={styles.primaryActionBtn}
          onPress={() => {
            Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
            router.push(`/group/${id}/add-split` as any);
          }}
          activeOpacity={0.8}
        >
          <Ionicons name="add" size={20} color="#FFF" />
          <Text style={styles.primaryActionText}>Add Expense</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.secondaryActionBtn}
          onPress={() => {
            Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
            setShowInviteQr(true);
          }}
          activeOpacity={0.8}
        >
          <Ionicons name="push-outline" size={20} color="#111827" />
          <Text style={styles.secondaryActionText}>Invite Member</Text>
        </TouchableOpacity>
      </View>

      {/* Segmented control */}
      <View style={styles.tabContainer}>
        <TouchableOpacity
          style={[styles.tabSegment, activeTab === 'expenses' && styles.tabSegmentActive]}
          onPress={() => {
            Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
            setActiveTab('expenses');
          }}
        >
          <Text
            style={[
              styles.tabText,
              activeTab === 'expenses' && styles.tabTextActive,
            ]}
          >
            Expenses
          </Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.tabSegment, activeTab === 'balances' && styles.tabSegmentActive]}
          onPress={() => {
            Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
            setActiveTab('balances');
          }}
        >
          <Text
            style={[
              styles.tabText,
              activeTab === 'balances' && styles.tabTextActive,
            ]}
          >
            Balances
          </Text>
        </TouchableOpacity>
      </View>

      {/* Tab Content */}
      {activeTab === 'expenses' ? (
        group.expenses.length === 0 ? (
          <EmptyState
            emoji="🧾"
            title="No expenses yet"
            subtitle="Add your first split to start tracking."
          />
        ) : (
          <FlatList
            data={group.expenses}
            keyExtractor={(item) => item.id}
            renderItem={renderExpenseItem}
            contentContainerStyle={styles.listContent}
            showsVerticalScrollIndicator={false}
            ItemSeparatorComponent={() => <View style={styles.cardGap} />}
          />
        )
      ) : debts.length === 0 ? (
        <EmptyState
          emoji="✅"
          title="All settled up!"
          subtitle="No outstanding balances in this group."
        />
      ) : (
        <ScrollView
          contentContainerStyle={styles.listContent}
          showsVerticalScrollIndicator={false}
        >
          {debts.map((d, i) => (
            <React.Fragment key={i}>
              {renderDebtItem(d, i)}
              <View style={styles.cardGap} />
            </React.Fragment>
          ))}
        </ScrollView>
      )}

      {/* Group Invite QR Modal */}
      <Modal
        visible={showInviteQr}
        transparent
        animationType="fade"
        onRequestClose={() => setShowInviteQr(false)}
      >
        <Pressable style={styles.modalOverlay} onPress={() => setShowInviteQr(false)}>
          <Pressable style={styles.modalCard} onPress={() => { }}>
            <TouchableOpacity
              style={styles.modalCloseBtn}
              onPress={() => setShowInviteQr(false)}
              activeOpacity={0.7}
            >
              <Ionicons name="close" size={20} color={COLORS.text.secondary} />
            </TouchableOpacity>
            <Text style={styles.modalTitle}>Invite to Group</Text>
            <Text style={styles.modalSubtitle}>
              Have someone scan this to join <Text style={styles.modalGroupName}>{group.name}</Text>
            </Text>
            {QRCode ? (
              <View style={styles.qrWrap}>
                <QRCode
                  value={buildGroupInviteQrPayload(
                    group.id,
                    group.inviteCode ?? group.id.slice(0, 8),
                    group.name,
                  )}
                  size={220}
                  color={COLORS.text.primary}
                  backgroundColor="transparent"
                />
              </View>
            ) : (
              <Text style={styles.qrFallback}>QR unavailable</Text>
            )}
            <Text style={styles.modalEmoji}>{group.emoji}</Text>
            <Text style={styles.modalGroupLabel}>{group.name}</Text>
            <Text style={styles.modalHint}>Share to invite members · SplitSOL</Text>
          </Pressable>
        </Pressable>
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
                  subtitle="All your members are already in this group, or you have no other members."
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
                renderItem={({ item }) => {
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

      {/* Settings Options Modal */}
      <Modal
        visible={showSettingsModal}
        transparent
        animationType="fade"
        onRequestClose={() => setShowSettingsModal(false)}
      >
        <Pressable style={styles.modalOverlay} onPress={() => setShowSettingsModal(false)}>
          <Pressable style={styles.actionSheetCard} onPress={() => { }}>
            <View style={styles.actionSheetHeader}>
              <Text style={styles.actionSheetTitle}>Group Options</Text>
              <Text style={styles.actionSheetSubtitle}>Manage "{group.name}"</Text>
            </View>

            <View style={styles.actionSheetButtons}>
              <TouchableOpacity
                style={styles.actionSheetBtn}
                onPress={() => {
                  setShowSettingsModal(false);
                  setTimeout(() => setShowInviteQr(true), 300);
                }}
                activeOpacity={0.7}
              >
                <View style={styles.actionSheetIconBg}>
                  <Ionicons name="qr-code-outline" size={20} color={COLORS.text.primary} />
                </View>
                <Text style={styles.actionSheetBtnText}>Invite via QR</Text>
              </TouchableOpacity>

              <View style={styles.actionSheetDivider} />

              <TouchableOpacity
                style={styles.actionSheetBtn}
                onPress={() => {
                  setShowSettingsModal(false);
                  setTimeout(() => {
                    setPickerSelection([]);
                    setShowMemberPicker(true);
                  }, 300);
                }}
                activeOpacity={0.7}
              >
                <View style={styles.actionSheetIconBg}>
                  <Ionicons name="person-add-outline" size={20} color={COLORS.text.primary} />
                </View>
                <Text style={styles.actionSheetBtnText}>Add Existing Member</Text>
              </TouchableOpacity>

              <View style={styles.actionSheetDivider} />

              <TouchableOpacity
                style={styles.actionSheetBtn}
                onPress={() => {
                  setShowSettingsModal(false);
                  setTimeout(() => setShowDeleteConfirmModal(true), 300);
                }}
                activeOpacity={0.7}
              >
                <View style={[styles.actionSheetIconBg, { backgroundColor: '#FEE2E2' }]}>
                  <Ionicons name="trash-outline" size={20} color={COLORS.bg.danger} />
                </View>
                <Text style={[styles.actionSheetBtnText, { color: COLORS.text.danger }]}>Delete Group</Text>
              </TouchableOpacity>
            </View>

            <TouchableOpacity
              style={styles.actionSheetCancelBtn}
              onPress={() => setShowSettingsModal(false)}
              activeOpacity={0.7}
            >
              <Text style={styles.actionSheetCancelText}>Cancel</Text>
            </TouchableOpacity>
          </Pressable>
        </Pressable>
      </Modal>

      {/* Delete Confirmation Modal */}
      <Modal
        visible={showDeleteConfirmModal}
        transparent
        animationType="fade"
        onRequestClose={() => setShowDeleteConfirmModal(false)}
      >
        <Pressable style={styles.modalOverlay} onPress={() => setShowDeleteConfirmModal(false)}>
          <Pressable style={styles.actionSheetCard} onPress={() => { }}>
            <View style={styles.warningIconWrap}>
              <Ionicons name="alert-circle" size={48} color={COLORS.bg.danger} />
            </View>
            <Text style={styles.modalTitle}>Delete Group?</Text>
            <Text style={[styles.modalSubtitle, { paddingHorizontal: 16 }]}>
              This will permanently delete this group and all its expenses. This action cannot be undone.
            </Text>

            <View style={styles.modalActionRow}>
              <Button
                title="Cancel"
                variant="secondary"
                size="lg"
                onPress={() => setShowDeleteConfirmModal(false)}
                style={{ flex: 1 }}
              />
              <Button
                title="Delete"
                variant="danger"
                size="lg"
                onPress={() => {
                  Haptics.notificationAsync(Haptics.NotificationFeedbackType.Warning);
                  setShowDeleteConfirmModal(false);
                  deleteGroup(id);
                  router.back();
                }}
                style={{ flex: 1 }}
              />
            </View>
          </Pressable>
        </Pressable>
      </Modal>

      {/* Success Modal */}
      <Modal
        visible={showSuccessModal}
        transparent
        animationType="fade"
        onRequestClose={() => setShowSuccessModal(false)}
      >
        <Pressable style={styles.modalOverlay} onPress={() => setShowSuccessModal(false)}>
          <Pressable style={[styles.actionSheetCard, { alignItems: 'center' }]} onPress={() => { }}>
            <View style={styles.successIconWrap}>
              <Ionicons name="checkmark-circle" size={48} color={COLORS.bg.success} />
            </View>
            <Text style={styles.modalTitle}>Members Added</Text>
            <Text style={styles.modalSubtitle}>
              The selected members were successfully added to the group.
            </Text>

            <Button
              title="Done"
              variant="primary"
              size="lg"
              onPress={() => setShowSuccessModal(false)}
              style={{ width: '100%', marginTop: 8 }}
            />
          </Pressable>
        </Pressable>
      </Modal>

    </LinearGradient>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  notFound: {
    color: COLORS.text.secondary,
    fontSize: FONT.size.md,
    textAlign: 'center',
    marginTop: 100,
  },

  headerBar: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: SPACING.xl,
    paddingVertical: SPACING.md,
    marginBottom: SPACING.sm,
  },
  backBtnWrapper: {
    marginRight: 16,
  },
  backBtnCircle: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: 'rgba(255,255,255,0.6)',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.8)',
  },
  headerTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
    gap: 8,
  },
  headerEmoji: {
    fontSize: 24,
  },
  headerTitle: {
    fontSize: 22,
    fontWeight: '800',
    color: '#111827',
  },
  settingsBtn: {
    paddingLeft: 12,
  },

  heroCard: {
    marginHorizontal: SPACING.xl,
    marginBottom: SPACING.xl,
    backgroundColor: 'transparent',
    borderRadius: 24,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.4)',
    padding: SPACING.xl,
  },
  heroContent: {
    width: '100%',
  },
  heroLabel: {
    color: '#6B7280',
    fontSize: 14,
    fontWeight: '600',
    marginBottom: 4,
  },
  heroTotalAmount: {
    color: '#111827',
    fontSize: 34,
    fontWeight: '900',
    marginBottom: 16,
    letterSpacing: -0.5,
  },
  heroTotalCurrency: {
    color: '#9CA3AF',
    fontSize: 22,
    fontWeight: '800',
  },
  heroBalanceRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-end',
  },
  heroBalanceCol: {
    flex: 1,
  },
  heroMyBalance: {
    fontSize: 18,
    fontWeight: '800',
  },
  heroBalanceGreen: {
    color: '#10B981',
  },
  heroBalanceRed: {
    color: '#EF4444',
  },
  heroAvatars: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  avatarOverlap: {
    borderWidth: 2,
    borderColor: '#FFFFFF',
    borderRadius: 20,
  },
  avatarOverflow: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: '#F3F4F6',
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarOverflowText: {
    color: '#111827',
    fontSize: 12,
    fontWeight: '700',
  },

  actionRow: {
    flexDirection: 'row',
    paddingHorizontal: SPACING.xl,
    gap: SPACING.md,
    marginBottom: SPACING.lg,
  },
  primaryActionBtn: {
    flex: 1,
    flexDirection: 'row',
    backgroundColor: '#7C3AED',
    paddingVertical: 14,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    shadowColor: '#7C3AED',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 4,
  },
  primaryActionText: {
    color: '#FFF',
    fontSize: 16,
    fontWeight: '700',
  },
  secondaryActionBtn: {
    flex: 1,
    flexDirection: 'row',
    backgroundColor: 'rgba(255, 255, 255, 0.8)',
    paddingVertical: 14,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.9)',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
  },
  secondaryActionText: {
    color: '#111827',
    fontSize: 16,
    fontWeight: '700',
  },

  tabContainer: {
    flexDirection: 'row',
    marginHorizontal: SPACING.xl,
    backgroundColor: 'rgba(255, 255, 255, 0.45)',
    borderRadius: 14,
    padding: 6,
    marginBottom: SPACING.md,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.8)',
  },
  tabSegment: {
    flex: 1,
    paddingVertical: 10,
    alignItems: 'center',
    borderRadius: 10,
  },
  tabSegmentActive: {
    backgroundColor: '#FFFFFF',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
  },
  tabText: {
    color: '#6B7280',
    fontSize: 15,
    fontWeight: '600',
  },
  tabTextActive: {
    color: '#111827',
    fontWeight: '800',
  },

  listContent: {
    paddingHorizontal: SPACING.xl,
    paddingTop: SPACING.xs,
    paddingBottom: 40,
  },
  cardGap: {
    height: 12,
  },

  expenseCard: {
    padding: SPACING.lg,
    backgroundColor: 'rgba(255, 255, 255, 0.55)',
    borderRadius: 20,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.8)',
  },
  expenseRowOuter: {
    flexDirection: 'row',
    alignItems: 'flex-start',
  },
  expenseAvatar: {
    marginRight: 12,
  },
  expenseInfoCol: {
    flex: 1,
  },
  expenseHeaderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 4,
  },
  expenseDesc: {
    color: '#111827',
    fontSize: 16,
    fontWeight: '800',
    flex: 1,
    marginRight: 8,
  },
  expenseAmountMain: {
    color: '#111827',
    fontSize: 16,
    fontWeight: '800',
  },
  expensePillRow: {
    flexDirection: 'row',
    marginBottom: 10,
  },
  payerPill: {
    backgroundColor: '#F3F4F6',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
  },
  payerPillText: {
    color: '#4B5563',
    fontSize: 12,
    fontWeight: '600',
  },
  expenseFooterRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
  },
  expenseFooterLeft: {
    flex: 1,
  },
  splitText: {
    color: '#6B7280',
    fontSize: 13,
    fontWeight: '600',
    lineHeight: 18,
  },
  expenseDateContainer: {
    alignItems: 'flex-end',
    justifyContent: 'flex-end',
  },
  expenseDateStr: {
    color: '#9CA3AF',
    fontSize: 12,
    fontWeight: '500',
    lineHeight: 16,
  },

  debtCard: {
    padding: SPACING.lg,
    backgroundColor: 'rgba(255, 255, 255, 0.55)',
    borderRadius: 20,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.8)',
  },
  debtRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING.md,
  },
  debtAvatars: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING.xs,
  },
  debtArrowWrap: {
    paddingHorizontal: SPACING.xs,
  },
  debtInfo: {
    flex: 1,
  },
  debtLabel: {
    color: COLORS.text.primary,
    fontSize: FONT.size.md,
    fontWeight: FONT.weight.bold,
  },
  debtAmount: {
    fontSize: FONT.size.md,
    fontWeight: FONT.weight.bold,
    marginTop: 2,
  },
  debtActions: {
    minWidth: 80,
  },

  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.45)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: SPACING.xl,
  },
  modalCard: {
    backgroundColor: COLORS.bg.secondary,
    borderRadius: RADIUS.xxl,
    padding: SPACING.xxl,
    width: '100%',
    alignItems: 'center',
    gap: SPACING.sm,
  },
  modalCloseBtn: {
    position: 'absolute',
    top: SPACING.lg,
    right: SPACING.lg,
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: COLORS.bg.tertiary,
    alignItems: 'center',
    justifyContent: 'center',
  },
  modalTitle: {
    color: COLORS.text.primary,
    fontSize: FONT.size.xl,
    fontWeight: FONT.weight.bold,
    marginTop: SPACING.xs,
  },
  modalSubtitle: {
    color: COLORS.text.secondary,
    fontSize: FONT.size.sm,
    textAlign: 'center',
    marginBottom: SPACING.md,
  },
  modalGroupName: {
    color: COLORS.text.primary,
    fontWeight: FONT.weight.semibold,
  },
  qrWrap: {
    padding: SPACING.lg,
    backgroundColor: COLORS.bg.primary,
    borderRadius: RADIUS.lg,
    marginVertical: SPACING.sm,
  },
  qrFallback: {
    color: COLORS.text.secondary,
    fontSize: FONT.size.sm,
    marginVertical: SPACING.xxl,
  },
  modalEmoji: {
    fontSize: 28,
    marginTop: SPACING.md,
  },
  modalGroupLabel: {
    color: COLORS.text.primary,
    fontSize: FONT.size.lg,
    fontWeight: FONT.weight.bold,
  },
  modalHint: {
    color: COLORS.text.tertiary,
    fontSize: FONT.size.xs,
    marginTop: SPACING.xs,
  },

  /* Action Sheet Styles */
  actionSheetCard: {
    backgroundColor: COLORS.bg.secondary,
    borderRadius: 24,
    padding: SPACING.xl,
    width: '100%',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.15,
    shadowRadius: 20,
    elevation: 10,
  },
  actionSheetHeader: {
    alignItems: 'center',
    marginBottom: SPACING.xl,
  },
  actionSheetTitle: {
    fontSize: 20,
    fontWeight: '800',
    color: '#111827',
    marginBottom: 4,
  },
  actionSheetSubtitle: {
    fontSize: 14,
    color: '#6B7280',
    fontWeight: '500',
  },
  actionSheetButtons: {
    backgroundColor: 'rgba(0,0,0,0.03)',
    borderRadius: 16,
    overflow: 'hidden',
  },
  actionSheetBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 16,
    paddingHorizontal: 20,
    gap: 16,
  },
  actionSheetIconBg: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: '#FFFFFF',
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 1,
  },
  actionSheetBtnText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#111827',
  },
  actionSheetDivider: {
    height: 1,
    backgroundColor: 'rgba(0,0,0,0.06)',
    marginLeft: 72,
  },
  actionSheetCancelBtn: {
    marginTop: 16,
    paddingVertical: 16,
    backgroundColor: 'rgba(0,0,0,0.05)',
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
  },
  actionSheetCancelText: {
    fontSize: 16,
    fontWeight: '700',
    color: '#4B5563',
  },
  warningIconWrap: {
    alignItems: 'center',
    marginBottom: 16,
  },
  modalActionRow: {
    flexDirection: 'row',
    gap: 12,
    marginTop: 24,
  },
  successIconWrap: {
    alignItems: 'center',
    marginBottom: 16,
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
