import React from 'react';
import {
  FlatList,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { useRouter } from 'expo-router';
import Ionicons from '@expo/vector-icons/Ionicons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useAppStore } from '@/store/useAppStore';
import { Card } from '@/components/ui/Card';
import { EmptyState } from '@/components/ui/EmptyState';
import { Button } from '@/components/ui/Button';
import { COLORS, FONT, RADIUS, SPACING } from '@/utils/constants';
import { Group } from '@/types';
import { timeAgo } from '@/utils/formatters';

export default function SplitGroupPickerScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const groups = useAppStore((s) => s.groups);

  const getLastActivity = (group: Group) => {
    const expenses = group.expenses || [];
    const settlements = group.settlements || [];
    const all = [
      ...expenses.map((e) => e.createdAt),
      ...settlements.map((s) => s.settledAt),
    ];
    if (all.length === 0) return null;
    return all.sort().reverse()[0];
  };

  const renderGroup = ({ item }: { item: Group }) => {
    const lastActivity = getLastActivity(item);
    return (
      <Card
        onPress={() => router.push(`/group/${item.id}/add-split` as any)}
        style={styles.groupCard}
      >
        <View style={styles.groupRow}>
          <View style={styles.groupIcon}>
            <Text style={styles.groupEmoji}>{item.emoji}</Text>
          </View>
          <View style={styles.groupCopy}>
            <Text style={styles.groupName}>{item.name}</Text>
            <Text style={styles.groupMeta}>
              {item.members.length} member{item.members.length === 1 ? '' : 's'}
              {lastActivity ? ` · ${timeAgo(lastActivity)}` : ''}
            </Text>
          </View>
          <Ionicons
            name="chevron-forward"
            size={20}
            color={COLORS.text.tertiary}
          />
        </View>
      </Card>
    );
  };

  return (
    <View style={styles.container}>
      {groups.length === 0 ? (
        <EmptyState
          emoji="👥"
          title="Create a group first"
          subtitle="Create a group before adding a split."
          action={
            <Button
              title="Create Group"
              onPress={() => router.replace('/group/create')}
            />
          }
        />
      ) : (
        <FlatList
          data={groups}
          keyExtractor={(item) => item.id}
          renderItem={renderGroup}
          contentContainerStyle={[
            styles.list,
            { paddingTop: insets.top + SPACING.lg + 56 },
          ]}
          ListHeaderComponent={
            <View style={styles.header}>
              <Text style={styles.subtitle}>
                Which group is this expense for?
              </Text>
            </View>
          }
          showsVerticalScrollIndicator={false}
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: 'transparent',
  },
  list: {
    paddingHorizontal: SPACING.xl,
    paddingBottom: SPACING.xxxl,
    gap: SPACING.sm,
  },
  header: {
    marginBottom: SPACING.lg,
  },
  subtitle: {
    color: COLORS.text.secondary,
    fontSize: 14,
  },
  groupCard: {
    paddingVertical: SPACING.lg,
  },
  groupRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING.md,
  },
  groupIcon: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: COLORS.bg.accentSoft,
    alignItems: 'center',
    justifyContent: 'center',
  },
  groupEmoji: {
    fontSize: 24,
  },
  groupCopy: {
    flex: 1,
  },
  groupName: {
    color: COLORS.text.primary,
    fontSize: FONT.size.md,
    fontWeight: FONT.weight.bold,
  },
  groupMeta: {
    color: COLORS.text.secondary,
    fontSize: FONT.size.sm,
    marginTop: 2,
  },
});
