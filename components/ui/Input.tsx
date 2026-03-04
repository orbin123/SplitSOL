import React, { useState } from 'react';
import { TextInput, View, Text, StyleSheet, TextInputProps, ViewStyle } from 'react-native';
import { COLORS, SPACING, FONT, RADIUS } from '@/utils/constants';

interface InputProps extends TextInputProps {
  label?: string;
  error?: string;
  containerStyle?: ViewStyle;
}

export const Input: React.FC<InputProps> = ({
  label, error, containerStyle, style, ...props
}) => {
  const [focused, setFocused] = useState(false);

  return (
    <View style={containerStyle}>
      {label && <Text style={styles.label}>{label}</Text>}
      <TextInput
        style={[
          styles.input,
          focused && styles.inputFocused,
          error ? styles.inputError : undefined,
          style,
        ]}
        placeholderTextColor={COLORS.text.tertiary}
        selectionColor={COLORS.bg.accent}
        onFocus={(e) => {
          setFocused(true);
          props.onFocus?.(e);
        }}
        onBlur={(e) => {
          setFocused(false);
          props.onBlur?.(e);
        }}
        {...props}
      />
      {error && <Text style={styles.error}>{error}</Text>}
    </View>
  );
};
const styles = StyleSheet.create({
  label: {
    color: COLORS.text.secondary,
    fontSize: FONT.size.sm,
    fontWeight: FONT.weight.medium,
    marginBottom: SPACING.sm,
  },
  input: {
    backgroundColor: COLORS.bg.tertiary,
    color: COLORS.text.primary,
    fontSize: FONT.size.md,
    paddingHorizontal: SPACING.lg,
    paddingVertical: SPACING.md + 2,
    borderRadius: RADIUS.md,
    borderWidth: 1.5,
    borderColor: COLORS.border.default,
  },
  inputFocused: {
    borderColor: COLORS.border.focus,
  },
  inputError: {
    borderColor: COLORS.bg.danger,
  },
  error: {
    color: COLORS.text.danger,
    fontSize: FONT.size.xs,
    marginTop: SPACING.xs,
  },
});
