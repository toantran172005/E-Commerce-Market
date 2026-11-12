import React from 'react';
import { StyleSheet, Text, View, Image } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Review } from '../types';
import { RatingStars } from './RatingStars';
import { colors, radius, spacing } from '../constants/theme';
import { formatDate } from '../utils/format';

interface ProductReviewsListProps {
  reviews: Review[];
  rating?: number;
  reviewCount?: number;
}

/**
 * Hiển thị danh sách đánh giá từ khách hàng đã mua (UC010).
 */
export function ProductReviewsList({ reviews, rating = 5.0, reviewCount = 0 }: ProductReviewsListProps) {
  return (
    <View style={styles.container}>
      <View style={styles.headerRow}>
        <View style={styles.iconBadge}>
          <Ionicons name="star" size={16} color="#EAB308" />
        </View>
        <Text style={styles.headerTitle}>ĐÁNH GIÁ SẢN PHẨM</Text>
      </View>

      <View style={styles.overviewBox}>
        <View style={styles.ratingBigWrap}>
          <Text style={styles.ratingBig}>{rating.toFixed(1)}</Text>
          <Text style={styles.ratingMax}>/5</Text>
        </View>
        <View style={styles.overviewRight}>
          <RatingStars rating={rating} size={16} />
          <Text style={styles.totalReviewsText}>{reviewCount} lượt đánh giá thực tế</Text>
        </View>
      </View>

      {reviews.length === 0 ? (
        <View style={styles.emptyBox}>
          <Text style={styles.emptyText}>Chưa có nhận xét nào cho sản phẩm này.</Text>
        </View>
      ) : (
        <View style={styles.reviewsList}>
          {reviews.map((rev) => (
            <View key={rev.id} style={styles.reviewItem}>
              <View style={styles.reviewUserRow}>
                <View style={styles.avatar}>
                  <Text style={styles.avatarText}>{rev.userName.charAt(0).toUpperCase()}</Text>
                </View>
                <View style={styles.userInfo}>
                  <Text style={styles.userName}>{rev.userName}</Text>
                  <View style={styles.starsAndDate}>
                    <RatingStars rating={rev.rating} size={11} />
                    <Text style={styles.reviewDate}>{formatDate(rev.createdAt)}</Text>
                  </View>
                </View>
                <View style={styles.verifiedBadge}>
                  <Ionicons name="checkmark-circle" size={13} color={colors.success} />
                  <Text style={styles.verifiedText}>Đã mua hàng</Text>
                </View>
              </View>

              <Text style={styles.reviewComment}>{rev.comment}</Text>

              {rev.images && rev.images.length > 0 && (
                <View style={styles.reviewPhotosRow}>
                  {rev.images.map((imgUri, imgIdx) => (
                    <Image
                      key={`rev-img-${imgIdx}`}
                      source={{ uri: imgUri }}
                      style={styles.reviewPhoto}
                      resizeMode="cover"
                    />
                  ))}
                </View>
              )}
            </View>
          ))}
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    marginTop: spacing.lg,
    backgroundColor: colors.card,
    borderRadius: radius.lg,
    padding: spacing.md,
    borderWidth: 1,
    borderColor: colors.border,
  },
  headerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: spacing.md,
    gap: spacing.sm,
  },
  iconBadge: {
    width: 28,
    height: 28,
    borderRadius: radius.sm,
    backgroundColor: 'rgba(234, 179, 8, 0.12)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerTitle: {
    fontSize: 14.5,
    fontWeight: '800',
    color: colors.dark,
    letterSpacing: 0.2,
  },
  overviewBox: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FEFCE8',
    borderRadius: radius.md,
    padding: spacing.md,
    marginBottom: spacing.md,
    borderWidth: 1,
    borderColor: '#FEF08A',
    gap: spacing.lg,
  },
  ratingBigWrap: {
    flexDirection: 'row',
    alignItems: 'baseline',
  },
  ratingBig: {
    fontSize: 28,
    fontWeight: '900',
    color: '#CA8A04',
  },
  ratingMax: {
    fontSize: 14,
    color: colors.textSecondary,
    fontWeight: '600',
  },
  overviewRight: {
    gap: 3,
  },
  totalReviewsText: {
    fontSize: 12,
    color: colors.textSecondary,
    fontWeight: '500',
  },
  emptyBox: {
    paddingVertical: spacing.lg,
    alignItems: 'center',
  },
  emptyText: {
    fontSize: 13,
    color: colors.textMuted,
  },
  reviewsList: {
    gap: spacing.md,
  },
  reviewItem: {
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
    paddingBottom: spacing.md,
  },
  reviewUserRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 6,
  },
  avatar: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: colors.dark,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: spacing.sm,
  },
  avatarText: {
    color: colors.white,
    fontSize: 14,
    fontWeight: '700',
  },
  userInfo: {
    flex: 1,
  },
  userName: {
    fontSize: 13,
    fontWeight: '700',
    color: colors.dark,
  },
  starsAndDate: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginTop: 2,
  },
  reviewDate: {
    fontSize: 11,
    color: colors.textMuted,
  },
  verifiedBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 3,
    backgroundColor: '#DCFCE7',
    paddingHorizontal: 7,
    paddingVertical: 3,
    borderRadius: radius.pill,
  },
  verifiedText: {
    fontSize: 10.5,
    fontWeight: '700',
    color: colors.success,
  },
  reviewComment: {
    fontSize: 12.5,
    color: colors.dark,
    lineHeight: 18,
    marginTop: 4,
  },
  reviewPhotosRow: {
    flexDirection: 'row',
    gap: 8,
    marginTop: 8,
  },
  reviewPhoto: {
    width: 60,
    height: 60,
    borderRadius: radius.sm,
    backgroundColor: colors.background,
  },
});
