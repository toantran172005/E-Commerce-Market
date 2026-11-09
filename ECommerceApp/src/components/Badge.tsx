import React from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { colors, radius } from '../constants/theme';

type BadgeVariant = 'primary' | 'success' | 'danger' | 'warning' | 'dark';

interface BadgeProps {
  label: string;
  variant?: BadgeVariant;
}

const VARIANTS: Record<BadgeVariant, { bg: string; text: string }> = {
  primary: { bg: colors.primarySoft, text: colors.primary },
  success: { bg: colors.successSoft, text: colors.success },
  danger: { bg: colors.dangerSoft, text: colors.danger },
  warning: { bg: colors.warningSoft, text: '#B45309' },
  dark: { bg: colors.dark, text: colors.white },
};

/** Nhãn trạng thái nhỏ. */
export function Badge({ label, variant = 'primary' }: BadgeProps) {
  const palette = VARIANTS[variant];
  return (
    <View style={[styles.badge, { backgroundColor: palette.bg }]}>
      <Text style={[styles.label, { color: palette.text }]}>{label}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  badge: {
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: radius.sm,
    alignSelf: 'flex-start',
  },
  label: {
    fontSize: 10.5,
    fontWeight: '800',
    letterSpacing: 0.4,
  },
});
