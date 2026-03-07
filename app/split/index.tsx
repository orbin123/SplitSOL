import React from 'react';
import {
  FlatList,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { useRouter } from 'expo-router';
import * as Haptics from 'expo-haptics';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import Ionicons from '@expo/vector-icons/Ionicons';
import { useAppStore } from '@/store/useAppStore';
import { Card } from '@/components/ui/Card';
import { EmptyState } from '@/components/ui/EmptyState';
import { Button } from '@/components/ui/Button';
import { COLORS, FONT, RADIUS, SPACING } from '@/utils/constants';
import { Group } from '@/store/types';

export default function SplitGroupPickerScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const groups = useAppStore((s) => s.groups);

  const renderGroup = ({ item }: { item: Group }) => (
    <Card
      onPress={() => router.replace(`/group/${item.id}/add-split` as any)}
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

  return (
    <View style={styles.container}>
      {groups.length === 0 ? (
        <EmptyState
          emoji="👥"
          title="No groups yet"
          subtitle="Create a group first before adding a split."
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
            { paddingTop: insets.top + SPACING.lg },
          ]}
          ListHeaderComponent={
            <View style={styles.header}>
              <Text style={styles.title}>Choose a Group</Text>
              <Text style={styles.subtitle}>
                Pick where you want to add the next split.
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
    backgroundColor: COLORS.bg.primary,
  },
  list: {
    paddingHorizontal: SPACING.xl,
    paddingBottom: SPACING.xxxl,
    gap: SPACING.sm,
  },
  header: {
    marginBottom: SPACING.lg,
  },
  title: {
    color: COLORS.text.primary,
    fontSize: FONT.size.xxl,
    fontWeight: FONT.weight.bold,
  },
  subtitle: {
    color: COLORS.text.secondary,
    fontSize: FONT.size.md,
    marginTop: SPACING.xs,
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
    borderRadius: RADIUS.md,
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
    fontWeight: FONT.weight.semibold,
  },
  groupMeta: {
    color: COLORS.text.secondary,
    fontSize: FONT.size.sm,
    marginTop: 2,
  },
});
