import React, { useState } from 'react';
import {
  Alert,
  Image,
  Modal,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import * as ImagePicker from 'expo-image-picker';
import { colors, radius, spacing } from '../constants/theme';
import { OrderItem } from '../types';
import { useAuth } from '../context/AuthContext';
import { CatalogService } from '../services/catalogService';
import { PrimaryButton, SecondaryButton } from './Button';

interface ReviewModalProps {
  visible: boolean;
  onClose: () => void;
  items: OrderItem[];
  onSuccess: (message: string) => void;
}

export function ReviewModal({ visible, onClose, items, onSuccess }: ReviewModalProps) {
  const { user } = useAuth();
  const [selectedProductIndex, setSelectedProductIndex] = useState(0);
  const [rating, setRating] = useState(5);
  const [comment, setComment] = useState('');
  const [photos, setPhotos] = useState<string[]>([]);
  const [submitting, setSubmitting] = useState(false);

  const currentItem = items[selectedProductIndex] || items[0];

  const handlePickPhoto = async () => {
    try {
      const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
      if (status !== 'granted') {
        Alert.alert('Quyền truy cập', 'Vui lòng cấp quyền truy cập thư viện ảnh để tải ảnh thực tế.');
        return;
      }

      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        allowsMultipleSelection: true,
        selectionLimit: 3 - photos.length,
        quality: 0.8,
      });

      if (!result.canceled && result.assets && result.assets.length > 0) {
        const uris = result.assets.map((a) => a.uri);
        setPhotos((prev) => [...prev, ...uris].slice(0, 3));
      }
    } catch {
      Alert.alert('Lỗi', 'Không thể mở thư viện ảnh.');
    }
  };

  const handleRemovePhoto = (index: number) => {
    setPhotos((prev) => prev.filter((_, i) => i !== index));
  };

  const handleSubmit = async () => {
    if (!currentItem) return;
    if (!comment.trim()) {
      Alert.alert('Chưa nhập đánh giá', 'Vui lòng chia sẻ cảm nhận của bạn về sản phẩm.');
      return;
    }

    setSubmitting(true);
    try {
      await CatalogService.addProductReview(currentItem.productId, {
        userId: user?.uid || 'user_guest',
        userName: user?.fullName || 'Khách hàng thân thiết',
        userAvatar: user?.avatarUrl,
        rating,
        content: comment.trim(),
        images: photos.length > 0 ? photos : undefined,
        verifiedPurchase: true,
        createdAt: new Date().toISOString(),
      });

      setComment('');
      setPhotos([]);
      setRating(5);
      onClose();
      onSuccess(`Đã gửi đánh giá thành công cho sản phẩm "${currentItem.name}"!`);
    } catch {
      Alert.alert('Lỗi', 'Không thể gửi đánh giá. Vui lòng thử lại sau.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <Modal
      visible={visible}
      animationType="slide"
      presentationStyle="pageSheet"
      onRequestClose={onClose}
    >
      <SafeAreaView style={styles.safe} edges={['top', 'bottom']}>
        {/* Header */}
        <View style={styles.header}>
          <Text style={styles.headerTitle}>Đánh giá sản phẩm</Text>
          <Pressable
            onPress={onClose}
            hitSlop={8}
            style={({ pressed }) => [styles.closeBtn, pressed && styles.pressed]}
            accessibilityRole="button"
            accessibilityLabel="Đóng"
          >
            <Ionicons name="close" size={24} color={colors.textSecondary} />
          </Pressable>
        </View>

        <ScrollView
          style={styles.scroll}
          contentContainerStyle={styles.content}
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled"
        >
          {/* Chọn sản phẩm nếu có nhiều hơn 1 sản phẩm */}
          {items.length > 1 ? (
            <View style={styles.selectorWrap}>
              <Text style={styles.fieldLabel}>Chọn sản phẩm muốn đánh giá:</Text>
              <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.prodScroll}>
                {items.map((item, idx) => (
                  <Pressable
                    key={`${item.productId}-${idx}`}
                    onPress={() => setSelectedProductIndex(idx)}
                    style={[
                      styles.prodChip,
                      selectedProductIndex === idx && styles.prodChipActive,
                    ]}
                  >
                    <Image source={{ uri: item.imageUrl }} style={styles.chipThumb} />
                    <Text
                      style={[
                        styles.chipName,
                        selectedProductIndex === idx && styles.chipNameActive,
                      ]}
                      numberOfLines={1}
                    >
                      {item.name}
                    </Text>
                  </Pressable>
                ))}
              </ScrollView>
            </View>
          ) : null}

          {/* Thông tin sản phẩm được chọn */}
          {currentItem ? (
            <View style={styles.productBanner}>
              <Image source={{ uri: currentItem.imageUrl }} style={styles.bannerThumb} />
              <View style={styles.bannerInfo}>
                <Text style={styles.bannerName} numberOfLines={2}>{currentItem.name}</Text>
                {currentItem.variantName ? (
                  <Text style={styles.bannerVariant}>{currentItem.variantName}</Text>
                ) : null}
              </View>
            </View>
          ) : null}

          {/* Chọn sao */}
          <View style={styles.ratingSection}>
            <Text style={styles.ratingTitle}>Chất lượng sản phẩm</Text>
            <View style={styles.starsRow}>
              {[1, 2, 3, 4, 5].map((star) => (
                <Pressable
                  key={star}
                  onPress={() => setRating(star)}
                  style={styles.starTouch}
                  hitSlop={6}
                >
                  <Ionicons
                    name={star <= rating ? 'star' : 'star-outline'}
                    size={36}
                    color={star <= rating ? '#F59E0B' : colors.grayLight}
                  />
                </Pressable>
              ))}
            </View>
            <Text style={styles.ratingHint}>
              {rating === 5 && 'Tuyệt vời, rất hài lòng!'}
              {rating === 4 && 'Hài lòng, sản phẩm tốt.'}
              {rating === 3 && 'Bình thường, tạm ổn.'}
              {rating === 2 && 'Chưa hài lòng.'}
              {rating === 1 && 'Rất tệ, thất vọng.'}
            </Text>
          </View>

          {/* Nhập nhận xét */}
          <View style={styles.inputSection}>
            <Text style={styles.fieldLabel}>Chia sẻ trải nghiệm của bạn</Text>
            <TextInput
              style={styles.textArea}
              placeholder="Chất lượng sản phẩm, dịch vụ đóng gói và thời gian giao hàng như thế nào?"
              placeholderTextColor={colors.textMuted}
              value={comment}
              onChangeText={setComment}
              multiline
              numberOfLines={4}
              textAlignVertical="top"
            />
          </View>

          {/* Đính kèm hình ảnh */}
          <View style={styles.photoSection}>
            <Text style={styles.fieldLabel}>Hình ảnh thực tế ({photos.length}/3)</Text>
            <View style={styles.photoRow}>
              {photos.map((uri, idx) => (
                <View key={idx} style={styles.thumbWrapper}>
                  <Image source={{ uri }} style={styles.pickedThumb} />
                  <Pressable
                    onPress={() => handleRemovePhoto(idx)}
                    style={styles.removePhotoBtn}
                    hitSlop={6}
                  >
                    <Ionicons name="close" size={14} color={colors.white} />
                  </Pressable>
                </View>
              ))}

              {photos.length < 3 ? (
                <Pressable
                  onPress={handlePickPhoto}
                  style={({ pressed }) => [styles.addPhotoBtn, pressed && styles.pressed]}
                >
                  <Ionicons name="camera-outline" size={26} color={colors.primary} />
                  <Text style={styles.addPhotoText}>Thêm ảnh</Text>
                </Pressable>
              ) : null}
            </View>
          </View>

          {/* Nút gửi */}
          <View style={styles.actionSection}>
            <PrimaryButton
              title="Gửi đánh giá"
              onPress={handleSubmit}
              loading={submitting}
              icon="send"
            />
          </View>
        </ScrollView>
      </SafeAreaView>
    </Modal>
  );
}

const styles = StyleSheet.create({
  safe: {
    flex: 1,
    backgroundColor: colors.background,
  },
  pressed: {
    opacity: 0.6,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
    backgroundColor: colors.card,
  },
  headerTitle: {
    fontSize: 17,
    fontWeight: '700',
    color: colors.dark,
  },
  closeBtn: {
    padding: spacing.xs,
  },
  scroll: {
    flex: 1,
  },
  content: {
    padding: spacing.lg,
    paddingBottom: spacing.xxl,
  },
  selectorWrap: {
    marginBottom: spacing.md,
  },
  prodScroll: {
    marginTop: spacing.xs,
  },
  prodChip: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 6,
    borderRadius: radius.md,
    borderWidth: 1,
    borderColor: colors.border,
    marginRight: spacing.sm,
    backgroundColor: colors.card,
  },
  prodChipActive: {
    borderColor: colors.primary,
    backgroundColor: colors.primarySoft,
  },
  chipThumb: {
    width: 28,
    height: 28,
    borderRadius: 4,
    marginRight: 6,
  },
  chipName: {
    fontSize: 12,
    color: colors.textSecondary,
    maxWidth: 120,
  },
  chipNameActive: {
    color: colors.primary,
    fontWeight: '700',
  },
  productBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.card,
    borderRadius: radius.md,
    padding: spacing.md,
    borderWidth: 1,
    borderColor: colors.border,
    marginBottom: spacing.lg,
  },
  bannerThumb: {
    width: 52,
    height: 52,
    borderRadius: radius.sm,
    backgroundColor: colors.border,
    marginRight: spacing.md,
  },
  bannerInfo: {
    flex: 1,
  },
  bannerName: {
    fontSize: 14,
    fontWeight: '600',
    color: colors.dark,
    lineHeight: 19,
  },
  bannerVariant: {
    fontSize: 12,
    color: colors.textMuted,
    marginTop: 2,
  },
  ratingSection: {
    alignItems: 'center',
    paddingVertical: spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
    marginBottom: spacing.lg,
  },
  ratingTitle: {
    fontSize: 15,
    fontWeight: '700',
    color: colors.dark,
    marginBottom: spacing.sm,
  },
  starsRow: {
    flexDirection: 'row',
    gap: spacing.md,
  },
  starTouch: {
    padding: 4,
  },
  ratingHint: {
    fontSize: 13,
    fontWeight: '600',
    color: '#D97706',
    marginTop: spacing.sm,
  },
  fieldLabel: {
    fontSize: 13,
    fontWeight: '700',
    color: colors.dark,
    marginBottom: spacing.xs,
  },
  inputSection: {
    marginBottom: spacing.lg,
  },
  textArea: {
    backgroundColor: colors.card,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: radius.md,
    padding: spacing.md,
    fontSize: 14,
    color: colors.dark,
    minHeight: 100,
  },
  photoSection: {
    marginBottom: spacing.xl,
  },
  photoRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    marginTop: spacing.xs,
  },
  thumbWrapper: {
    position: 'relative',
    width: 72,
    height: 72,
    borderRadius: radius.md,
    overflow: 'hidden',
  },
  pickedThumb: {
    width: '100%',
    height: '100%',
  },
  removePhotoBtn: {
    position: 'absolute',
    top: 4,
    right: 4,
    width: 20,
    height: 20,
    borderRadius: 10,
    backgroundColor: 'rgba(0,0,0,0.6)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  addPhotoBtn: {
    width: 72,
    height: 72,
    borderRadius: radius.md,
    borderWidth: 1.5,
    borderColor: colors.border,
    borderStyle: 'dashed',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.card,
  },
  addPhotoText: {
    fontSize: 10,
    color: colors.textSecondary,
    marginTop: 2,
  },
  actionSection: {
    marginTop: spacing.sm,
  },
});
