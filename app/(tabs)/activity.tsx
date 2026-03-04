import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  SectionList,
  TouchableOpacity,
} from 'react-native';
import { useRouter } from 'expo-router';
import * as Linking from 'expo-linking';
import { useAppStore } from '@/store/useAppStore';
import { Card } from '@/components/ui/Card';
import { EmptyState } from '@/components/ui/EmptyState';
import { Avatar } from '@/components/ui/Avatar';
import { formatCurrency, timeAgo, truncateAddress } from '@/utils/formatters';
import { COLORS, SPACING, FONT, RADIUS, TAB_BAR_HEIGHT } from '@/utils/constants';
import { Settlement, Group, Member } from '@/store/types';

interface ActivityItem extends Settlement {
  groupName: string;
  groupEmoji: string;
  fromMember: Member | undefined;
  toMember: Member | undefined;
}

function buildActivityItems(groups: Group[]): ActivityItem[] {
  const items: ActivityItem[] = [];
  for (const group of groups) {
    for (const s of group.settlements) {
      items.push({
        ...s,
        groupName: group.name,
        groupEmoji: group.emoji,
        fromMember: group.members.find((m) => m.id === s.from),
        toMember: group.members.find((m) => m.id === s.to),
      });
    }
  }
  items.sort(
    (a, b) =>
      new Date(b.settledAt ?? b.id).getTime() -
      new Date(a.settledAt ?? a.id).getTime(),
  );
  return items;
}

function groupByDate(items: ActivityItem[]) {
  const map = new Map<string, ActivityItem[]>();
  for (const item of items) {
    const d = item.settledAt
      ? new Date(item.settledAt).toLocaleDateString('en-US', {
          month: 'short',
          day: 'numeric',
          year: 'numeric',
        })
      : 'Unknown';
    if (!map.has(d)) map.set(d, []);
    map.get(d)!.push(item);
  }
  return Array.from(map.entries()).map(([title, data]) => ({ title, data }));
}

export default function Activity() {
  const router = useRouter();
  const groups = useAppStore((s) => s.groups);

  const items = buildActivityItems(groups);
  const sections = groupByDate(items);

  if (items.length === 0) {
    return (
      <View style={styles.container}>
        <EmptyState
          emoji="📋"
          title="No activity yet"
          subtitle="Settled payments will appear here."
        />
      </View>
    );
  }

  const renderItem = ({ item }: { item: ActivityItem }) => {
    const isConfirmed = item.status === 'confirmed';
    const fromName = item.fromMember?.name ?? 'Unknown';
    const toName = item.toMember?.name ?? 'Unknown';

    return (
      <Card
        style={styles.card}
        onPress={
          item.txSignature
            ? () =>
                router.push(
                  `/tx/${item.txSignature}?groupId=${item.groupId}`,
                )
            : undefined
        }
      >
        <View style={styles.cardRow}>
          <Avatar name={fromName} size={36} />
          <View style={styles.cardInfo}>
            <Text style={styles.cardTitle}>
              {fromName} settled {formatCurrency(item.amount)} with {toName}
            </Text>
            <Text style={styles.cardMeta}>
              {item.groupEmoji} {item.groupName} ·{' '}
              {item.settledAt ? timeAgo(item.settledAt) : ''}
            </Text>
          </View>
          <View style={styles.cardRight}>
            <Text style={styles.cardAmount}>
              {formatCurrency(item.amount)}
            </Text>
            <View
              style={[
                styles.statusBadge,
                isConfirmed ? styles.statusConfirmed : styles.statusPending,
              ]}
            >
              <Text
                style={[
                  styles.statusText,
                  isConfirmed
                    ? styles.statusTextConfirmed
                    : styles.statusTextPending,
                ]}
              >
                {item.status}
              </Text>
            </View>
          </View>
        </View>

        {item.txSignature && (
          <TouchableOpacity
            style={styles.sigRow}
            onPress={() => {
              if (item.explorerUrl) Linking.openURL(item.explorerUrl);
            }}
            activeOpacity={0.6}
          >
            <Text style={styles.sigLabel}>tx:</Text>
            <Text style={styles.sigValue}>
              {truncateAddress(item.txSignature, 8)}
            </Text>
          </TouchableOpacity>
        )}
      </Card>
    );
  };

  return (
    <View style={styles.container}>
      <SectionList
        sections={sections}
        keyExtractor={(item) => item.id}
        renderItem={renderItem}
        renderSectionHeader={({ section }) => (
          <Text style={styles.sectionHeader}>{section.title}</Text>
        )}
        contentContainerStyle={styles.list}
        showsVerticalScrollIndicator={false}
        stickySectionHeadersEnabled={false}
      />
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
    paddingBottom: TAB_BAR_HEIGHT + SPACING.lg,
    gap: SPACING.sm,
  },
  sectionHeader: {
    color: COLORS.text.tertiary,
    fontSize: FONT.size.xs,
    fontWeight: FONT.weight.semibold,
    textTransform: 'uppercase',
    letterSpacing: 1,
    marginTop: SPACING.lg,
    marginBottom: SPACING.sm,
  },

  card: {
    gap: SPACING.sm,
  },
  cardRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING.md,
  },
  cardInfo: {
    flex: 1,
  },
  cardTitle: {
    color: COLORS.text.primary,
    fontSize: FONT.size.md,
    fontWeight: FONT.weight.medium,
  },
  cardMeta: {
    color: COLORS.text.secondary,
    fontSize: FONT.size.sm,
    marginTop: 2,
  },
  cardRight: {
    alignItems: 'flex-end',
    gap: SPACING.xs,
  },
  cardAmount: {
    color: COLORS.text.success,
    fontSize: FONT.size.md,
    fontWeight: FONT.weight.bold,
  },
  statusBadge: {
    paddingHorizontal: SPACING.sm,
    paddingVertical: 2,
    borderRadius: RADIUS.sm,
  },
  statusConfirmed: {
    backgroundColor: 'rgba(16, 185, 129, 0.12)',
  },
  statusPending: {
    backgroundColor: 'rgba(245, 158, 11, 0.12)',
  },
  statusText: {
    fontSize: FONT.size.xs,
    fontWeight: FONT.weight.semibold,
    textTransform: 'capitalize',
  },
  statusTextConfirmed: {
    color: COLORS.text.success,
  },
  statusTextPending: {
    color: COLORS.bg.warning,
  },

  sigRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING.xs,
    paddingTop: SPACING.xs,
    borderTopWidth: 1,
    borderTopColor: COLORS.border.default,
  },
  sigLabel: {
    color: COLORS.text.tertiary,
    fontSize: FONT.size.xs,
    fontWeight: FONT.weight.medium,
  },
  sigValue: {
    color: COLORS.text.accent,
    fontSize: FONT.size.xs,
    fontWeight: FONT.weight.medium,
  },
});
