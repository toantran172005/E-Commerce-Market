import React from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { colors, spacing } from '../constants/theme';

interface SectionHeaderProps {
  title: string;
  meta?: string;
  actionLabel?: string;
  onAction?: () => void;
}

/** Tiêu đề section + meta bên phải, có thể kèm nút hành động. */
export function SectionHeader({ title, meta, actionLabel, onAction }: SectionHeaderProps) {
  return (
    <View style={styles.container}>
      <Text style={styles.title}>{title}</Text>
      {actionLabel && onAction ? (
        <Pressable onPress={onAction} hitSlop={8} accessibilityRole="button" accessibilityLabel={actionLabel}>
          <Text style={styles.actionLabel}>{actionLabel}</Text>
        </Pressable>
      ) : meta ? (
        <Text style={styles.meta}>{meta}</Text>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: spacing.md,
  },
  title: {
    fontSize: 17,
    fontWeight: '800',
    color: colors.dark,
    letterSpacing: -0.3,
  },
  meta: {
    fontSize: 13,
    fontWeight: '500',
    color: colors.textMuted,
  },
  actionLabel: {
    fontSize: 13,
    fontWeight: '700',
    color: colors.primary,
  },
});
