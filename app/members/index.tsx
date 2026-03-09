import React, { useMemo, useState } from 'react';
import {
  Alert,
  FlatList,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import { useRouter } from 'expo-router';
import * as Haptics from 'expo-haptics';
import { LinearGradient } from 'expo-linear-gradient';
import Ionicons from '@expo/vector-icons/Ionicons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useAppStore } from '@/store/useAppStore';
import { EmptyState } from '@/components/ui/EmptyState';
import { SPACING, TAB_BAR_HEIGHT } from '@/utils/constants';
import { Member } from '@/types';

const AVATAR_COLORS = [
  { bg: '#FCE7F3', text: '#BE185D' }, // pink
  { bg: '#DBEAFE', text: '#1D4ED8' }, // blue
  { bg: '#D1FAE5', text: '#047857' }, // green
  { bg: '#FEF3C7', text: '#B45309' }, // yellow
  { bg: '#F3E8FF', text: '#7E22CE' }, // purple
  { bg: '#FFE4E6', text: '#BE123C' }, // rose
];

function getAvatarColors(name: string) {
  let hash = 0;
  for (let i = 0; i < name.length; i++) {
    hash = name.charCodeAt(i) + ((hash << 5) - hash);
  }
  return AVATAR_COLORS[Math.abs(hash) % AVATAR_COLORS.length];
}

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
      .sort((a, b) => a.name.localeCompare(b.name));
  }, [members, query]);

  const favorites = useMemo(
    () => filteredMembers.filter((m) => m.isFavorite),
    [filteredMembers],
  );

  const allMembers = filteredMembers;

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

  const renderMemberRow = (item: Member) => {
    const colors = getAvatarColors(item.name);
    const isConnected = !!item.walletAddress;
    return (
      <TouchableOpacity
        key={item.id}
        activeOpacity={0.75}
        onPress={() => {
          Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
          router.push(`/members/${item.id}` as any);
        }}
        onLongPress={() => confirmRemove(item.id, item.name)}
      >
        <View style={styles.memberCard}>
          <View style={[styles.memberAvatar, { backgroundColor: colors.bg }]}>
            <Text style={[styles.memberAvatarText, { color: colors.text }]}>
              {item.name.charAt(0).toUpperCase()}
            </Text>
          </View>
          <View style={styles.memberInfo}>
            <Text style={styles.memberName}>{item.name}</Text>
            <View style={styles.statusRow}>
              <View
                style={[
                  styles.statusDot,
                  { backgroundColor: isConnected ? '#10B981' : '#9CA3AF' },
                ]}
              />
              <Text
                style={[
                  styles.statusText,
                  { color: isConnected ? '#10B981' : '#9CA3AF' },
                ]}
              >
                {isConnected ? 'Connected' : 'No Wallet'}
              </Text>
            </View>
          </View>
        </View>
      </TouchableOpacity>
    );
  };

  return (
    <LinearGradient
      colors={['#FDCBEE', '#E7D4FC', '#C1E6F5']}
      style={styles.container}
      start={{ x: 0, y: 0 }}
      end={{ x: 1, y: 1 }}
    >
      <View style={[styles.inner, { paddingTop: insets.top + SPACING.lg }]}>
        {/* Header */}
        <Text style={styles.pageTitle}>My Members</Text>

        {/* Search Bar */}
        <View style={styles.searchInputWrap}>
          <Ionicons name="search-outline" size={18} color="#9CA3AF" />
          <TextInput
            style={styles.searchInput}
            placeholder="Search members..."
            placeholderTextColor="#9CA3AF"
            value={query}
            onChangeText={setQuery}
            autoCapitalize="none"
            autoCorrect={false}
          />
        </View>

        {members.length === 0 ? (
          <View style={styles.emptyWrap}>
            <EmptyState
              emoji="👥"
              title="Add your first member"
              subtitle="Scan another SplitSOL member's QR code to build your member list."
            />
          </View>
        ) : (
          <FlatList
            data={allMembers}
            keyExtractor={(item) => item.id}
            contentContainerStyle={[
              styles.listContent,
              { paddingBottom: TAB_BAR_HEIGHT + SPACING.xxxl },
            ]}
            ListHeaderComponent={
              <>
                {favorites.length > 0 && (
                  <View style={styles.favoritesSection}>
                    <Text style={styles.sectionTitle}>Favorites</Text>
                    <ScrollView
                      horizontal
                      showsHorizontalScrollIndicator={false}
                      contentContainerStyle={styles.favoritesScroll}
                    >
                      {favorites.map((item) => {
                        const colors = getAvatarColors(item.name);
                        return (
                          <TouchableOpacity
                            key={item.id}
                            style={styles.favoriteItem}
                            activeOpacity={0.75}
                            onPress={() => router.push(`/members/${item.id}` as any)}
                          >
                            <View style={styles.favoriteAvatarWrap}>
                              <View
                                style={[
                                  styles.favoriteAvatar,
                                  { backgroundColor: colors.bg },
                                ]}
                              >
                                <Text
                                  style={[
                                    styles.favoriteAvatarText,
                                    { color: colors.text },
                                  ]}
                                >
                                  {item.name.charAt(0).toUpperCase()}
                                </Text>
                              </View>
                              <View style={styles.starOverlay}>
                                <Text style={{ fontSize: 10 }}>⭐</Text>
                              </View>
                            </View>
                            <Text style={styles.favoriteName} numberOfLines={1}>
                              {item.name}
                            </Text>
                          </TouchableOpacity>
                        );
                      })}
                    </ScrollView>
                  </View>
                )}
                <Text style={styles.sectionTitle}>All Members</Text>
              </>
            }
            ListEmptyComponent={
              <EmptyState
                emoji="🔎"
                title="No matches"
                subtitle="Try a different name or wallet address."
              />
            }
            renderItem={({ item }) => renderMemberRow(item)}
            ItemSeparatorComponent={() => <View style={{ height: 12 }} />}
            showsVerticalScrollIndicator={false}
          />
        )}
      </View>

      {/* FAB */}
      <TouchableOpacity
        style={[styles.fab, { bottom: Math.max(insets.bottom, 20) + TAB_BAR_HEIGHT }]}
        activeOpacity={0.85}
        onPress={() => {
          Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
          router.push('/members/scan' as any);
        }}
      >
        <Ionicons name="add" size={28} color="#FFFFFF" />
      </TouchableOpacity>
    </LinearGradient>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  inner: {
    flex: 1,
    paddingHorizontal: SPACING.xl,
  },
  pageTitle: {
    fontSize: 32,
    fontWeight: '900',
    color: '#111827',
    marginBottom: 20,
    letterSpacing: -0.5,
  },
  searchInputWrap: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    backgroundColor: 'rgba(255, 255, 255, 0.65)',
    borderRadius: 50,
    paddingHorizontal: 18,
    paddingVertical: 14,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.8)',
    marginBottom: 24,
  },
  searchInput: {
    flex: 1,
    color: '#111827',
    fontSize: 16,
  },
  listContent: {
    gap: 0,
  },
  emptyWrap: {
    flex: 1,
    justifyContent: 'center',
  },
  favoritesSection: {
    marginBottom: 24,
  },
  sectionTitle: {
    color: '#111827',
    fontSize: 18,
    fontWeight: '800',
    marginBottom: 14,
  },
  favoritesScroll: {
    gap: 20,
    paddingRight: SPACING.xl,
    paddingBottom: 4,
  },
  favoriteItem: {
    alignItems: 'center',
    width: 70,
  },
  favoriteAvatarWrap: {
    position: 'relative',
  },
  favoriteAvatar: {
    width: 60,
    height: 60,
    borderRadius: 30,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 2,
    borderColor: 'rgba(255,255,255,0.8)',
  },
  favoriteAvatarText: {
    fontSize: 24,
    fontWeight: '800',
  },
  starOverlay: {
    position: 'absolute',
    bottom: -2,
    right: -2,
    width: 22,
    height: 22,
    borderRadius: 11,
    backgroundColor: 'rgba(255,255,255,0.9)',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.6)',
  },
  favoriteName: {
    color: '#111827',
    fontSize: 13,
    fontWeight: '700',
    marginTop: 8,
    textAlign: 'center',
  },
  memberCard: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    backgroundColor: 'rgba(255, 255, 255, 0.65)',
    borderRadius: 24,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.8)',
  },
  memberAvatar: {
    width: 52,
    height: 52,
    borderRadius: 26,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 16,
  },
  memberAvatarText: {
    fontSize: 22,
    fontWeight: '800',
  },
  memberInfo: {
    flex: 1,
  },
  memberName: {
    color: '#111827',
    fontSize: 17,
    fontWeight: '800',
    marginBottom: 4,
  },
  statusRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  statusDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
  },
  statusText: {
    fontSize: 14,
    fontWeight: '600',
  },
  fab: {
    position: 'absolute',
    right: SPACING.xl,
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: '#7C3AED',
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#7C3AED',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.35,
    shadowRadius: 14,
    elevation: 8,
  },
});
