import React from 'react';
import {
  View,
  Text,
  FlatList,
  StyleSheet,
  TouchableOpacity,
} from 'react-native';
import { useRouter } from 'expo-router';
import { useAppStore } from '@/store/useAppStore';
import { Card } from '@/components/ui/Card';
import { EmptyState } from '@/components/ui/EmptyState';
import { Button } from '@/components/ui/Button';
import { Avatar } from '@/components/ui/Avatar';
import { formatCurrency } from '@/utils/formatters';
import { getTotalExpenses } from '@/utils/calculations';
import { COLORS, SPACING, FONT, RADIUS } from '@/utils/constants';
import { Group } from '@/store/types';

export default function Groups() {
  const router = useRouter();
  const groups = useAppStore((s) => s.groups);

  const renderGroupCard = ({ item }: { item: Group }) => {
    const total = getTotalExpenses(item.expenses);

    return (
      <Card
        onPress={() => router.push(`/group/${item.id}`)}
        style={styles.card}
      >
        <View style={styles.cardHeader}>
          <Text style={styles.cardEmoji}>{item.emoji}</Text>
          <View style={styles.cardInfo}>
            <Text style={styles.cardName}>{item.name}</Text>
            <Text style={styles.cardMeta}>
              {item.members.length} member{item.members.length !== 1 ? 's' : ''}
            </Text>
          </View>
          <Text style={styles.cardTotal}>{formatCurrency(total)}</Text>
        </View>

        <View style={styles.avatarRow}>
          {item.members.slice(0, 5).map((member) => (
            <View key={member.id} style={styles.avatarWrap}>
              <Avatar name={member.name} size={28} />
            </View>
          ))}
          {item.members.length > 5 && (
            <View style={[styles.avatarWrap, styles.avatarMore]}>
              <Text style={styles.avatarMoreText}>
                +{item.members.length - 5}
              </Text>
            </View>
          )}
        </View>
      </Card>
    );
  };

  if (groups.length === 0) {
    return (
      <View style={styles.container}>
        <EmptyState
          emoji="👥"
          title="No groups yet"
          subtitle="Create your first group to start splitting expenses with friends."
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
      <FlatList
        data={groups}
        keyExtractor={(item) => item.id}
        renderItem={renderGroupCard}
        contentContainerStyle={styles.list}
        showsVerticalScrollIndicator={false}
      />

      <TouchableOpacity
        style={styles.fab}
        onPress={() => router.push('/group/create')}
        activeOpacity={0.8}
      >
        <Text style={styles.fabText}>+</Text>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.bg.primary,
  },
  list: {
    padding: SPACING.lg,
    gap: SPACING.md,
  },
  card: {
    gap: SPACING.md,
  },
  cardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  cardEmoji: {
    fontSize: 32,
    marginRight: SPACING.md,
  },
  cardInfo: {
    flex: 1,
  },
  cardName: {
    color: COLORS.text.primary,
    fontSize: FONT.size.lg,
    fontWeight: FONT.weight.semibold,
  },
  cardMeta: {
    color: COLORS.text.secondary,
    fontSize: FONT.size.sm,
    marginTop: 2,
  },
  cardTotal: {
    color: COLORS.text.accent,
    fontSize: FONT.size.md,
    fontWeight: FONT.weight.semibold,
  },
  avatarRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  avatarWrap: {
    marginRight: -6,
  },
  avatarMore: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: COLORS.bg.tertiary,
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarMoreText: {
    color: COLORS.text.secondary,
    fontSize: FONT.size.xs,
    fontWeight: FONT.weight.medium,
  },
  fab: {
    position: 'absolute',
    bottom: 24,
    right: 24,
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: COLORS.bg.accent,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: COLORS.bg.accent,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.4,
    shadowRadius: 8,
    elevation: 8,
  },
  fabText: {
    color: COLORS.text.primary,
    fontSize: 28,
    fontWeight: FONT.weight.bold,
    lineHeight: 30,
  },
});
