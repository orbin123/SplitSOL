import React from 'react';
import { View, TouchableOpacity, StyleSheet } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import Ionicons from '@expo/vector-icons/Ionicons';
import { COLORS } from '@/utils/constants';

const VISIBLE_TABS = ['home', 'activity', 'wallet', 'profile'];

const TAB_ICONS: Record<string, [string, string]> = {
  home: ['home', 'home-outline'],
  activity: ['stats-chart', 'stats-chart-outline'],
  wallet: ['wallet', 'wallet-outline'],
  profile: ['person', 'person-outline'],
};

export function FloatingTabBar({ state, descriptors, navigation }: any) {
  const insets = useSafeAreaInsets();
  const bottomPadding = Math.max(insets.bottom, 16);

  return (
    <View style={[styles.container, { paddingBottom: bottomPadding }]}>
      <View style={styles.bar}>
        {state.routes.map((route: any, index: number) => {
          if (!VISIBLE_TABS.includes(route.name)) return null;

          const isFocused = state.index === index;
          const icons = TAB_ICONS[route.name];
          if (!icons) return null;

          const onPress = () => {
            const event = navigation.emit({
              type: 'tabPress',
              target: route.key,
              canPreventDefault: true,
            });
            if (!isFocused && !event.defaultPrevented) {
              navigation.navigate(route.name);
            }
          };

          return (
            <TouchableOpacity
              key={route.key}
              onPress={onPress}
              style={styles.tab}
              activeOpacity={0.7}
            >
              <View
                style={[
                  styles.iconWrap,
                  isFocused && styles.iconWrapActive,
                ]}
              >
                <Ionicons
                  name={(isFocused ? icons[0] : icons[1]) as any}
                  size={22}
                  color={isFocused ? COLORS.bg.accent : COLORS.text.tertiary}
                />
              </View>
            </TouchableOpacity>
          );
        })}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    alignItems: 'center',
    paddingHorizontal: 40,
  },
  bar: {
    flexDirection: 'row',
    backgroundColor: COLORS.bg.secondary,
    borderRadius: 32,
    paddingVertical: 6,
    paddingHorizontal: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.1,
    shadowRadius: 24,
    elevation: 12,
    width: '100%',
  },
  tab: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 4,
  },
  iconWrap: {
    width: 48,
    height: 48,
    borderRadius: 24,
    alignItems: 'center',
    justifyContent: 'center',
  },
  iconWrapActive: {
    backgroundColor: COLORS.bg.accentSoft,
  },
});
