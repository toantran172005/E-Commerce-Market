import React, { useState } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Product } from '../types';
import { colors, radius, spacing } from '../constants/theme';

interface ProductDescriptionViewProps {
  product: Product;
}

/**
 * Component hiển thị "MÔ TẢ SẢN PHẨM" chuẩn phong cách Shopee (mobile.docx B).
 * Gồm:
 * 1. Điểm nổi bật (Highlights bullet points)
 * 2. Nội dung mô tả chi tiết có tính năng Xem thêm / Thu gọn
 * 3. Hướng dẫn sử dụng & bảo quản
 * 4. Khối Chính sách bảo hành & Đổi trả chính hãng
 */
export function ProductDescriptionView({ product }: ProductDescriptionViewProps) {
  const [expanded, setExpanded] = useState(false);

  // Điểm nổi bật mặc định nếu chưa có
  const highlights = product.highlights && product.highlights.length > 0
    ? product.highlights
    : [
        'Sản phẩm chính hãng 100%, nguyên seal mới hoàn toàn',
        'Công nghệ hiện đại tối ưu trải nghiệm và hiệu suất bền bỉ',
        'Thiết kế cao cấp, công thái học vừa vặn, sang trọng',
        'Đạt tiêu chuẩn an toàn chất lượng quốc tế',
      ];

  // Nội dung mô tả dài
  const fullText = product.longDescription || product.description || 'Chưa có thông tin mô tả chi tiết cho sản phẩm này.';

  const isLongContent = fullText.length > 250;
  const displayedText = expanded || !isLongContent ? fullText : `${fullText.slice(0, 250)}...`;

  const warrantyPolicy = product.warrantyPolicy || 'Bảo hành chính hãng 12 tháng tại các trung tâm uỷ quyền toàn quốc. Cam kết 1 đổi 1 trong 30 ngày đầu tiên nếu phát sinh lỗi từ nhà sản xuất.';

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.headerRow}>
        <View style={styles.iconBadge}>
          <Ionicons name="document-text" size={16} color={colors.primary} />
        </View>
        <Text style={styles.headerTitle}>MÔ TẢ SẢN PHẨM</Text>
      </View>

      {/* 1. Điểm nổi bật */}
      <View style={styles.highlightsBox}>
        <Text style={styles.sectionSubtitle}>✨ ĐẶC ĐIỂM NỔI BẬT</Text>
        {highlights.map((item, idx) => (
          <View key={`hl-${idx}`} style={styles.highlightItem}>
            <Ionicons name="checkmark-circle" size={15} color={colors.success} style={styles.checkIcon} />
            <Text style={styles.highlightText}>{item}</Text>
          </View>
        ))}
      </View>

      {/* 2. Chi tiết mô tả */}
      <View style={styles.descriptionBox}>
        <Text style={styles.sectionSubtitle}>📝 THÔNG TIN CHI TIẾT</Text>
        <Text style={styles.descriptionParagraph}>{displayedText}</Text>

        {isLongContent && (
          <Pressable
            onPress={() => setExpanded((prev) => !prev)}
            style={({ pressed }) => [styles.expandButton, pressed && styles.pressed]}
            accessibilityRole="button"
            accessibilityLabel={expanded ? 'Thu gọn mô tả' : 'Xem thêm mô tả'}
          >
            <Text style={styles.expandText}>{expanded ? 'Thu gọn' : 'Xem thêm nội dung'}</Text>
            <Ionicons
              name={expanded ? 'chevron-up' : 'chevron-down'}
              size={15}
              color={colors.primary}
            />
          </Pressable>
        )}
      </View>

      {/* 3. Hướng dẫn sử dụng & Bảo quản nếu có */}
      {product.usageGuide ? (
        <View style={styles.guideBox}>
          <Text style={styles.sectionSubtitle}>💡 HƯỚNG DẪN SỬ DỤNG & BẢO QUẢN</Text>
          <Text style={styles.guideText}>{product.usageGuide}</Text>
        </View>
      ) : null}

      {/* 4. Khối Chính sách bảo hành & Đổi trả */}
      <View style={styles.warrantyCard}>
        <View style={styles.warrantyHeader}>
          <Ionicons name="shield-checkmark" size={18} color="#2563EB" />
          <Text style={styles.warrantyTitle}>CHÍNH SÁCH BẢO HÀNH & ĐỔI TRẢ</Text>
        </View>
        <Text style={styles.warrantyText}>{warrantyPolicy}</Text>

        <View style={styles.warrantyBadges}>
          <View style={styles.guaranteeBadge}>
            <Ionicons name="ribbon-outline" size={14} color="#2563EB" />
            <Text style={styles.badgeText}>100% Chính Hãng</Text>
          </View>
          <View style={styles.guaranteeBadge}>
            <Ionicons name="sync-outline" size={14} color="#2563EB" />
            <Text style={styles.badgeText}>30 Ngày Đổi Trả</Text>
          </View>
          <View style={styles.guaranteeBadge}>
            <Ionicons name="airplane-outline" size={14} color="#2563EB" />
            <Text style={styles.badgeText}>Giao Toàn Quốc</Text>
          </View>
        </View>
      </View>
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
    backgroundColor: 'rgba(238, 77, 45, 0.1)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerTitle: {
    fontSize: 14.5,
    fontWeight: '800',
    color: colors.dark,
    letterSpacing: 0.2,
  },
  sectionSubtitle: {
    fontSize: 12,
    fontWeight: '800',
    color: colors.textSecondary,
    marginBottom: spacing.xs,
    letterSpacing: 0.3,
  },
  highlightsBox: {
    backgroundColor: '#F9FAFB',
    borderRadius: radius.md,
    padding: spacing.sm + 4,
    marginBottom: spacing.md,
    borderWidth: 1,
    borderColor: colors.border,
  },
  highlightItem: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginTop: 6,
    gap: 6,
  },
  checkIcon: {
    marginTop: 1,
  },
  highlightText: {
    flex: 1,
    fontSize: 12.5,
    color: colors.dark,
    lineHeight: 18,
    fontWeight: '500',
  },
  descriptionBox: {
    marginBottom: spacing.md,
  },
  descriptionParagraph: {
    fontSize: 13,
    color: colors.dark,
    lineHeight: 20,
    fontWeight: '400',
    marginTop: 4,
  },
  expandButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 8,
    marginTop: 8,
    gap: 4,
  },
  pressed: {
    opacity: 0.6,
  },
  expandText: {
    fontSize: 13,
    color: colors.primary,
    fontWeight: '700',
  },
  guideBox: {
    backgroundColor: '#F8FAFC',
    borderRadius: radius.md,
    padding: spacing.sm + 4,
    marginBottom: spacing.md,
    borderLeftWidth: 3,
    borderLeftColor: colors.primary,
  },
  guideText: {
    fontSize: 12.5,
    color: colors.textSecondary,
    lineHeight: 18,
    marginTop: 4,
  },
  warrantyCard: {
    backgroundColor: '#EFF6FF',
    borderRadius: radius.md,
    padding: spacing.sm + 4,
    borderWidth: 1,
    borderColor: '#BFDBFE',
  },
  warrantyHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginBottom: 6,
  },
  warrantyTitle: {
    fontSize: 12.5,
    fontWeight: '800',
    color: '#1E40AF',
  },
  warrantyText: {
    fontSize: 12,
    color: '#1E3A8A',
    lineHeight: 17,
  },
  warrantyBadges: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    marginTop: spacing.sm,
  },
  guaranteeBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.white,
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: radius.pill,
    gap: 4,
    borderWidth: 1,
    borderColor: '#DBEAFE',
  },
  badgeText: {
    fontSize: 11,
    fontWeight: '600',
    color: '#1E40AF',
  },
});
