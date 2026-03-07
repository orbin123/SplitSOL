import React, { useMemo, useState } from 'react';
import {
  Alert,
  FlatList,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import { useRouter } from 'expo-router';
import * as Haptics from 'expo-haptics';
import Ionicons from '@expo/vector-icons/Ionicons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useAppStore } from '@/store/useAppStore';
import { Avatar } from '@/components/ui/Avatar';
import { Button } from '@/components/ui/Button';
import { EmptyState } from '@/components/ui/EmptyState';
import { truncateAddress } from '@/utils/formatters';
import { COLORS, FONT, RADIUS, SPACING, TAB_BAR_HEIGHT } from '@/utils/constants';

export default function MembersScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const members = useAppStore((s) => s.members);
  const toggleFavorite = useAppStore((s) => s.toggleFavorite);
  const removeMemberFromList = useAppStore((s) => s.removeMemberFromList);
  const [query, setQuery] = useState('');

  const filteredMembers = useMemo(() => {
    const search = query.trim().toLowerCase();

    return [...members]
      .filter((member) => {
        if (!search) return true;
        return (
          member.name.toLowerCase().includes(search) ||
          member.walletAddress.toLowerCase().includes(search)
        );
      })
      .sort((a, b) => {
        if (a.isFavorite !== b.isFavorite) {
          return a.isFavorite ? -1 : 1;
        }

        return a.name.localeCompare(b.name);
      });
  }, [members, query]);

  const confirmRemove = (id: string, name: string) => {
    Alert.alert('Remove Member', `Remove ${name} from your members?`, [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Remove',
        style: 'destructive',
        onPress: () => removeMemberFromList(id),
      },
    ]);
  };

  return (
    <View style={styles.container}>
      <View style={styles.searchWrap}>
        <View style={styles.searchInputWrap}>
          <Ionicons
            name="search-outline"
            size={18}
            color={COLORS.text.tertiary}
          />
          <TextInput
            style={styles.searchInput}
            placeholder="Search members"
            placeholderTextColor={COLORS.text.tertiary}
            value={query}
            onChangeText={setQuery}
            autoCapitalize="none"
            autoCorrect={false}
          />
        </View>
      </View>

      <FlatList
        data={filteredMembers}
        keyExtractor={(item) => item.id}
        contentContainerStyle={[
          styles.listContent,
          { paddingBottom: TAB_BAR_HEIGHT + SPACING.xxxl },
          filteredMembers.length === 0 && styles.emptyContent,
        ]}
        ListEmptyComponent={
          members.length === 0 ? (
            <EmptyState
              emoji="👥"
              title="No members yet"
              subtitle="Scan another SplitSOL member&apos;s QR code to build your member list."
              action={
                <Button
                  title="Add Member"
                  onPress={() => router.push('/members/scan' as any)}
                />
              }
            />
          ) : (
            <EmptyState
              emoji="🔎"
              title="No matches"
              subtitle="Try a different name or wallet address."
            />
          )
        }
        renderItem={({ item }) => (
          <TouchableOpacity
            style={styles.row}
            activeOpacity={0.75}
            onPress={() => router.push(`/members/${item.id}` as any)}
            onLongPress={() => confirmRemove(item.id, item.name)}
          >
            <Avatar name={item.name} size={48} />
            <View style={styles.rowCopy}>
              <Text style={styles.name}>{item.name}</Text>
              <Text style={styles.address}>
                {truncateAddress(item.walletAddress, 6)}
              </Text>
            </View>
            <TouchableOpacity
              style={styles.starButton}
              onPress={() => {
                toggleFavorite(item.id);
                Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
              }}
              hitSlop={12}
            >
              <Ionicons
                name={item.isFavorite ? 'star' : 'star-outline'}
                size={22}
                color={
                  item.isFavorite ? COLORS.bg.warning : COLORS.text.tertiary
                }
              />
            </TouchableOpacity>
          </TouchableOpacity>
        )}
      />

      <TouchableOpacity
        style={[styles.fab, { bottom: Math.max(insets.bottom, 20) + 88 }]}
        activeOpacity={0.85}
        onPress={() => router.push('/members/scan' as any)}
      >
        <Ionicons name="qr-code-outline" size={22} color={COLORS.text.white} />
        <Text style={styles.fabText}>Add Member</Text>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.bg.primary,
  },
  searchWrap: {
    paddingHorizontal: SPACING.xl,
    paddingBottom: SPACING.md,
  },
  searchInputWrap: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING.sm,
    backgroundColor: COLORS.bg.secondary,
    borderRadius: RADIUS.md,
    paddingHorizontal: SPACING.lg,
    paddingVertical: SPACING.md,
    borderWidth: 1,
    borderColor: COLORS.border.default,
  },
  searchInput: {
    flex: 1,
    color: COLORS.text.primary,
    fontSize: FONT.size.md,
  },
  listContent: {
    paddingHorizontal: SPACING.xl,
    gap: SPACING.sm,
  },
  emptyContent: {
    flexGrow: 1,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING.md,
    backgroundColor: COLORS.bg.secondary,
    borderRadius: RADIUS.lg,
    padding: SPACING.lg,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06,
    shadowRadius: 8,
    elevation: 3,
  },
  rowCopy: {
    flex: 1,
  },
  name: {
    color: COLORS.text.primary,
    fontSize: FONT.size.md,
    fontWeight: FONT.weight.semibold,
  },
  address: {
    color: COLORS.text.secondary,
    fontSize: FONT.size.sm,
    marginTop: 2,
  },
  starButton: {
    padding: SPACING.xs,
  },
  fab: {
    position: 'absolute',
    right: SPACING.xl,
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING.sm,
    backgroundColor: COLORS.bg.accent,
    borderRadius: RADIUS.full,
    paddingHorizontal: SPACING.xl,
    paddingVertical: SPACING.md,
    shadowColor: COLORS.bg.accent,
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.28,
    shadowRadius: 12,
    elevation: 8,
  },
  fabText: {
    color: COLORS.text.white,
    fontSize: FONT.size.md,
    fontWeight: FONT.weight.semibold,
  },
});
