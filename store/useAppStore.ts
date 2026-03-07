import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import AsyncStorage from '@react-native-async-storage/async-storage';
import {
  AppState,
  Contact,
  Group,
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
  contacts?: Contact[];
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

const getContactIdByWallet = (
  contacts: Contact[],
  walletAddress: string | null | undefined,
) => {
  if (!walletAddress) return null;

  return (
    contacts.find((contact) => contact.walletAddress === walletAddress)?.id ?? null
  );
};

const createMemberFromContact = (contact: Contact): Member => ({
  id: generateId(),
  name: contact.name,
  walletAddress: contact.walletAddress,
  contactId: contact.id,
  isCurrentUser: false,
});

export const useAppStore = create<AppState>()(
  persist(
    (set, get) => ({
      user: createInitialUser(),
      contacts: [],
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

      addContact: (contact) => {
        const existingContact = get().contacts.find(
          (item) => item.walletAddress === contact.walletAddress,
        );

        if (existingContact) {
          set((state) => ({
            contacts: state.contacts.map((item) =>
              item.id === existingContact.id
                ? {
                    ...item,
                    name: contact.name || item.name,
                    isFavorite: contact.isFavorite || item.isFavorite,
                  }
                : item,
            ),
          }));

          return existingContact.id;
        }

        const nextContact: Contact = {
          id: contact.id ?? generateId(),
          name: contact.name,
          walletAddress: contact.walletAddress,
          isFavorite: contact.isFavorite,
          addedAt: contact.addedAt ?? new Date().toISOString(),
          lastTransactionAt: contact.lastTransactionAt ?? null,
        };

        set((state) => ({
          contacts: [nextContact, ...state.contacts],
        }));

        return nextContact.id;
      },

      removeContact: (id) =>
        set((state) => ({
          contacts: state.contacts.filter((contact) => contact.id !== id),
          groups: state.groups.map((group) => ({
            ...group,
            members: group.members.map((member) =>
              member.contactId === id ? { ...member, contactId: null } : member,
            ),
          })),
        })),

      toggleFavorite: (id) =>
        set((state) => ({
          contacts: state.contacts.map((contact) =>
            contact.id === id
              ? { ...contact, isFavorite: !contact.isFavorite }
              : contact,
          ),
        })),

      updateContactLastTransaction: (id) =>
        set((state) => ({
          contacts: state.contacts.map((contact) =>
            contact.id === id
              ? { ...contact, lastTransactionAt: new Date().toISOString() }
              : contact,
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

      updateTransactionStatus: (id, status, chainData) =>
        set((state) => ({
          transactions: state.transactions.map((tx) =>
            tx.id === id ? { ...tx, status, chain: chainData } : tx,
          ),
        })),

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

      createGroup: (name, emoji, contactIds = []) => {
        const id = generateId();
        const { user, contacts } = get();
        const selectedContacts = contactIds
          .map((contactId) => contacts.find((contact) => contact.id === contactId))
          .filter((contact): contact is Contact => Boolean(contact));

        const selfMember: Member = {
          id: generateId(),
          name: user.name || 'Me',
          walletAddress: user.walletAddress,
          contactId: getContactIdByWallet(contacts, user.walletAddress),
          isCurrentUser: true,
        };

        const group: Group = {
          id,
          name,
          emoji,
          members: [
            selfMember,
            ...selectedContacts
              .filter((contact) => contact.walletAddress !== user.walletAddress)
              .map(createMemberFromContact),
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

      addMember: (groupId, name, walletAddress, contactId = null) =>
        set((state) => {
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
                        contactId:
                          contactId ??
                          getContactIdByWallet(state.contacts, walletAddress ?? null),
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
                    message: `You were added to ${
                      state.groups.find((group) => group.id === groupId)?.name ??
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

      updateMemberWallet: (groupId, memberId, wallet) =>
        set((state) => ({
          groups: state.groups.map((group) =>
            group.id === groupId
              ? {
                  ...group,
                  members: group.members.map((member) =>
                    member.id === memberId
                      ? {
                          ...member,
                          walletAddress: wallet,
                          contactId: getContactIdByWallet(state.contacts, wallet),
                        }
                      : member,
                  ),
                }
              : group,
          ),
        })),

      removeMember: (groupId, memberId) =>
        set((state) => ({
          groups: state.groups.map((group) =>
            group.id === groupId
              ? {
                  ...group,
                  members: group.members.filter((member) => member.id !== memberId),
                }
              : group,
          ),
        })),

      addExpense: (groupId, expenseData) =>
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
        })),

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
      version: 1,
      storage: createJSONStorage(() => AsyncStorage),
      partialize: (state) => ({
        user: state.user,
        contacts: state.contacts,
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
          contacts: legacyState.contacts ?? [],
          groups: legacyState.groups ?? [],
          transactions: legacyState.transactions ?? [],
          notifications: legacyState.notifications ?? [],
        };
      },
    },
  ),
);
