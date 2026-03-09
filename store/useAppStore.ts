import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import AsyncStorage from '@react-native-async-storage/async-storage';
import {
  AppState,
  Group,
  GroupMember,
  Member,
  Notification,
  Settlement,
  Transaction,
  UserProfile,
} from '@/types';
import { formatCurrency, generateId } from '@/utils/formatters';
import { calculateBalances, simplifyDebts } from '@/utils/calculations';

interface LegacyPersistedState {
  user?: Partial<UserProfile> & { onboardingComplete?: boolean };
  contacts?: Member[];
  members?: Member[];
  groups?: Group[];
  transactions?: Transaction[];
  notifications?: Notification[];
  walletAddress?: string | null;
  walletAuthToken?: string | null;
}

const createInitialUser = (): UserProfile => ({
  name: '',
  walletAddress: null,
  walletAuthToken: null,
  notificationsEnabled: true,
  createdAt: new Date().toISOString(),
});

const getMemberIdByWallet = (
  members: Member[],
  walletAddress: string | null | undefined,
) => {
  if (!walletAddress) return null;

  return (
    members.find((member) => member.walletAddress === walletAddress)?.id ?? null
  );
};

const createGroupMemberFromMember = (member: Member): GroupMember => ({
  id: generateId(),
  name: member.name,
  walletAddress: member.walletAddress,
  memberId: member.id,
  isCurrentUser: false,
});

export const useAppStore = create<AppState>()(
  persist(
    (set, get) => ({
      user: createInitialUser(),
      members: [],
      groups: [],
      transactions: [],
      notifications: [],

      setUser: (name, walletAddress, authToken) =>
        set((state) => ({
          user: {
            ...state.user,
            name,
            walletAddress,
            walletAuthToken: authToken,
          },
        })),

      setNotificationsEnabled: (enabled) =>
        set((state) => ({
          user: {
            ...state.user,
            notificationsEnabled: enabled,
          },
        })),

      addMember: (member) => {
        const existingMember = get().members.find(
          (item) => item.walletAddress === member.walletAddress,
        );

        if (existingMember) {
          const updatedName = member.name || existingMember.name;
          set((state) => ({
            members: state.members.map((item) =>
              item.id === existingMember.id
                ? {
                  ...item,
                  name: updatedName,
                  isFavorite: member.isFavorite || item.isFavorite,
                }
                : item,
            ),
            // Sync name into all GroupMembers linked via memberId
            groups: state.groups.map((group) => ({
              ...group,
              members: group.members.map((gm) =>
                gm.memberId === existingMember.id
                  ? { ...gm, name: updatedName }
                  : gm,
              ),
            })),
          }));

          return existingMember.id;
        }

        const nextMember: Member = {
          id: member.id ?? generateId(),
          name: member.name,
          walletAddress: member.walletAddress,
          isFavorite: member.isFavorite,
          addedAt: member.addedAt ?? new Date().toISOString(),
          lastTransactionAt: member.lastTransactionAt ?? null,
        };

        set((state) => ({
          members: [nextMember, ...state.members],
        }));

        return nextMember.id;
      },

      removeMemberFromList: (id) =>
        set((state) => ({
          members: state.members.filter((member) => member.id !== id),
          groups: state.groups.map((group) => ({
            ...group,
            members: group.members.map((m) =>
              m.memberId === id ? { ...m, memberId: null } : m,
            ),
          })),
        })),

      toggleFavorite: (id) =>
        set((state) => ({
          members: state.members.map((member) =>
            member.id === id
              ? { ...member, isFavorite: !member.isFavorite }
              : member,
          ),
        })),

      updateMemberLastTransaction: (id) =>
        set((state) => ({
          members: state.members.map((member) =>
            member.id === id
              ? { ...member, lastTransactionAt: new Date().toISOString() }
              : member,
          ),
        })),

      addTransaction: (tx) => {
        const nextTransaction: Transaction = {
          ...tx,
          id: tx.id ?? generateId(),
          timestamp: tx.timestamp ?? new Date().toISOString(),
        };

        set((state) => {
          const group = state.groups.find((item) => item.id === nextTransaction.groupId);
          const payer =
            group?.members.find(
              (member) => member.walletAddress === nextTransaction.payerWallet,
            )?.name ?? 'Someone';

          const nextNotifications =
            nextTransaction.status === 'confirmed' &&
              group &&
              state.user.notificationsEnabled
              ? [
                {
                  id: generateId(),
                  type: 'settlement' as const,
                  relatedGroupId: group.id,
                  relatedPaymentId: nextTransaction.id,
                  message: `${payer} settled ${formatCurrency(nextTransaction.amountUSDC)} in ${group.name}.`,
                  timestamp: new Date().toISOString(),
                  read: false,
                },
                ...state.notifications,
              ]
              : state.notifications;

          return {
            transactions: [nextTransaction, ...state.transactions],
            notifications: nextNotifications,
          };
        });

        return nextTransaction.id;
      },



      addNotification: (notif) => {
        if (!get().user.notificationsEnabled) {
          return '';
        }

        const nextNotification: Notification = {
          ...notif,
          id: notif.id ?? generateId(),
          timestamp: notif.timestamp ?? new Date().toISOString(),
          read: notif.read ?? false,
        };

        set((state) => ({
          notifications: [nextNotification, ...state.notifications],
        }));

        return nextNotification.id;
      },

      markNotificationRead: (id) =>
        set((state) => ({
          notifications: state.notifications.map((notif) =>
            notif.id === id ? { ...notif, read: true } : notif,
          ),
        })),

      markAllNotificationsRead: () =>
        set((state) => ({
          notifications: state.notifications.map((notif) => ({
            ...notif,
            read: true,
          })),
        })),

      createGroup: (name, emoji, memberIds = []) => {
        const id = generateId();
        const { user, members } = get();
        const selectedMembers = memberIds
          .map((memberId) => members.find((member) => member.id === memberId))
          .filter((member): member is Member => Boolean(member));

        const selfGroupMember: GroupMember = {
          id: generateId(),
          name: user.name || 'Me',
          walletAddress: user.walletAddress,
          memberId: getMemberIdByWallet(members, user.walletAddress),
          isCurrentUser: true,
        };

        const group: Group = {
          id,
          name,
          emoji,
          members: [
            selfGroupMember,
            ...selectedMembers
              .filter((member) => member.walletAddress !== user.walletAddress)
              .map(createGroupMemberFromMember),
          ],
          expenses: [],
          settlements: [],
          createdAt: new Date().toISOString(),
          inviteCode: id.slice(0, 8),
        };

        set((state) => ({
          groups: [...state.groups, group],
          notifications: state.user.notificationsEnabled
            ? [
              {
                id: generateId(),
                type: 'invite',
                relatedGroupId: id,
                relatedPaymentId: null,
                message: `You were added to ${name}.`,
                timestamp: new Date().toISOString(),
                read: false,
              },
              ...state.notifications,
            ]
            : state.notifications,
        }));
        return id;
      },

      deleteGroup: (groupId) =>
        set((state) => ({
          groups: state.groups.filter((group) => group.id !== groupId),
        })),

      addGroupMember: (groupId, name, walletAddress, memberId = null) =>
        set((state) => {
          const group = state.groups.find((g) => g.id === groupId);
          if (group) {
            const isDuplicate = walletAddress
              ? group.members.some((m) => m.walletAddress === walletAddress)
              : group.members.some(
                (m) => m.name.toLowerCase() === name.toLowerCase(),
              );
            if (isDuplicate) return {};
          }

          const shouldNotifyCurrentUser =
            walletAddress === state.user.walletAddress ||
            (!!state.user.name && name === state.user.name);

          return {
            groups: state.groups.map((group) =>
              group.id === groupId
                ? {
                  ...group,
                  members: [
                    ...group.members,
                    {
                      id: generateId(),
                      name,
                      walletAddress: walletAddress ?? null,
                      memberId:
                        memberId ??
                        getMemberIdByWallet(state.members, walletAddress ?? null),
                      isCurrentUser: false,
                    },
                  ],
                }
                : group,
            ),
            notifications: shouldNotifyCurrentUser && state.user.notificationsEnabled
              ? [
                {
                  id: generateId(),
                  type: 'invite',
                  relatedGroupId: groupId,
                  relatedPaymentId: null,
                  message: `You were added to ${state.groups.find((group) => group.id === groupId)?.name ??
                    'a group'
                    }.`,
                  timestamp: new Date().toISOString(),
                  read: false,
                },
                ...state.notifications,
              ]
              : state.notifications,
          };
        }),

      updateMemberWallet: (groupId, groupMemberId, wallet) =>
        set((state) => ({
          groups: state.groups.map((group) =>
            group.id === groupId
              ? {
                ...group,
                members: group.members.map((member) =>
                  member.id === groupMemberId
                    ? {
                      ...member,
                      walletAddress: wallet,
                      memberId: getMemberIdByWallet(state.members, wallet),
                    }
                    : member,
                ),
              }
              : group,
          ),
        })),

      removeMember: (groupId, groupMemberId) =>
        set((state) => ({
          groups: state.groups.map((group) =>
            group.id === groupId
              ? {
                ...group,
                members: group.members.filter((member) => member.id !== groupMemberId),
              }
              : group,
          ),
        })),

      addExpense: (groupId, expenseData) => {
        if (!expenseData.splitAmong.length) return;
        set((state) => ({
          groups: state.groups.map((group) =>
            group.id === groupId
              ? {
                ...group,
                expenses: [
                  {
                    ...expenseData,
                    id: generateId(),
                    createdAt: new Date().toISOString(),
                  },
                  ...group.expenses,
                ],
              }
              : group,
          ),
        }));
      },

      removeExpense: (groupId, expenseId) =>
        set((state) => ({
          groups: state.groups.map((group) =>
            group.id === groupId
              ? {
                ...group,
                expenses: group.expenses.filter((expense) => expense.id !== expenseId),
              }
              : group,
          ),
        })),

      addSettlement: (settlementData) => {
        const settlement: Settlement = {
          ...settlementData,
          id: generateId(),
        };

        set((state) => ({
          groups: state.groups.map((group) =>
            group.id === settlement.groupId
              ? {
                ...group,
                settlements: [settlement, ...group.settlements],
              }
              : group,
          ),
        }));
      },

      updateSettlement: (settlementId, updates) =>
        set((state) => ({
          groups: state.groups.map((group) => ({
            ...group,
            settlements: group.settlements.map((settlement) =>
              settlement.id === settlementId
                ? { ...settlement, ...updates }
                : settlement,
            ),
          })),
        })),

      getGroup: (groupId) => {
        return get().groups.find((group) => group.id === groupId);
      },

      getBalances: (groupId) => {
        const group = get().groups.find((item) => item.id === groupId);
        if (!group) return [];
        return calculateBalances(group.expenses, group.members, group.settlements);
      },

      getSimplifiedDebts: (groupId) => {
        const group = get().groups.find((item) => item.id === groupId);
        if (!group) return [];

        const balances = calculateBalances(
          group.expenses,
          group.members,
          group.settlements,
        );

        return simplifyDebts(balances, group.members);
      },
    }),
    {
      name: 'splitsol-store',
      version: 2,
      storage: createJSONStorage(() => AsyncStorage),
      partialize: (state) => ({
        user: state.user,
        members: state.members,
        groups: state.groups,
        transactions: state.transactions,
        notifications: state.notifications,
      }),
      migrate: (persistedState) => {
        const legacyState = (persistedState ?? {}) as LegacyPersistedState;

        return {
          user: {
            name: legacyState.user?.name ?? '',
            walletAddress:
              legacyState.user?.walletAddress ?? legacyState.walletAddress ?? null,
            walletAuthToken:
              legacyState.user?.walletAuthToken ??
              legacyState.walletAuthToken ??
              null,
            notificationsEnabled:
              legacyState.user?.notificationsEnabled ?? true,
            createdAt:
              legacyState.user?.createdAt ?? new Date().toISOString(),
          },
          members: legacyState.members ?? legacyState.contacts ?? [],
          groups: legacyState.groups ?? [],
          transactions: legacyState.transactions ?? [],
          notifications: legacyState.notifications ?? [],
        };
      },
    },
  ),
);
