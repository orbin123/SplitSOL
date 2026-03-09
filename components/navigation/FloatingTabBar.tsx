import React from 'react';
import { View, TouchableOpacity, StyleSheet } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import Ionicons from '@expo/vector-icons/Ionicons';
import { COLORS, SHADOWS } from '@/utils/constants';

const VISIBLE_TABS = ['home', 'activity', 'wallet', 'profile'];

const TAB_ICONS: Record<string, [string, string]> = {
  home: ['home', 'home-outline'],
  activity: ['receipt', 'receipt-outline'],
  wallet: ['wallet', 'wallet-outline'],
  profile: ['person', 'person-outline'],
};

export function FloatingTabBar({ state, descriptors, navigation }: any) {
  const insets = useSafeAreaInsets();
  const bottomPadding = Math.max(insets.bottom, 16) + 8;

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
                  color={isFocused ? '#FFFFFF' : '#9CA3AF'}
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
    paddingHorizontal: 24,
  },
  bar: {
    flexDirection: 'row',
    backgroundColor: 'rgba(255, 255, 255, 0.95)',
    borderRadius: 36,
    paddingVertical: 8,
    paddingHorizontal: 16,
    borderWidth: 1,
    borderColor: 'rgba(229, 231, 235, 1)',
    width: '100%',
    ...SHADOWS.float,
  },
  tab: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 4,
  },
  iconWrap: {
    width: 44,
    height: 44,
    borderRadius: 22,
    alignItems: 'center',
    justifyContent: 'center',
  },
  iconWrapActive: {
    backgroundColor: '#7C3AED',
    borderRadius: 22,
  },
});
