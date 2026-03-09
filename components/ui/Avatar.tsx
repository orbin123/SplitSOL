import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { getInitials, stringToColor } from '@/utils/formatters';
import { FONT, COLORS } from '@/utils/constants';

interface AvatarProps {
  name: string;
  size?: number;
  color?: string;
}

const DEFAULT_SIZE = 44;

export const Avatar: React.FC<AvatarProps> = ({
  name, size = DEFAULT_SIZE, color,
}) => {
  const bgColor = color || stringToColor(name);
  const fontSize = size * 0.4;

  return (
    <View style={[
      styles.container,
      styles.border,
      styles.shadow,
      {
        width: size,
        height: size,
        borderRadius: size / 2,
        backgroundColor: bgColor,
      },
    ]}>
      <Text style={[styles.text, { fontSize }]}>
        {getInitials(name)}
      </Text>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  border: {
    borderWidth: 2,
    borderColor: '#FFFFFF',
  },
  shadow: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 4,
    elevation: 3,
  },
  text: {
    color: COLORS.bg.dark,
    fontWeight: FONT.weight.bold,
  },
});