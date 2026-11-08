import React from 'react';
import { ActivityIndicator, Pressable, StyleSheet, Text, ViewStyle } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { colors, radius, spacing } from '../constants/theme';

type IconName = keyof typeof Ionicons.glyphMap;

interface ButtonProps {
  title: string;
  onPress?: () => void;
  loading?: boolean;
  disabled?: boolean;
  icon?: IconName;
  style?: ViewStyle;
}

/** Nút chính màu primary. */
export function PrimaryButton({ title, onPress, loading, disabled, icon, style }: ButtonProps) {
  const isDisabled = disabled || loading;
  return (
    <Pressable
      onPress={onPress}
      disabled={isDisabled}
      style={({ pressed }) => [
        styles.button,
        styles.primaryButton,
        isDisabled && styles.disabled,
        pressed && styles.pressed,
        style,
      ]}
      accessibilityRole="button"
      accessibilityLabel={title}
      accessibilityState={{ disabled: isDisabled, busy: loading }}
    >
      {loading ? (
        <ActivityIndicator color={colors.white} />
      ) : (
        <>
          <Text style={styles.primaryText}>{title}</Text>
          {icon ? <Ionicons name={icon} size={18} color={colors.white} style={styles.icon} /> : null}
        </>
      )}
    </Pressable>
  );
}

/** Nút phụ: viền + nền trắng. */
export function SecondaryButton({ title, onPress, loading, disabled, icon, style }: ButtonProps) {
  const isDisabled = disabled || loading;
  return (
    <Pressable
      onPress={onPress}
      disabled={isDisabled}
      style={({ pressed }) => [
        styles.button,
        styles.secondaryButton,
        isDisabled && styles.disabled,
        pressed && styles.pressed,
        style,
      ]}
      accessibilityRole="button"
      accessibilityLabel={title}
      accessibilityState={{ disabled: isDisabled, busy: loading }}
    >
      {loading ? (
        <ActivityIndicator color={colors.primary} />
      ) : (
        <>
          {icon ? <Ionicons name={icon} size={18} color={colors.primary} style={styles.iconLeft} /> : null}
          <Text style={styles.secondaryText}>{title}</Text>
        </>
      )}
    </Pressable>
  );
}

const styles = StyleSheet.create({
  button: {
    height: 52,
    borderRadius: radius.lg,
    alignItems: 'center',
    justifyContent: 'center',
    flexDirection: 'row',
    paddingHorizontal: spacing.lg,
  },
  primaryButton: {
    backgroundColor: colors.primary,
    shadowColor: colors.primary,
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.28,
    shadowRadius: 12,
    elevation: 5,
  },
  secondaryButton: {
    backgroundColor: colors.card,
    borderWidth: 1,
    borderColor: colors.border,
  },
  primaryText: {
    color: colors.white,
    fontSize: 15.5,
    fontWeight: '800',
    letterSpacing: 0.2,
  },
  secondaryText: {
    color: colors.dark,
    fontSize: 15,
    fontWeight: '700',
  },
  icon: { marginLeft: spacing.sm },
  iconLeft: { marginRight: spacing.sm },
  disabled: { opacity: 0.55 },
  pressed: { opacity: 0.85 },
});
