import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { AppState, Group, Expense, Settlement, Member } from './types';
import { generateId, stringToColor } from '@/utils/formatters';
import { calculateBalances, simplifyDebts } from '@/utils/calculations';

export const useAppStore = create<AppState>()(
  persist(
    (set, get) => ({
      user: {
        name: '',
        walletAddress: null,
        onboardingComplete: false,
        createdAt: new Date().toISOString(),
      },
      groups: [],
      walletAddress: null,
      walletAuthToken: null,

      setUser: (updates) =>
        set((state) => ({
          user: { ...state.user, ...updates },
        })),

      completeOnboarding: (name) =>
        set((state) => ({
          user: {
            ...state.user,
            name,
            onboardingComplete: true,
          },
        })),

      setWallet: (address, authToken) =>
        set((state) => ({
          walletAddress: address,
          walletAuthToken: authToken || null,
          user: { ...state.user, walletAddress: address },
        })),

      disconnectWallet: () =>
        set((state) => ({
          walletAddress: null,
          walletAuthToken: null,
          user: { ...state.user, walletAddress: null },
        })),

      createGroup: (name, emoji) => {
        const id = generateId();
        const currentUser = get().user;

        const selfMember: Member = {
          id: generateId(),
          name: currentUser.name || 'Me',
          walletAddress: get().walletAddress,
          avatarColor: stringToColor(currentUser.name || 'Me'),
          isCurrentUser: true,
        };

        const group: Group = {
          id,
          name,
          emoji,
          members: [selfMember],
          expenses: [],
          settlements: [],
          createdAt: new Date().toISOString(),
          inviteCode: id.slice(0, 8),
        };

        set((state) => ({ groups: [...state.groups, group] }));
        return id;
      },

      deleteGroup: (groupId) =>
        set((state) => ({
          groups: state.groups.filter((g) => g.id !== groupId),
        })),

      addMember: (groupId, name, walletAddress) =>
        set((state) => ({
          groups: state.groups.map((g) =>
            g.id === groupId
              ? {
                  ...g,
                  members: [
                    ...g.members,
                    {
                      id: generateId(),
                      name,
                      walletAddress: walletAddress || null,
                      avatarColor: stringToColor(name),
                      isCurrentUser: false,
                    },
                  ],
                }
              : g,
          ),
        })),

      updateMemberWallet: (groupId, memberId, wallet) =>
        set((state) => ({
          groups: state.groups.map((g) =>
            g.id === groupId
              ? {
                  ...g,
                  members: g.members.map((m) =>
                    m.id === memberId
                      ? { ...m, walletAddress: wallet }
                      : m,
                  ),
                }
              : g,
          ),
        })),

      removeMember: (groupId, memberId) =>
        set((state) => ({
          groups: state.groups.map((g) =>
            g.id === groupId
              ? {
                  ...g,
                  members: g.members.filter((m) => m.id !== memberId),
                }
              : g,
          ),
        })),

      addExpense: (groupId, expenseData) =>
        set((state) => ({
          groups: state.groups.map((g) =>
            g.id === groupId
              ? {
                  ...g,
                  expenses: [
                    {
                      ...expenseData,
                      id: generateId(),
                      createdAt: new Date().toISOString(),
                    },
                    ...g.expenses,
                  ],
                }
              : g,
          ),
        })),

      removeExpense: (groupId, expenseId) =>
        set((state) => ({
          groups: state.groups.map((g) =>
            g.id === groupId
              ? {
                  ...g,
                  expenses: g.expenses.filter((e) => e.id !== expenseId),
                }
              : g,
          ),
        })),

      addSettlement: (settlementData) => {
        const settlement: Settlement = {
          ...settlementData,
          id: generateId(),
        };

        set((state) => ({
          groups: state.groups.map((g) =>
            g.id === settlement.groupId
              ? { ...g, settlements: [settlement, ...g.settlements] }
              : g,
          ),
        }));
      },

      updateSettlement: (settlementId, updates) =>
        set((state) => ({
          groups: state.groups.map((g) => ({
            ...g,
            settlements: g.settlements.map((s) =>
              s.id === settlementId ? { ...s, ...updates } : s,
            ),
          })),
        })),

      getGroup: (groupId) => {
        return get().groups.find((g) => g.id === groupId);
      },

      getBalances: (groupId) => {
        const group = get().groups.find((g) => g.id === groupId);
        if (!group) return [];
        return calculateBalances(group.expenses, group.members, group.settlements);
      },

      getSimplifiedDebts: (groupId) => {
        const group = get().groups.find((g) => g.id === groupId);
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
      storage: createJSONStorage(() => AsyncStorage),
      partialize: (state) => ({
        user: state.user,
        groups: state.groups,
        walletAddress: state.walletAddress,
        walletAuthToken: state.walletAuthToken,
      }),
    },
  ),
);
