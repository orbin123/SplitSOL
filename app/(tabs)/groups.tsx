import React, { useMemo, useState } from 'react';
import {
  View,
  Text,
  FlatList,
  StyleSheet,
  TouchableOpacity,
} from 'react-native';
import { useRouter } from 'expo-router';
import * as Haptics from 'expo-haptics';
import Ionicons from '@expo/vector-icons/Ionicons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useAppStore } from '@/store/useAppStore';
import { Card } from '@/components/ui/Card';
import { Input } from '@/components/ui/Input';
import { EmptyState } from '@/components/ui/EmptyState';
import { Button } from '@/components/ui/Button';
import {
  COLORS,
  SPACING,
  FONT,
  TAB_BAR_HEIGHT,
  SHADOWS,
} from '@/utils/constants';
import { Group } from '@/store/types';

const GROUP_BG_COLORS = [
  '#FEE2E2', '#FEF3C7', '#D1FAE5', '#DBEAFE',
  '#EDE9FE', '#FCE7F3', '#FFEDD5', '#CCFBF1',
];

function getGroupIconBg(str: string): string {
  let hash = 0;
  for (let i = 0; i < str.length; i++) {
    hash = str.charCodeAt(i) + ((hash << 5) - hash);
  }
  return GROUP_BG_COLORS[Math.abs(hash) % GROUP_BG_COLORS.length];
}

export default function Groups() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const groups = useAppStore((s) => s.groups);
  const getBalances = useAppStore((s) => s.getBalances);
  const [query, setQuery] = useState('');

  const filteredGroups = useMemo(() => {
    const search = query.trim().toLowerCase();
    if (!search) return groups;
    return groups.filter((g) =>
      g.name.toLowerCase().includes(search),
    );
  }, [groups, query]);

  const getGroupBalance = (group: Group) => {
    const balances = getBalances(group.id);
    const myBalance = balances.find((b) => {
      const member = group.members.find((m) => m.id === b.memberId);
      return member?.isCurrentUser;
    });
    return myBalance?.amount ?? 0;
  };

  const renderGroupCard = ({ item }: { item: Group }) => {
    const bal = getGroupBalance(item);
    const isSettled = bal === 0 && item.expenses.length > 0;

    return (
      <TouchableOpacity
        onPress={() => router.push(`/group/${item.id}`)}
        activeOpacity={0.7}
      >
        <Card style={styles.groupCard}>
          <View style={[styles.groupEmojiBox, { backgroundColor: getGroupIconBg(item.name) }]}>
            <Text style={styles.groupEmoji}>{item.emoji}</Text>
          </View>
          <View style={styles.groupInfo}>
            <Text style={styles.groupName}>{item.name}</Text>
            <Text style={styles.groupMeta}>
              {item.members.length} member{item.members.length !== 1 ? 's' : ''}
            </Text>
          </View>
          <View style={styles.groupBalContainer}>
            {isSettled ? (
              <>
                <Text style={styles.groupBalNeutral}>All Settled</Text>
                <Text style={styles.groupBalSub}>0.00</Text>
              </>
            ) : (
              <>
                <Text style={[styles.groupBalAmount, { color: bal > 0 ? '#10B981' : '#EF4444' }]}>
                  {bal > 0 ? '+' : ''}{bal.toFixed(2)}
                </Text>
                <Text style={styles.groupBalSub}>USDC</Text>
              </>
            )}
          </View>
          <Ionicons name="chevron-forward" size={20} color={COLORS.text.tertiary} />
        </Card>
      </TouchableOpacity>
    );
  };

  if (groups.length === 0) {
    return (
      <View style={[styles.container, { paddingTop: insets.top + SPACING.lg }]}>
        <View style={styles.header}>
          <TouchableOpacity
            onPress={() => router.back()}
            style={styles.backBtn}
            activeOpacity={0.7}
          >
            <Ionicons name="arrow-back" size={24} color={COLORS.bg.dark} />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>All Groups</Text>
        </View>
        <EmptyState
          emoji="📁"
          title="No groups yet"
          subtitle="Create one to start splitting!"
          action={
            <Button
              title="Create Group"
              onPress={() => router.push('/group/create')}
            />
          }
        />
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <View style={[styles.headerWrap, { paddingTop: insets.top + SPACING.lg }]}>
        <View style={styles.header}>
          <TouchableOpacity
            onPress={() => router.back()}
            style={styles.backBtn}
            activeOpacity={0.7}
          >
            <Ionicons name="arrow-back" size={24} color={COLORS.bg.dark} />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>All Groups</Text>
        </View>
        <View style={styles.searchWrap}>
          <View style={styles.searchRow}>
            <Ionicons name="search-outline" size={20} color={COLORS.text.tertiary} style={styles.searchIcon} />
            <Input
              placeholder="Search groups..."
              value={query}
              onChangeText={setQuery}
              containerStyle={styles.searchInput}
              style={styles.searchInputField}
            />
          </View>
        </View>
      </View>

      <FlatList
        data={filteredGroups}
        keyExtractor={(item) => item.id}
        renderItem={renderGroupCard}
        contentContainerStyle={styles.list}
        showsVerticalScrollIndicator={false}
        ListEmptyComponent={
          <EmptyState
            emoji="🔎"
            title="No matches"
            subtitle="Try a different search term."
          />
        }
      />

      <TouchableOpacity
        style={styles.fab}
        onPress={() => {
          Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
          router.push('/group/create');
        }}
        activeOpacity={0.8}
      >
        <Ionicons name="add" size={28} color={COLORS.text.white} />
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: 'transparent',
  },
  headerWrap: {
    paddingHorizontal: SPACING.xl,
    paddingBottom: SPACING.md,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: SPACING.md,
  },
  backBtn: {
    width: 44,
    height: 44,
    borderRadius: 22,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: SPACING.sm,
  },
  headerTitle: {
    color: COLORS.bg.dark,
    fontSize: 22,
    fontWeight: FONT.weight.bold,
  },
  searchWrap: {
    marginBottom: SPACING.sm,
  },
  searchRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  searchIcon: {
    position: 'absolute',
    left: SPACING.lg + 4,
    zIndex: 1,
  },
  searchInput: {
    marginBottom: 0,
    flex: 1,
  },
  searchInputField: {
    paddingLeft: 36,
  },
  list: {
    paddingHorizontal: SPACING.xl,
    paddingBottom: TAB_BAR_HEIGHT + 80,
    gap: 8,
  },
  groupCard: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: SPACING.lg,
  },
  groupEmojiBox: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: SPACING.md,
  },
  groupEmoji: {
    fontSize: 18,
  },
  groupInfo: {
    flex: 1,
  },
  groupName: {
    color: COLORS.bg.dark,
    fontSize: 16,
    fontWeight: FONT.weight.bold,
  },
  groupMeta: {
    color: COLORS.text.secondary,
    fontSize: 12,
    marginTop: 2,
  },
  groupBalContainer: {
    alignItems: 'flex-end',
    marginRight: SPACING.sm,
  },
  groupBalAmount: {
    fontSize: 16,
    fontWeight: FONT.weight.bold,
  },
  groupBalNeutral: {
    fontSize: 14,
    fontWeight: FONT.weight.bold,
    color: COLORS.text.tertiary,
  },
  groupBalSub: {
    color: COLORS.text.secondary,
    fontSize: 10,
    marginTop: 2,
  },
  fab: {
    position: 'absolute',
    bottom: TAB_BAR_HEIGHT + SPACING.xxl,
    right: SPACING.xl,
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: COLORS.bg.accent,
    alignItems: 'center',
    justifyContent: 'center',
    ...SHADOWS.float,
    zIndex: 20,
  },
});
