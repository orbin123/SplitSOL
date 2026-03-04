import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { getInitials, stringToColor } from '@/utils/formatters';
import { FONT } from '@/utils/constants';

interface AvatarProps {
  name: string;
  size?: number;
  color?: string;
}

export const Avatar: React.FC<AvatarProps> = ({
  name, size = 40, color,
}) => {
  const bgColor = color || stringToColor(name);
  const fontSize = size * 0.4;

  return (
    <View style={[
      styles.container,
      {
        width: size, height: size, borderRadius: size / 2,
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
  text: {
    color: '#FFFFFF',
    fontWeight: FONT.weight.bold,
  },
});