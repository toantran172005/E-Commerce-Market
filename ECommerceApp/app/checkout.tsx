import React, { useCallback, useEffect, useMemo, useState } from 'react';
import {
  Alert,
  View,
  Text,
  TextInput,
  StyleSheet,
  ScrollView,
  Pressable,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { ScreenHeader, LoadingView, EmptyState } from '../src/components';
import { colors, radius, spacing } from '../src/constants/theme';
import { useAuth } from '../src/context/AuthContext';
import { useCart } from '../src/context/CartContext';
import { useCheckout } from '../src/context/CheckoutContext';
import { useAddresses } from '../src/context/AddressesContext';
import { usePaymentMethods } from '../src/context/PaymentMethodsContext';
import { formatMoney } from '../src/utils/format';
import { computeCartTotals } from '../src/utils/pricing';
import { PaymentMethod } from '../src/types';

function getPaymentIcon(type: PaymentMethod['type']): keyof typeof Ionicons.glyphMap {
  switch (type) {
    case 'card':
      return 'card-outline';
    case 'wallet':
      return 'wallet-outline';
    case 'cod':
      return 'cash-outline';
  }
}

export default function CheckoutScreen() {
  const router = useRouter();
  const { user, isLoading: authLoading } = useAuth();
  const cart = useCart();
  const checkout = useCheckout();
  const addresses = useAddresses();
  const paymentMethods = usePaymentMethods();

  const isGuestUser = !authLoading && (user?.isGuest || !user);

  useEffect(() => {
    if (isGuestUser) {
      Alert.alert(
        'Yêu cầu đăng nhập',
        'Vui lòng đăng nhập để tiến hành đặt hàng.',
        [
          { text: 'Đăng nhập ngay', onPress: () => router.replace('/(auth)/login') },
        ],
        { cancelable: false },
      );
    }
  }, [isGuestUser, router]);

  const [submitError, setSubmitError] = useState('');
  const [voucherCodeInput, setVoucherCodeInput] = useState('');
  const [voucherError, setVoucherError] = useState('');
  const [applyingVoucher, setApplyingVoucher] = useState(false);

  const handleApplyVoucher = async () => {
    if (!voucherCodeInput.trim()) {
      setVoucherError('Vui lòng nhập mã ưu đãi.');
      return;
    }
    setVoucherError('');
    setApplyingVoucher(true);
    try {
      await cart.applyVoucher(voucherCodeInput.trim());
      setVoucherCodeInput('');
    } catch (err: any) {
      setVoucherError(err?.message || 'Mã ưu đãi không hợp lệ.');
    } finally {
      setApplyingVoucher(false);
    }
  };

  const handleRemoveVoucher = () => {
    cart.removeVoucher();
    setVoucherError('');
  };

  const selectedItems = useMemo(
    () => cart.items.filter((item) => item.selected),
    [cart.items],
  );

  const selectedCount = useMemo(
    () => selectedItems.reduce((sum, item) => sum + item.quantity, 0),
    [selectedItems],
  );

  const selectedAddress = useMemo(
    () =>
      addresses.addresses.find((a) => a.id === checkout.addressId) ??
      addresses.defaultAddress,
    [addresses.addresses, addresses.defaultAddress, checkout.addressId],
  );

  const selectedPayment = useMemo(
    () =>
      paymentMethods.methods.find((p) => p.id === checkout.paymentMethodId) ??
      paymentMethods.defaultMethod,
    [paymentMethods.methods, paymentMethods.defaultMethod, checkout.paymentMethodId],
  );

  const selectedShippingMethod = useMemo(
    () =>
      cart.shippingMethods.find((s) => s.id === checkout.shippingMethodId) ??
      cart.shippingMethods[0],
    [cart.shippingMethods, checkout.shippingMethodId],
  );

  const totals = useMemo(
    () => computeCartTotals(cart.items, cart.voucher, selectedShippingMethod),
    [cart.items, cart.voucher, selectedShippingMethod],
  );

  const handleChangeAddress = useCallback(() => {
    router.push('/shipping-address');
  }, [router]);

  const handleChangePayment = useCallback(() => {
    router.push('/payment-method');
  }, [router]);

  const handleConfirmPayment = useCallback(async () => {
    if (checkout.placing) return;

    if (!selectedAddress) {
      const msg = 'Vui lòng chọn hoặc thêm địa chỉ giao hàng trước khi đặt hàng.';
      setSubmitError(msg);
      Alert.alert(
        'Chưa có địa chỉ giao hàng',
        msg,
        [
          { text: 'Để sau', style: 'cancel' },
          { text: 'Thêm địa chỉ', onPress: handleChangeAddress },
        ],
      );
      return;
    }

    if (!selectedPayment) {
      setSubmitError('Vui lòng chọn phương thức thanh toán.');
      return;
    }

    if (selectedItems.length === 0) {
      setSubmitError('Giỏ hàng trống hoặc chưa chọn sản phẩm.');
      return;
    }

    setSubmitError('');
    try {
      await checkout.placeOrder();
      router.replace('/checkout-success');
    } catch (error: any) {
      const errMsg = error?.message || 'Đã có lỗi xảy ra.';
      if (error?.code === 'OUT_OF_STOCK' || errMsg.includes('kho') || errMsg.includes('tồn kho')) {
        Alert.alert(
          'Sản phẩm đã hết hàng',
          errMsg + '\n\nVui lòng kiểm tra lại giỏ hàng của bạn.',
          [
            { text: 'Về giỏ hàng', onPress: () => router.replace('/cart') },
            { text: 'Đóng', style: 'cancel' },
          ],
        );
      } else if (error?.code === 'PAYMENT_FAILED') {
        Alert.alert(
          'Thanh toán không thành công',
          'Giao dịch thanh toán trực tuyến bị gián đoạn. Bạn có muốn đổi sang phương thức Thanh toán khi nhận hàng (COD) không?',
          [
            { text: 'Đổi phương thức thanh toán', onPress: handleChangePayment },
            { text: 'Thử lại sau', style: 'cancel' },
          ],
        );
      } else {
        setSubmitError(errMsg);
      }
    }
  }, [
    checkout,
    selectedAddress,
    selectedPayment,
    selectedItems.length,
    router,
  ]);

  if (isGuestUser) {
    return (
      <SafeAreaView style={styles.safeArea} edges={['top', 'bottom']}>
        <ScreenHeader title="Thanh toán" subtitle="Yêu cầu đăng nhập" />
        <EmptyState
          icon="lock-closed-outline"
          title="Yêu cầu đăng nhập"
          subtitle="Vui lòng đăng nhập tài khoản để tiến hành đặt hàng."
          actionLabel="Đăng nhập ngay"
          onAction={() => router.replace('/(auth)/login')}
        />
      </SafeAreaView>
    );
  }

  if (addresses.loading || paymentMethods.loading) {
    return <LoadingView label="Đang tải thông tin thanh toán..." />;
  }

  if (cart.items.length === 0 || selectedItems.length === 0) {
    return (
      <SafeAreaView style={styles.safeArea} edges={['top', 'bottom']}>
        <ScreenHeader title="Thanh toán" subtitle="Thanh toán & Giao hàng" />
        <EmptyState
          icon="cart-outline"
          title="Giỏ hàng trống"
          subtitle="Bạn chưa chọn sản phẩm nào để thanh toán."
          actionLabel="Đi tới giỏ hàng"
          onAction={() => router.replace('/cart')}
        />
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.safeArea} edges={['top', 'bottom']}>
      <ScreenHeader title="Thanh toán" subtitle="Thanh toán & Giao hàng" />

      <ScrollView
        style={styles.scroll}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {/* ============ ĐỊA CHỈ GIAO HÀNG ============ */}
        <View style={styles.card}>
          <View style={styles.cardHeaderRow}>
            <View style={styles.cardHeaderLeft}>
              <View style={styles.iconBadge}>
                <Ionicons name="location" size={17} color={colors.primary} />
              </View>
              <Text style={styles.cardTitle}>Địa chỉ giao hàng</Text>
            </View>

            {selectedAddress ? (
              <Pressable
                onPress={handleChangeAddress}
                style={({ pressed }) => [styles.changeButton, pressed && styles.pressed]}
                accessibilityRole="button"
                accessibilityLabel="Thay đổi địa chỉ giao hàng"
              >
                <Ionicons name="pencil" size={13} color={colors.primary} />
                <Text style={styles.changeText}>Thay đổi</Text>
              </Pressable>
            ) : null}
          </View>

          {selectedAddress ? (
            <>
              <View style={styles.nameRow}>
                <Text style={styles.name}>{selectedAddress.fullName}</Text>
                <View style={styles.tag}>
                  <Text style={styles.tagText}>{selectedAddress.label.toUpperCase()}</Text>
                </View>
              </View>
              <Text style={styles.address}>{selectedAddress.address}</Text>
              <View style={styles.phoneRow}>
                <Ionicons name="call-outline" size={13} color={colors.gray} />
                <Text style={styles.phone}>{selectedAddress.phone}</Text>
              </View>
            </>
          ) : (
            <EmptyState
              icon="location-outline"
              title="Chưa có địa chỉ"
              subtitle="Bạn cần thêm địa chỉ giao hàng."
              actionLabel="Thêm địa chỉ"
              onAction={handleChangeAddress}
            />
          )}
        </View>

        {/* ============ PHƯƠNG THỨC GIAO HÀNG ============ */}
        <View style={styles.card}>
          <View style={styles.cardHeaderLeft}>
            <View style={styles.iconBadge}>
              <Ionicons name="cube" size={17} color={colors.primary} />
            </View>
            <Text style={styles.cardTitle}>Phương thức giao hàng</Text>
          </View>

          {cart.shippingMethods.map((method) => {
            const isSelected = checkout.shippingMethodId === method.id;
            const methodTotals = computeCartTotals(cart.items, cart.voucher, method);
            const isFree = methodTotals.shippingFee === 0;

            return (
              <Pressable
                key={method.id}
                onPress={() => checkout.setShippingMethodId(method.id)}
                style={({ pressed }) => [
                  styles.option,
                  isSelected && styles.optionActive,
                  pressed && styles.pressed,
                ]}
                accessibilityRole="button"
                accessibilityLabel={method.name}
                accessibilityState={{ selected: isSelected }}
              >
                <View style={[styles.radio, isSelected && styles.radioActive]}>
                  {isSelected ? <View style={styles.radioDot} /> : null}
                </View>

                <View style={styles.optionBody}>
                  <Text style={styles.optionTitle}>
                    {method.name} ({method.estimatedDays})
                  </Text>
                  <Text style={styles.optionDesc}>{method.description}</Text>
                </View>

                <Text style={isFree ? styles.freeText : styles.feeText}>
                  {isFree ? 'MIỄN PHÍ' : formatMoney(methodTotals.shippingFee)}
                </Text>
              </Pressable>
            );
          })}
        </View>

        {/* ============ PHƯƠNG THỨC THANH TOÁN ============ */}
        <View style={styles.card}>
          <View style={styles.cardHeaderRow}>
            <View style={styles.cardHeaderLeft}>
              <View style={styles.iconBadge}>
                <Ionicons name="card" size={17} color={colors.primary} />
              </View>
              <Text style={styles.cardTitle}>Phương thức thanh toán</Text>
            </View>

            <Pressable
              onPress={handleChangePayment}
              style={({ pressed }) => [styles.changeButton, pressed && styles.pressed]}
              accessibilityRole="button"
              accessibilityLabel="Thay đổi phương thức thanh toán"
            >
              <Ionicons name="pencil" size={13} color={colors.primary} />
              <Text style={styles.changeText}>Thay đổi</Text>
            </Pressable>
          </View>

          {selectedPayment ? (
            <View style={styles.paymentSelected}>
              <View style={styles.payIconBadge}>
                <Ionicons
                  name={getPaymentIcon(selectedPayment.type)}
                  size={16}
                  color={colors.primary}
                />
              </View>
              <View style={styles.optionBody}>
                <Text style={styles.optionTitle}>{selectedPayment.name}</Text>
                <Text style={styles.optionDesc}>{selectedPayment.detail}</Text>
              </View>
            </View>
          ) : (
            <EmptyState
              icon="card-outline"
              title="Chưa có phương thức thanh toán"
              subtitle="Vui lòng thêm một phương thức thanh toán."
              actionLabel="Thêm phương thức"
              onAction={handleChangePayment}
            />
          )}
        </View>

        {/* ============ MÃ GIẢM GIÁ / VOUCHER ============ */}
        <View style={styles.card}>
          <View style={styles.cardHeaderLeft}>
            <View style={styles.iconBadge}>
              <Ionicons name="pricetag" size={17} color={colors.primary} />
            </View>
            <Text style={styles.cardTitle}>Mã ưu đãi / Voucher</Text>
          </View>

          {cart.voucher ? (
            <View style={styles.voucherAppliedRow}>
              <View style={styles.voucherAppliedInfo}>
                <View style={styles.voucherBadge}>
                  <Text style={styles.voucherBadgeText}>{cart.voucher.code}</Text>
                </View>
                <Text style={styles.voucherDescText} numberOfLines={1}>
                  {cart.voucher.title || `Giảm ${formatMoney(totals.discount)}`}
                </Text>
              </View>

              <Pressable
                onPress={handleRemoveVoucher}
                style={({ pressed }) => [styles.removeVoucherBtn, pressed && styles.pressed]}
                accessibilityRole="button"
                accessibilityLabel="Hủy áp dụng mã ưu đãi"
              >
                <Ionicons name="close-circle-outline" size={16} color={colors.danger} />
                <Text style={styles.removeVoucherText}>Hủy</Text>
              </Pressable>
            </View>
          ) : (
            <View style={styles.voucherInputWrap}>
              <View style={styles.voucherInputRow}>
                <TextInput
                  style={styles.voucherInput}
                  placeholder="Nhập mã ưu đãi..."
                  placeholderTextColor={colors.textMuted}
                  value={voucherCodeInput}
                  onChangeText={(text) => {
                    setVoucherCodeInput(text.toUpperCase());
                    if (voucherError) setVoucherError('');
                  }}
                  autoCapitalize="characters"
                />
                <Pressable
                  onPress={handleApplyVoucher}
                  disabled={applyingVoucher || !voucherCodeInput.trim()}
                  style={({ pressed }) => [
                    styles.applyVoucherBtn,
                    (!voucherCodeInput.trim() || applyingVoucher) && styles.applyVoucherBtnDisabled,
                    pressed && styles.pressed,
                  ]}
                  accessibilityRole="button"
                  accessibilityLabel="Áp dụng mã ưu đãi"
                >
                  <Text style={styles.applyVoucherText}>
                    {applyingVoucher ? '...' : 'Áp dụng'}
                  </Text>
                </Pressable>
              </View>

              {voucherError ? (
                <Text style={styles.voucherErrorText}>{voucherError}</Text>
              ) : null}
            </View>
          )}
        </View>

        {/* ============ TÓM TẮT THANH TOÁN ============ */}
        <View style={styles.card}>
          <View style={styles.cardHeaderLeft}>
            <View style={styles.iconBadge}>
              <Ionicons name="receipt" size={17} color={colors.primary} />
            </View>
            <Text style={styles.cardTitle}>Tóm tắt thanh toán</Text>
          </View>

          <View style={styles.summaryRow}>
            <Text style={styles.summaryLabel}>Tạm tính ({selectedCount} sản phẩm)</Text>
            <Text style={styles.summaryValue}>{formatMoney(totals.subtotal)}</Text>
          </View>

          {totals.discount > 0 ? (
            <View style={styles.summaryRow}>
              <Text style={styles.summaryLabel}>Giảm giá</Text>
              <Text style={[styles.summaryValue, styles.discountText]}>
                -{formatMoney(totals.discount)}
              </Text>
            </View>
          ) : null}

          <View style={styles.summaryRow}>
            <Text style={styles.summaryLabel}>Phí vận chuyển</Text>
            <Text style={[styles.summaryValue, totals.shippingFee === 0 && styles.freeValue]}>
              {totals.shippingFee === 0 ? 'Miễn phí' : formatMoney(totals.shippingFee)}
            </Text>
          </View>

          <View style={styles.summaryRow}>
            <Text style={styles.summaryLabel}>Thuế (8%)</Text>
            <Text style={styles.summaryValue}>{formatMoney(totals.tax)}</Text>
          </View>

          <View style={styles.divider} />

          <View style={styles.summaryRow}>
            <Text style={styles.totalLabel}>Tổng cộng</Text>
            <Text style={styles.totalValue}>{formatMoney(totals.total)}</Text>
          </View>
        </View>
      </ScrollView>

      {/* ============ THANH TOÁN ============ */}
      <View style={styles.bottomBar}>
        {submitError ? (
          <Text style={styles.errorText} accessibilityLiveRegion="polite">
            {submitError}
          </Text>
        ) : null}

        <Pressable
          onPress={handleConfirmPayment}
          disabled={checkout.placing}
          style={({ pressed }) => [
            styles.payButton,
            (checkout.placing || selectedItems.length === 0) && styles.payButtonDisabled,
            pressed && styles.pressed,
          ]}
          accessibilityRole="button"
          accessibilityLabel="Xác nhận và thanh toán"
          accessibilityState={{ disabled: checkout.placing || selectedItems.length === 0, busy: checkout.placing }}
        >
          <Text style={styles.payButtonText} numberOfLines={1}>
            {checkout.placing
              ? 'Đang xử lý...'
              : `Xác nhận & Thanh toán · ${formatMoney(totals.total)}`}
          </Text>
          {!checkout.placing ? (
            <Ionicons name="chevron-forward" size={18} color={colors.white} />
          ) : null}
        </Pressable>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: colors.background,
  },

  /* ---------- Header ---------- */
  scroll: {
    flex: 1,
  },
  scrollContent: {
    paddingHorizontal: spacing.xl,
    paddingBottom: spacing.xl,
  },

  /* ---------- Card ---------- */
  card: {
    backgroundColor: colors.card,
    borderRadius: radius.lg,
    padding: spacing.lg,
    marginBottom: spacing.md,
    borderWidth: 1,
    borderColor: colors.border,
    shadowColor: colors.dark,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.04,
    shadowRadius: 10,
    elevation: 2,
  },
  cardHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: spacing.md,
  },
  cardHeaderLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 2,
  },
  iconBadge: {
    width: 32,
    height: 32,
    borderRadius: radius.sm,
    backgroundColor: colors.primarySoft,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: spacing.sm,
  },
  cardTitle: {
    fontSize: 15,
    fontWeight: '700',
    color: colors.dark,
  },

  /* ---------- Địa chỉ ---------- */
  changeButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: spacing.sm,
    paddingHorizontal: spacing.md,
    borderRadius: radius.md,
    backgroundColor: colors.primarySoft,
    minHeight: 44,
  },
  changeText: {
    marginLeft: 4,
    fontSize: 12.5,
    fontWeight: '700',
    color: colors.primary,
  },
  nameRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: spacing.md,
    marginBottom: spacing.sm,
  },
  name: {
    fontSize: 15,
    fontWeight: '700',
    color: colors.dark,
  },
  tag: {
    marginLeft: spacing.sm,
    paddingHorizontal: spacing.sm,
    paddingVertical: 3,
    borderRadius: radius.sm,
    backgroundColor: colors.border,
  },
  tagText: {
    fontSize: 10,
    fontWeight: '800',
    letterSpacing: 0.5,
    color: colors.textSecondary,
  },
  address: {
    fontSize: 13.5,
    lineHeight: 20,
    color: colors.textSecondary,
  },
  phoneRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: spacing.sm,
  },
  phone: {
    marginLeft: 6,
    fontSize: 13.5,
    fontWeight: '600',
    color: colors.textSecondary,
  },

  /* ---------- Option ---------- */
  option: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: spacing.md,
    marginTop: spacing.sm,
    borderRadius: radius.md,
    borderWidth: 1.5,
    borderColor: colors.border,
    backgroundColor: '#FBFCFD',
    minHeight: 56,
  },
  optionActive: {
    borderColor: colors.primary,
    backgroundColor: colors.primarySoft,
  },
  radio: {
    width: 20,
    height: 20,
    borderRadius: 10,
    borderWidth: 1.5,
    borderColor: colors.grayLight,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: spacing.md,
  },
  radioActive: {
    borderColor: colors.primary,
  },
  radioDot: {
    width: 10,
    height: 10,
    borderRadius: 5,
    backgroundColor: colors.primary,
  },
  payIconBadge: {
    width: 30,
    height: 30,
    borderRadius: radius.sm,
    backgroundColor: colors.card,
    borderWidth: 1,
    borderColor: colors.border,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: spacing.sm,
  },
  optionBody: {
    flex: 1,
    paddingRight: 6,
  },
  optionTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: colors.dark,
  },
  optionDesc: {
    marginTop: 2,
    fontSize: 12,
    color: colors.textMuted,
  },
  freeText: {
    fontSize: 12.5,
    fontWeight: '800',
    color: colors.success,
  },
  feeText: {
    fontSize: 13,
    fontWeight: '700',
    color: colors.dark,
  },

  /* ---------- Payment selected ---------- */
  paymentSelected: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: spacing.md,
  },

  /* ---------- Tóm tắt ---------- */
  summaryRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 6,
  },
  summaryLabel: {
    fontSize: 14,
    color: colors.textSecondary,
  },
  summaryValue: {
    fontSize: 14,
    fontWeight: '600',
    color: colors.dark,
  },
  discountText: {
    color: colors.success,
  },
  freeValue: {
    fontWeight: '700',
    color: colors.success,
  },
  divider: {
    height: 1,
    backgroundColor: colors.border,
    marginVertical: spacing.md,
  },
  totalLabel: {
    fontSize: 16,
    fontWeight: '800',
    color: colors.dark,
  },
  totalValue: {
    fontSize: 18,
    fontWeight: '800',
    color: colors.primary,
  },

  /* ---------- Bottom bar ---------- */
  bottomBar: {
    paddingHorizontal: spacing.xl,
    paddingTop: spacing.md,
    paddingBottom: spacing.sm,
    backgroundColor: colors.card,
    borderTopWidth: 1,
    borderTopColor: colors.border,
  },
  errorText: {
    fontSize: 12.5,
    color: colors.danger,
    fontWeight: '600',
    marginBottom: spacing.sm,
  },
  payButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.primary,
    borderRadius: radius.lg,
    paddingVertical: spacing.md,
    paddingHorizontal: spacing.lg,
    minHeight: 52,
    shadowColor: colors.primary,
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.28,
    shadowRadius: 12,
    elevation: 6,
  },
  payButtonDisabled: {
    opacity: 0.6,
  },
  payButtonText: {
    flexShrink: 1,
    color: colors.white,
    fontSize: 15.5,
    fontWeight: '800',
    marginRight: 6,
  },
  pressed: {
    opacity: 0.85,
  },

  /* ---------- Voucher Card ---------- */
  voucherAppliedRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: colors.primarySoft,
    padding: spacing.md,
    borderRadius: radius.md,
    marginTop: spacing.xs,
  },
  voucherAppliedInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
    marginRight: spacing.sm,
  },
  voucherBadge: {
    backgroundColor: colors.primary,
    paddingHorizontal: spacing.sm,
    paddingVertical: 3,
    borderRadius: radius.sm,
    marginRight: spacing.sm,
  },
  voucherBadgeText: {
    color: colors.white,
    fontSize: 12,
    fontWeight: '800',
  },
  voucherDescText: {
    flex: 1,
    fontSize: 13,
    color: colors.dark,
    fontWeight: '600',
  },
  removeVoucherBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 4,
    paddingHorizontal: 8,
    borderRadius: radius.sm,
  },
  removeVoucherText: {
    marginLeft: 3,
    fontSize: 12,
    fontWeight: '700',
    color: colors.danger,
  },
  voucherInputWrap: {
    marginTop: spacing.xs,
  },
  voucherInputRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
  },
  voucherInput: {
    flex: 1,
    backgroundColor: '#F8F9FA',
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: radius.md,
    paddingHorizontal: spacing.md,
    paddingVertical: 10,
    fontSize: 13.5,
    color: colors.dark,
    fontWeight: '600',
  },
  applyVoucherBtn: {
    backgroundColor: colors.primary,
    paddingHorizontal: spacing.lg,
    paddingVertical: 11,
    borderRadius: radius.md,
    alignItems: 'center',
    justifyContent: 'center',
  },
  applyVoucherBtnDisabled: {
    opacity: 0.5,
  },
  applyVoucherText: {
    color: colors.white,
    fontSize: 13,
    fontWeight: '700',
  },
  voucherErrorText: {
    fontSize: 12,
    color: colors.danger,
    marginTop: 6,
    fontWeight: '500',
  },
});
