import React, { useCallback, useMemo, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  FlatList,
  Image,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  StyleSheet,
  Text,
  TextInput,
  View,
  type ListRenderItem,
} from 'react-native';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { EmptyState, ScreenHeader } from '../src/components';
import { colors, radius, spacing } from '../src/constants/theme';
import { useAuth } from '../src/context/AuthContext';
import { useCart } from '../src/context/CartContext';
import { getErrorMessage } from '../src/services/http';
import { formatMoney } from '../src/utils/format';
import type { CartItem } from '../src/types';

/** Màn hình giỏ hàng, dùng CartContext để đồng bộ toàn app. */
export default function CartScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();

  const {
    items,
    voucher,
    totalItems,
    selectedCount,
    totals,
    removeItem,
    updateQuantity,
    toggleSelect,
    applyVoucher,
    removeVoucher,
  } = useCart();

  const [promoCode, setPromoCode] = useState('');
  const [promoApplying, setPromoApplying] = useState(false);
  const [promoError, setPromoError] = useState<string | null>(null);
  const [promoSuccess, setPromoSuccess] = useState<string | null>(null);

  // Nếu chưa chọn sản phẩm nào thì không tính phí ship/thuế để tránh hiển thị sai.
  const displayTotals =
    selectedCount === 0
      ? { subtotal: 0, discount: 0, shippingFee: 0, tax: 0, total: 0 }
      : totals;

  const handlePromoChange = useCallback((text: string) => {
    setPromoCode(text);
    setPromoError(null);
    setPromoSuccess(null);
  }, []);

  const handleApplyPromo = useCallback(async () => {
    const code = promoCode.trim().toUpperCase();
    if (!code) {
      setPromoError('Vui lòng nhập mã khuyến mãi.');
      return;
    }

    setPromoApplying(true);
    setPromoError(null);
    setPromoSuccess(null);
    try {
      await applyVoucher(code);
      setPromoSuccess(`Đã áp dụng mã ${code}.`);
    } catch (error) {
      setPromoError(getErrorMessage(error));
    } finally {
      setPromoApplying(false);
    }
  }, [applyVoucher, promoCode]);

  const { user } = useAuth();

  const handleRemoveVoucher = useCallback(() => {
    removeVoucher();
    setPromoCode('');
    setPromoSuccess(null);
  }, [removeVoucher]);

  const handleCheckout = useCallback(() => {
    if (selectedCount === 0) return;
    if (user?.isGuest || !user) {
      Alert.alert(
        'Yêu cầu đăng nhập',
        'Vui lòng đăng nhập để tiến hành thanh toán và đặt hàng.',
        [
          { text: 'Huỷ', style: 'cancel' },
          { text: 'Đăng nhập', onPress: () => router.push('/(auth)/login') },
        ],
      );
      return;
    }
    router.push('/checkout');
  }, [router, selectedCount, user]);

  const renderItem = useCallback<ListRenderItem<CartItem>>(
    ({ item }) => {
      const itemId = item.id ?? item.product.id;
      const selected = item.selected ?? true;

      return (
        <View style={styles.itemCard}>
          <Pressable
            onPress={() => toggleSelect(itemId)}
            hitSlop={12}
            accessibilityRole="checkbox"
            accessibilityState={{ checked: selected }}
            accessibilityLabel={selected ? 'Bỏ chọn sản phẩm' : 'Chọn sản phẩm'}
            style={[styles.checkbox, selected && styles.checkboxSelected]}
          >
            {selected ? <Ionicons name="checkmark" size={15} color={colors.white} /> : null}
          </Pressable>

          <View style={styles.productImageWrap}>
            <Image
              source={{ uri: item.product.imageUrl }}
              style={styles.productImage}
              resizeMode="contain"
              accessibilityIgnoresInvertColors
            />
          </View>

          <View style={styles.itemDetails}>
            <Text style={styles.brand}>{item.product.brandName ?? 'Thương hiệu'}</Text>
            <Text style={styles.itemName} numberOfLines={2}>
              {item.product.name}
            </Text>
            <Text style={styles.variant}>
              {item.variantName ?? 'Phiên bản tiêu chuẩn'}
            </Text>

            <View style={styles.priceRow}>
              <View style={styles.priceBlock}>
                <Text style={styles.price}>{formatMoney(item.product.price)}</Text>
                {item.product.originalPrice &&
                item.product.originalPrice > item.product.price ? (
                  <Text style={styles.originalPrice}>
                    {formatMoney(item.product.originalPrice)}
                  </Text>
                ) : null}
              </View>

              <View style={styles.itemActions}>
                <Pressable
                  onPress={() => removeItem(itemId)}
                  style={({ pressed }) => [
                    styles.trashButton,
                    pressed && styles.pressed,
                  ]}
                  hitSlop={8}
                  accessibilityRole="button"
                  accessibilityLabel="Xoá sản phẩm khỏi giỏ hàng"
                >
                  <Ionicons name="trash-outline" size={16} color={colors.gray} />
                </Pressable>

                <View style={styles.stepper}>
                  <Pressable
                    onPress={() => updateQuantity(itemId, -1)}
                    disabled={item.quantity <= 1}
                    style={({ pressed }) => [
                      styles.stepperButton,
                      pressed && styles.pressed,
                    ]}
                    accessibilityRole="button"
                    accessibilityLabel="Giảm số lượng"
                    accessibilityState={{ disabled: item.quantity <= 1 }}
                  >
                    <Ionicons
                      name="remove"
                      size={16}
                      color={item.quantity <= 1 ? colors.grayLight : colors.dark}
                    />
                  </Pressable>

                  <Text style={styles.stepperValue}>{item.quantity}</Text>

                  <Pressable
                    onPress={() => updateQuantity(itemId, 1)}
                    disabled={item.quantity >= 10}
                    style={({ pressed }) => [
                      styles.stepperButton,
                      pressed && styles.pressed,
                    ]}
                    accessibilityRole="button"
                    accessibilityLabel="Tăng số lượng"
                    accessibilityState={{ disabled: item.quantity >= 10 }}
                  >
                    <Ionicons
                      name="add"
                      size={16}
                      color={item.quantity >= 10 ? colors.grayLight : colors.dark}
                    />
                  </Pressable>
                </View>
              </View>
            </View>
          </View>
        </View>
      );
    },
    [removeItem, toggleSelect, updateQuantity],
  );

  const listFooter = useMemo(() => {
    return (
      <View>
        <View style={styles.promoSection}>
          <View style={styles.promoRow}>
            <View style={styles.promoInputWrapper}>
              <Ionicons name="pricetag-outline" size={17} color={colors.grayLight} />
              <TextInput
                value={promoCode}
                onChangeText={handlePromoChange}
                onSubmitEditing={() => {
                  void handleApplyPromo();
                }}
                placeholder="Nhập mã khuyến mãi"
                placeholderTextColor={colors.placeholder}
                autoCapitalize="characters"
                autoCorrect={false}
                returnKeyType="done"
                style={styles.promoInput}
                accessibilityLabel="Mã khuyến mãi"
              />
            </View>

            <Pressable
              onPress={() => {
                void handleApplyPromo();
              }}
              disabled={promoApplying || promoCode.trim().length === 0}
              style={({ pressed }) => [
                styles.applyButton,
                (promoApplying || promoCode.trim().length === 0) &&
                  styles.applyButtonDisabled,
                pressed && styles.pressed,
              ]}
              accessibilityRole="button"
              accessibilityLabel="Áp dụng mã khuyến mãi"
              accessibilityState={{
                disabled: promoApplying || promoCode.trim().length === 0,
                busy: promoApplying,
              }}
            >
              {promoApplying ? (
                <ActivityIndicator color={colors.white} />
              ) : (
                <Text style={styles.applyButtonText}>Áp dụng</Text>
              )}
            </Pressable>
          </View>

          {voucher ? (
            <View style={styles.appliedRow}>
              <Ionicons name="checkmark-circle" size={14} color={colors.primary} />
              <Text style={styles.appliedText}>
                Mã {voucher.code} đang được áp dụng.
              </Text>
              <Pressable
                onPress={handleRemoveVoucher}
                hitSlop={8}
                accessibilityRole="button"
                accessibilityLabel="Xoá mã giảm giá"
              >
                <Ionicons name="close-circle" size={16} color={colors.gray} />
              </Pressable>
            </View>
          ) : null}

          {promoError ? <Text style={styles.errorText}>{promoError}</Text> : null}

          {!voucher && !promoError && promoSuccess ? (
            <Text style={styles.successText}>{promoSuccess}</Text>
          ) : null}

          {!voucher && !promoError && !promoSuccess ? (
            <Text style={styles.promoHint}>
              Thử mã NOVA10, FLASH20 hoặc FREESHIP50
            </Text>
          ) : null}
        </View>

        <View style={styles.summaryCard}>
          <View style={styles.summaryRow}>
            <Text style={styles.summaryLabel}>Tạm tính</Text>
            <Text style={styles.summaryValue}>
              {formatMoney(displayTotals.subtotal)}
            </Text>
          </View>

          {displayTotals.discount > 0 ? (
            <View style={styles.summaryRow}>
              <Text style={styles.summaryLabel}>Giảm giá</Text>
              <Text style={[styles.summaryValue, styles.discountValue]}>
                -{formatMoney(displayTotals.discount)}
              </Text>
            </View>
          ) : null}

          <View style={styles.summaryRow}>
            <Text style={styles.summaryLabel}>Phí vận chuyển</Text>
            <Text style={styles.summaryValue}>
              {formatMoney(displayTotals.shippingFee)}
            </Text>
          </View>

          <View style={styles.summaryRow}>
            <Text style={styles.summaryLabel}>Thuế (8%)</Text>
            <Text style={styles.summaryValue}>{formatMoney(displayTotals.tax)}</Text>
          </View>

          <View style={styles.divider} />

          <View style={styles.summaryRow}>
            <Text style={styles.totalLabel}>Tổng cộng</Text>
            <Text style={styles.totalValue}>{formatMoney(displayTotals.total)}</Text>
          </View>
        </View>
      </View>
    );
  }, [
    displayTotals,
    handleApplyPromo,
    handlePromoChange,
    handleRemoveVoucher,
    promoApplying,
    promoCode,
    promoError,
    promoSuccess,
    voucher,
  ]);

  return (
    <SafeAreaView style={styles.safeArea} edges={['top']}>
      <ScreenHeader
        title="Giỏ hàng"
        subtitle={`${totalItems} sản phẩm`}
      />

      <KeyboardAvoidingView
        style={styles.flex}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        keyboardVerticalOffset={Platform.OS === 'ios' ? 8 : 0}
      >
        <FlatList
          data={items}
          keyExtractor={(item) => item.id ?? item.product.id}
          renderItem={renderItem}
          ListEmptyComponent={
            <EmptyState
              icon="cart-outline"
              title="Giỏ hàng trống"
              subtitle="Bạn chưa thêm sản phẩm nào. Hãy khám phá sản phẩm ngay."
              actionLabel="Mua sắm ngay"
              onAction={() => router.replace('/(tabs)/home')}
            />
          }
          ListFooterComponent={items.length > 0 ? listFooter : undefined}
          contentContainerStyle={styles.listContent}
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled"
        />
      </KeyboardAvoidingView>

      <View style={[styles.footer, { paddingBottom: Math.max(insets.bottom, 12) + 8 }]}>
        <Pressable
          onPress={handleCheckout}
          disabled={selectedCount === 0 || items.length === 0}
          style={({ pressed }) => [
            styles.checkoutButton,
            (selectedCount === 0 || items.length === 0) &&
              styles.checkoutButtonDisabled,
            pressed && styles.pressed,
          ]}
          accessibilityRole="button"
          accessibilityLabel="Thanh toán"
          accessibilityState={{
            disabled: selectedCount === 0 || items.length === 0,
          }}
        >
          <Text style={styles.checkoutText}>
            Thanh toán • {formatMoney(displayTotals.total)}
          </Text>
          <Ionicons name="chevron-forward" size={16} color={colors.white} />
        </Pressable>
      </View>
    </SafeAreaView>
  );
}

/* ------------------------------------------------------------------ */
/*  Styles                                                             */
/* ------------------------------------------------------------------ */

const styles = StyleSheet.create({
  flex: { flex: 1 },
  safeArea: {
    flex: 1,
    backgroundColor: colors.background,
  },
  pressed: { opacity: 0.65 },
  listContent: {
    paddingHorizontal: spacing.lg,
    paddingBottom: spacing.xxl + 20,
  },

  /* Item trong giỏ */
  itemCard: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginBottom: spacing.md,
    padding: spacing.md,
    backgroundColor: colors.card,
    borderRadius: radius.xl,
    borderWidth: 1,
    borderColor: colors.border,
    shadowColor: colors.dark,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.05,
    shadowRadius: 12,
    elevation: 2,
  },
  checkbox: {
    width: 24,
    height: 24,
    borderRadius: 7,
    borderWidth: 1.6,
    borderColor: '#D5D8DE',
    backgroundColor: colors.card,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 2,
  },
  checkboxSelected: {
    backgroundColor: colors.primary,
    borderColor: colors.primary,
  },
  productImageWrap: {
    width: 84,
    height: 76,
    borderRadius: radius.md,
    backgroundColor: '#F3F4F6',
    overflow: 'hidden',
    marginLeft: spacing.sm,
  },
  productImage: { width: '100%', height: '100%' },
  itemDetails: {
    flex: 1,
    marginLeft: spacing.sm,
    minWidth: 0,
  },
  brand: {
    fontSize: 11,
    fontWeight: '700',
    color: colors.grayLight,
    letterSpacing: 0.2,
  },
  itemName: {
    marginTop: 2,
    fontSize: 14,
    fontWeight: '800',
    color: colors.dark,
    letterSpacing: -0.2,
  },
  variant: {
    marginTop: 3,
    fontSize: 11.5,
    fontWeight: '500',
    color: colors.gray,
  },
  priceRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    flexWrap: 'wrap',
    gap: 6,
    marginTop: spacing.sm,
  },
  priceBlock: {
    minWidth: 0,
    flexShrink: 1,
    flexDirection: 'column',
    alignItems: 'flex-start',
  },
  price: {
    fontSize: 15,
    fontWeight: '800',
    color: colors.dark,
    letterSpacing: -0.2,
  },
  originalPrice: {
    marginTop: 1,
    fontSize: 11,
    fontWeight: '500',
    color: colors.grayLight,
    textDecorationLine: 'line-through',
  },
  itemActions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    flexShrink: 0,
  },
  trashButton: {
    width: 32,
    height: 32,
    borderRadius: radius.sm,
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.card,
    alignItems: 'center',
    justifyContent: 'center',
  },
  stepper: {
    flexDirection: 'row',
    alignItems: 'center',
    height: 32,
    borderRadius: radius.sm,
    backgroundColor: '#F2F4F7',
    paddingHorizontal: 2,
  },
  stepperButton: {
    width: 30,
    height: 30,
    alignItems: 'center',
    justifyContent: 'center',
  },
  stepperValue: {
    minWidth: 20,
    textAlign: 'center',
    fontSize: 13,
    fontWeight: '700',
    color: colors.dark,
  },

  /* Khuyến mãi */
  promoSection: {
    marginTop: spacing.xl,
  },
  promoRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  promoInputWrapper: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    height: 52,
    paddingHorizontal: spacing.md,
    backgroundColor: colors.card,
    borderRadius: radius.lg,
    borderWidth: 1,
    borderColor: colors.border,
  },
  promoInput: {
    flex: 1,
    marginLeft: spacing.sm,
    paddingVertical: 0,
    fontSize: 12,
    fontWeight: '700',
    letterSpacing: 1.2,
    color: colors.dark,
  },
  applyButton: {
    height: 52,
    minWidth: 92,
    paddingHorizontal: spacing.lg,
    marginLeft: spacing.sm,
    borderRadius: radius.lg,
    backgroundColor: colors.dark,
    alignItems: 'center',
    justifyContent: 'center',
  },
  applyButtonDisabled: { opacity: 0.6 },
  applyButtonText: {
    fontSize: 14,
    fontWeight: '700',
    color: colors.white,
  },
  promoHint: {
    marginTop: spacing.sm,
    fontSize: 12,
    fontWeight: '500',
    color: colors.grayLight,
  },
  errorText: {
    marginTop: spacing.sm,
    fontSize: 12.5,
    fontWeight: '600',
    color: colors.danger,
  },
  successText: {
    marginTop: spacing.sm,
    fontSize: 12.5,
    fontWeight: '600',
    color: colors.success,
  },
  appliedRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: spacing.sm,
  },
  appliedText: {
    flex: 1,
    marginLeft: 6,
    fontSize: 12,
    fontWeight: '600',
    color: colors.primary,
  },

  /* Tóm tắt tiền */
  summaryCard: {
    marginTop: spacing.xl,
    paddingHorizontal: spacing.xl,
    paddingVertical: spacing.lg,
    backgroundColor: colors.card,
    borderRadius: radius.xl,
    borderWidth: 1,
    borderColor: colors.border,
  },
  summaryRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 7,
  },
  summaryLabel: {
    fontSize: 14,
    fontWeight: '500',
    color: colors.textSecondary,
  },
  summaryValue: {
    fontSize: 14.5,
    fontWeight: '700',
    color: colors.dark,
  },
  discountValue: { color: colors.primary },
  divider: {
    height: 1,
    backgroundColor: colors.border,
    marginVertical: spacing.md,
  },
  totalLabel: {
    fontSize: 16,
    fontWeight: '800',
    color: colors.dark,
    letterSpacing: -0.2,
  },
  totalValue: {
    fontSize: 20,
    fontWeight: '800',
    color: colors.dark,
    letterSpacing: -0.4,
  },

  /* Thanh toán */
  footer: {
    paddingHorizontal: spacing.lg,
    paddingTop: spacing.md,
    backgroundColor: colors.background,
    borderTopWidth: 1,
    borderTopColor: colors.border,
  },
  checkoutButton: {
    height: 56,
    borderRadius: radius.xl,
    backgroundColor: colors.primary,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: colors.primary,
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.28,
    shadowRadius: 12,
    elevation: 5,
  },
  checkoutButtonDisabled: {
    backgroundColor: colors.primarySoft,
    shadowOpacity: 0,
    elevation: 0,
  },
  checkoutText: {
    fontSize: 15.5,
    fontWeight: '800',
    color: colors.white,
    letterSpacing: -0.2,
    marginRight: spacing.sm,
  },
});
