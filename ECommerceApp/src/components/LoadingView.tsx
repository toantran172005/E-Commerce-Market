import React from 'react';
import { ActivityIndicator, StyleSheet, Text, View } from 'react-native';
import { colors, spacing } from '../constants/theme';

interface LoadingViewProps {
  label?: string;
}

/** Màn loading trung tâm đơn giản. */
export function LoadingView({ label = 'Đang tải...' }: LoadingViewProps) {
  return (
    <View style={styles.container} accessibilityLabel={label}>
      <ActivityIndicator size="large" color={colors.primary} />
      <Text style={styles.label}>{label}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.background,
  },
  label: {
    marginTop: spacing.md,
    fontSize: 13.5,
    color: colors.textMuted,
    fontWeight: '500',
  },
});
