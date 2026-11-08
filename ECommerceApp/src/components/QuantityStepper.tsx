import React from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { colors, radius } from '../constants/theme';

interface QuantityStepperProps {
  value: number;
  onChange: (value: number) => void;
  min?: number;
  max?: number;
}

/** Nút tăng/giảm số lượng, chặn đúng min/max. */
export function QuantityStepper({ value, onChange, min = 1, max = 10 }: QuantityStepperProps) {
  const decrease = () => onChange(Math.max(min, value - 1));
  const increase = () => onChange(Math.min(max, value + 1));

  return (
    <View style={styles.container}>
      <Pressable
        onPress={decrease}
        disabled={value <= min}
        style={({ pressed }) => [styles.button, pressed && styles.pressed]}
        accessibilityRole="button"
        accessibilityLabel="Giảm số lượng"
      >
        <Ionicons name="remove" size={16} color={value <= min ? colors.grayLight : colors.dark} />
      </Pressable>

      <Text style={styles.value}>{value}</Text>

      <Pressable
        onPress={increase}
        disabled={value >= max}
        style={({ pressed }) => [styles.button, pressed && styles.pressed]}
        accessibilityRole="button"
        accessibilityLabel="Tăng số lượng"
      >
        <Ionicons name="add" size={16} color={value >= max ? colors.grayLight : colors.dark} />
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    height: 34,
    borderRadius: radius.md,
    backgroundColor: '#F2F4F7',
    paddingHorizontal: 2,
  },
  button: {
    width: 30,
    height: 30,
    alignItems: 'center',
    justifyContent: 'center',
  },
  value: {
    minWidth: 20,
    textAlign: 'center',
    fontSize: 14,
    fontWeight: '700',
    color: colors.dark,
  },
  pressed: { opacity: 0.6 },
});
