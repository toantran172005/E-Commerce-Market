import React from 'react';
import { StyleSheet, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { colors } from '../constants/theme';

interface RatingStarsProps {
  rating: number;
  size?: number;
}

/** Hiển thị 5 sao theo rating, hỗ trợ nửa sao. */
export function RatingStars({ rating, size = 14 }: RatingStarsProps) {
  const full = Math.floor(rating);
  const hasHalf = rating - full >= 0.4;

  return (
    <View style={styles.row} accessibilityLabel={`${rating} sao`}>
      {Array.from({ length: 5 }).map((_, index) => {
        if (index < full) {
          return <Ionicons key={index} name="star" size={size} color={colors.star} />;
        }
        if (index === full && hasHalf) {
          return <Ionicons key={index} name="star-half" size={size} color={colors.star} />;
        }
        return <Ionicons key={index} name="star-outline" size={size} color={colors.border} />;
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    alignItems: 'center',
  },
});
