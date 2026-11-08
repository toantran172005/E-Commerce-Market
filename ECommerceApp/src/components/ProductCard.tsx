import React from 'react';
import {
  Image,
  Pressable,
  StyleSheet,
  Text,
  View,
  ViewStyle,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Product } from '../types';
import { colors, radius, spacing } from '../constants/theme';
import { RatingStars } from './RatingStars';
import { calcDiscountPercent } from '../utils/format';

interface ProductCardProps {
  product: Product;
  onPress?: () => void;
  isFavourite?: boolean;
  onToggleFavourite?: () => void;
  width?: number;
  style?: ViewStyle;
}

/** Card sản phẩm dùng chung cho lưới 2 cột. */
export function ProductCard({
  product,
  onPress,
  isFavourite,
  onToggleFavourite,
  width,
  style,
}: ProductCardProps) {
  const discountPercent = calcDiscountPercent(product.price, product.originalPrice);

  return (
    <Pressable
      onPress={onPress}
      style={({ pressed }) => [styles.card, width ? { width } : null, pressed && styles.pressed, style]}
      accessibilityRole="button"
      accessibilityLabel={`${product.name}, giá ${product.price} đô`}
    >
      <View style={styles.imageWrap}>
        <Image source={{ uri: product.imageUrl }} style={styles.image} resizeMode="contain" />

        {discountPercent != null ? (
          <View style={styles.discountBadge}>
            <Text style={styles.discountText}>-{discountPercent}%</Text>
          </View>
        ) : product.badge === 'new' ? (
          <View style={[styles.discountBadge, styles.newBadge]}>
            <Text style={styles.discountText}>NEW</Text>
          </View>
        ) : null}

        {onToggleFavourite ? (
          <Pressable
            onPress={onToggleFavourite}
            hitSlop={8}
            style={styles.heartButton}
            accessibilityRole="button"
            accessibilityLabel={isFavourite ? 'Bỏ yêu thích' : 'Thêm yêu thích'}
          >
            <Ionicons
              name={isFavourite ? 'heart' : 'heart-outline'}
              size={16}
              color={isFavourite ? colors.primary : colors.gray}
            />
          </Pressable>
        ) : null}
      </View>

      <Text style={styles.name} numberOfLines={2}>{product.name}</Text>

      <View style={styles.ratingRow}>
        <RatingStars rating={product.rating ?? 0} size={11} />
        <Text style={styles.reviewCount}>({product.reviewCount ?? 0})</Text>
      </View>

      <View style={styles.priceRow}>
        <Text style={styles.price}>${product.price}</Text>
        {product.originalPrice && product.originalPrice > product.price ? (
          <Text style={styles.oldPrice}>${product.originalPrice}</Text>
        ) : null}
      </View>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: colors.card,
    borderRadius: radius.lg,
    borderWidth: 1,
    borderColor: colors.border,
    padding: spacing.sm,
    shadowColor: colors.dark,
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.05,
    shadowRadius: 10,
    elevation: 2,
  },
  pressed: { opacity: 0.9 },
  imageWrap: {
    height: 120,
    borderRadius: radius.md,
    backgroundColor: '#F3F4F6',
    overflow: 'hidden',
    alignItems: 'center',
    justifyContent: 'center',
  },
  image: { width: '86%', height: '86%' },
  discountBadge: {
    position: 'absolute',
    top: 8,
    left: 8,
    backgroundColor: colors.primary,
    paddingHorizontal: 7,
    paddingVertical: 3,
    borderRadius: radius.sm,
  },
  newBadge: { backgroundColor: colors.info },
  discountText: {
    fontSize: 10,
    fontWeight: '800',
    color: colors.white,
  },
  heartButton: {
    position: 'absolute',
    top: 6,
    right: 6,
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: colors.card,
    alignItems: 'center',
    justifyContent: 'center',
  },
  name: {
    marginTop: spacing.sm,
    fontSize: 13,
    fontWeight: '700',
    color: colors.dark,
    lineHeight: 18,
    minHeight: 36,
  },
  ratingRow: {
    marginTop: 4,
    flexDirection: 'row',
    alignItems: 'center',
  },
  reviewCount: {
    marginLeft: 4,
    fontSize: 10,
    color: colors.textMuted,
    fontWeight: '500',
  },
  priceRow: {
    marginTop: spacing.sm,
    flexDirection: 'row',
    alignItems: 'baseline',
    gap: 6,
  },
  price: {
    fontSize: 16,
    fontWeight: '800',
    color: colors.dark,
  },
  oldPrice: {
    fontSize: 11,
    fontWeight: '500',
    color: colors.grayLight,
    textDecorationLine: 'line-through',
  },
});
