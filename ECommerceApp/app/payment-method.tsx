import React, { useCallback, useState } from 'react';
import {
  Modal,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';

import { colors, radius, spacing } from '../src/constants/theme';
import { usePaymentMethods } from '../src/context/PaymentMethodsContext';
import { useCheckout } from '../src/context/CheckoutContext';
import {
  Chip,
  ConfirmSheet,
  EmptyState,
  FormField,
  LoadingView,
  PrimaryButton,
  ScreenHeader,
  SecondaryButton,
  Toast,
} from '../src/components';
import { PaymentMethod, PaymentMethodType } from '../src/types';

type IoniconName = keyof typeof Ionicons.glyphMap;

/* -------------------------------------------------------------------------- */
/*                          Brand metas & helpers                              */
/* -------------------------------------------------------------------------- */

type PaymentBrandKey = 'momo' | 'vietcombank' | 'bidv' | 'vietinbank' | 'agribank' | 'cod';

interface PaymentBrandOption {
  key: PaymentBrandKey;
  label: string;
  type: PaymentMethodType;
  color: string;
  shortName: string;
  placeholder: string;
}

const PAYMENT_BRANDS: PaymentBrandOption[] = [
  {
    key: 'momo',
    label: 'Ví MoMo',
    type: 'wallet',
    color: '#D82D8B',
    shortName: 'MOMO',
    placeholder: 'Số điện thoại liên kết',
  },
  {
    key: 'vietcombank',
    label: 'Vietcombank',
    type: 'card',
    color: '#006837',
    shortName: 'VIETCOMBANK',
    placeholder: 'Số thẻ',
  },
  {
    key: 'bidv',
    label: 'BIDV',
    type: 'card',
    color: '#003B70',
    shortName: 'BIDV',
    placeholder: 'Số thẻ',
  },
  {
    key: 'vietinbank',
    label: 'VietinBank',
    type: 'card',
    color: '#005596',
    shortName: 'VIETINBANK',
    placeholder: 'Số thẻ',
  },
  {
    key: 'agribank',
    label: 'Agribank',
    type: 'card',
    color: '#8A151B',
    shortName: 'AGRIBANK',
    placeholder: 'Số thẻ',
  },
];

function getBrandMeta(method: PaymentMethod | null): { color: string; shortName: string } {
  if (!method) return { color: colors.primary, shortName: 'PAY' };

  if (method.type === 'cod') {
    return { color: method.color ?? '#1E293B', shortName: 'COD' };
  }

  const brand = PAYMENT_BRANDS.find((b) => b.label === method.name);
  const fallbackShortName = method.name.slice(0, 4).toUpperCase();

  return {
    color: method.color ?? brand?.color ?? colors.primary,
    shortName: brand?.shortName ?? fallbackShortName,
  };
}

function getPaymentIcon(type: PaymentMethodType): IoniconName {
  switch (type) {
    case 'card':
      return 'card-outline';
    case 'wallet':
      return 'wallet-outline';
    case 'cod':
      return 'cash-outline' as IoniconName;
    default:
      return 'card-outline';
  }
}

function maskNumber(raw: string): string {
  const last4 = raw.replace(/\s/g, '').slice(-4);
  return last4 ? `•••• ${last4}` : raw;
}

function getCardNumber(method: PaymentMethod | null): string {
  if (!method) return '•••• •••• •••• 1234';
  if (method.type === 'cod') return 'Thanh toán khi nhận hàng';

  const last4 = method.detail.replace(/\s/g, '').replace(/[^0-9]/g, '').slice(-4);
  return last4 ? `•••• •••• •••• ${last4}` : method.detail;
}

/* -------------------------------------------------------------------------- */
/*                                  Screen                                    */
/* -------------------------------------------------------------------------- */

export default function PaymentMethodScreen() {
  const router = useRouter();
  const checkout = useCheckout();
  const {
    methods,
    defaultMethod,
    loading,
    addMethod,
    removeMethod,
    setDefault,
  } = usePaymentMethods();

  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [methodToDelete, setMethodToDelete] = useState<PaymentMethod | null>(null);
  const [showAddModal, setShowAddModal] = useState(false);
  const [selectedBrandKey, setSelectedBrandKey] = useState<PaymentBrandKey | null>(null);
  const [formHolderName, setFormHolderName] = useState('');
  const [formDetail, setFormDetail] = useState('');
  const [formExpiry, setFormExpiry] = useState('');
  const [formError, setFormError] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [confirming, setConfirming] = useState(false);
  const [toastVisible, setToastVisible] = useState(false);
  const [toastMessage, setToastMessage] = useState('');

  const selectedMethod =
    methods.find((m) => m.id === selectedId) ?? defaultMethod ?? methods[0] ?? null;

  const showToast = useCallback((message: string) => {
    setToastMessage(message);
    setToastVisible(true);
  }, []);

  const openAddModal = useCallback(() => {
    setSelectedBrandKey(null);
    setFormHolderName('');
    setFormDetail('');
    setFormExpiry('');
    setFormError('');
    setShowAddModal(true);
  }, []);

  const handleAddMethod = useCallback(async () => {
    if (!selectedBrandKey) {
      setFormError('Vui lòng chọn hình thức thanh toán.');
      return;
    }
    const brand = PAYMENT_BRANDS.find((b) => b.key === selectedBrandKey);
    if (!brand) return;

    const detailRaw = formDetail.trim();
    const expiry = formExpiry.trim();
    const holder = formHolderName.trim().toUpperCase();

    if (!detailRaw || !expiry) {
      setFormError('Vui lòng nhập đầy đủ thông tin.');
      return;
    }
    if (brand.type === 'card' && !holder) {
      setFormError('Vui lòng nhập tên in trên thẻ.');
      return;
    }
    if (brand.type === 'card') {
      const digits = detailRaw.replace(/\D/g, '');
      if (digits.length < 12 || digits.length > 19) {
        setFormError('Số thẻ không hợp lệ (cần từ 12-19 chữ số).');
        return;
      }
      if (!/^\d{2}\/\d{2}$/.test(expiry)) {
        setFormError('Hạn sử dụng thẻ phải theo định dạng MM/YY.');
        return;
      }
    }

    setSubmitting(true);
    try {
      await addMethod({
        type: brand.type,
        name: brand.label,
        detail: `${brand.label} ${maskNumber(detailRaw)}`,
        expiry,
        isDefault: false,
        color: brand.color,
        holderName: holder || 'CHỦ THẺ',
      });
      setShowAddModal(false);
      showToast('Đã thêm phương thức thanh toán');
    } catch (e) {
      setFormError(e instanceof Error ? e.message : 'Có lỗi khi thêm phương thức.');
    } finally {
      setSubmitting(false);
    }
  }, [addMethod, selectedBrandKey, formDetail, formExpiry, formHolderName, showToast]);

  const handleDeleteMethod = useCallback(
    (method: PaymentMethod) => setMethodToDelete(method),
    [],
  );

  const confirmDelete = useCallback(async () => {
    if (!methodToDelete) return;
    setSubmitting(true);
    try {
      await removeMethod(methodToDelete.id);
      if (selectedId === methodToDelete.id) {
        setSelectedId(null);
      }
      setMethodToDelete(null);
      showToast('Đã xoá phương thức thanh toán');
    } finally {
      setSubmitting(false);
    }
  }, [methodToDelete, removeMethod, selectedId, showToast]);

  const handleConfirm = useCallback(async () => {
    if (!selectedMethod) {
      showToast('Vui lòng chọn phương thức thanh toán.');
      return;
    }
    setConfirming(true);
    try {
      await setDefault(selectedMethod.id);
      if (checkout?.setPaymentMethodId) {
        checkout.setPaymentMethodId(selectedMethod.id);
      }
      showToast('Đã chọn phương thức thanh toán');
      router.back();
    } catch {
      router.back();
    } finally {
      setConfirming(false);
    }
  }, [selectedMethod, setDefault, checkout, router, showToast]);

  const selectedIsDefault = selectedMethod && defaultMethod?.id === selectedMethod.id;
  const selectedBrandMeta = getBrandMeta(selectedMethod);

  return (
    <SafeAreaView style={styles.safeArea} edges={['top', 'bottom']}>
      <ScreenHeader title="Phương thức thanh toán" />

      {loading ? (
        <LoadingView label="Đang tải phương thức..." />
      ) : methods.length === 0 ? (
        <EmptyState
          icon="card-outline"
          title="Chưa có phương thức"
          subtitle="Thêm thẻ hoặc ví để thanh toán nhanh hơn."
          actionLabel="Thêm ngay"
          onAction={openAddModal}
        />
      ) : (
        <ScrollView
          style={styles.scroll}
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}
        >
          {/* Card preview */}
          {selectedMethod?.type === 'cod' ? (
            <View style={[styles.cardMockup, styles.cardMockupCod]}>
              <View style={styles.cardOverlay} />
              <View style={styles.cardDecorationOne} />
              <View style={styles.cardDecorationTwo} />

              <View style={styles.cardTopRow}>
                <View style={styles.codIconBadge}>
                  <Ionicons name="cash" size={26} color="#10B981" />
                </View>
                <View style={styles.cardBrandRow}>
                  <Text style={styles.cardBrandText}>COD</Text>
                  <Ionicons name="shield-checkmark" size={20} color="rgba(255,255,255,0.85)" />
                </View>
              </View>

              <Text style={styles.codTitle}>THANH TOÁN KHI NHẬN HÀNG</Text>
              <Text style={styles.codSubtitle}>
                Trả tiền mặt trực tiếp cho nhân viên giao vận khi nhận kiện hàng tận nơi. An toàn & tiện lợi.
              </Text>

              {selectedIsDefault ? (
                <View style={styles.defaultBadge}>
                  <Ionicons name="checkmark" size={12} color={colors.primary} />
                  <Text style={styles.defaultBadgeText}>MẶC ĐỊNH</Text>
                </View>
              ) : null}
            </View>
          ) : (
            <View style={[styles.cardMockup, { backgroundColor: selectedBrandMeta.color }]}>
              <View style={styles.cardOverlay} />
              <View style={styles.cardDecorationOne} />
              <View style={styles.cardDecorationTwo} />

              <View style={styles.cardTopRow}>
                <View style={styles.chip}>
                  <View style={styles.chipLine} />
                  <View style={styles.chipLine} />
                </View>

                <View style={styles.cardBrandRow}>
                  <Text style={styles.cardBrandText}>{selectedBrandMeta.shortName}</Text>
                  <Ionicons name="wifi-outline" size={22} color="rgba(255,255,255,0.75)" />
                </View>
              </View>

              <Text style={styles.cardNumber}>{getCardNumber(selectedMethod)}</Text>

              <View style={styles.cardBottomRow}>
                <View>
                  <Text style={styles.cardLabel}>CHỦ THẺ</Text>
                  <Text style={styles.cardValue}>
                    {selectedMethod?.holderName || 'NGUYEN VAN A'}
                  </Text>
                </View>
                {selectedMethod?.expiry ? (
                  <View style={styles.cardExpiryBlock}>
                    <Text style={styles.cardLabel}>HẾT HẠN</Text>
                    <Text style={styles.cardValue}>{selectedMethod.expiry}</Text>
                  </View>
                ) : null}
              </View>

              {selectedIsDefault ? (
                <View style={styles.defaultBadge}>
                  <Ionicons name="checkmark" size={12} color={colors.primary} />
                  <Text style={styles.defaultBadgeText}>MẶC ĐỊNH</Text>
                </View>
              ) : null}
            </View>
          )}

          <Text style={styles.sectionTitle}>PHƯƠNG THỨC ĐÃ LƯU</Text>

          {methods.map((method) => {
            const isSelected = selectedMethod?.id === method.id;
            const meta = getBrandMeta(method);
            const isCod = method.id === 'pay-cod' || method.type === 'cod';
            return (
              <View key={method.id} style={[styles.optionRow, isSelected && styles.optionRowActive]}>
                <Pressable
                  style={styles.optionMainPress}
                  onPress={() => setSelectedId(method.id)}
                  accessibilityRole="button"
                  accessibilityLabel={`Chọn ${method.name}`}
                  accessibilityState={{ selected: isSelected }}
                >
                  <View style={[styles.optionIconBox, { backgroundColor: meta.color }]}>
                    <Text style={styles.optionIconText}>{meta.shortName}</Text>
                  </View>

                  <View style={styles.optionTextBlock}>
                    <Text style={[styles.optionTitle, isSelected && styles.optionTitleActive]}>
                      {method.name}
                    </Text>
                    <Text style={styles.optionSubtitle}>
                      {method.detail}{method.expiry ? ` • ${method.expiry}` : ''}
                    </Text>
                  </View>

                  <View style={[styles.radioOuter, isSelected && styles.radioOuterActive]}>
                    {isSelected ? <View style={styles.radioInner} /> : null}
                  </View>
                </Pressable>

                <View style={styles.optionActions}>
                  {method.isDefault ? (
                    <View style={styles.defaultPill}>
                      <Text style={styles.defaultPillText}>Mặc định</Text>
                    </View>
                  ) : (
                    <Pressable
                      onPress={async () => {
                        await setDefault(method.id);
                        showToast(`Đã đặt ${method.name} làm mặc định`);
                      }}
                      style={({ pressed }) => [styles.setDefaultBtn, pressed && styles.pressed]}
                      hitSlop={6}
                      accessibilityRole="button"
                    >
                      <Text style={styles.setDefaultBtnText}>Đặt mặc định</Text>
                    </Pressable>
                  )}

                  {!isCod ? (
                    <Pressable
                      onPress={() => handleDeleteMethod(method)}
                      style={({ pressed }) => [styles.deleteButton, pressed && styles.pressed]}
                      hitSlop={8}
                      accessibilityRole="button"
                      accessibilityLabel={`Xoá ${method.name}`}
                    >
                      <Ionicons name="trash-outline" size={16} color={colors.primary} />
                    </Pressable>
                  ) : null}
                </View>
              </View>
            );
          })}

          <Pressable
            onPress={openAddModal}
            style={({ pressed }) => [styles.addNewCard, pressed && styles.pressed]}
            accessibilityRole="button"
            accessibilityLabel="Thêm phương thức thanh toán"
          >
            <Ionicons name="add" size={18} color={colors.primary} />
            <Text style={styles.addNewCardText}>Thêm phương thức mới</Text>
          </Pressable>
        </ScrollView>
      )}

      <View style={styles.footer}>
        <PrimaryButton
          title="Xác nhận"
          onPress={handleConfirm}
          loading={confirming}
          icon="arrow-forward"
          style={styles.confirmButton}
        />
      </View>

      <ConfirmSheet
        visible={methodToDelete !== null}
        title="Xoá phương thức?"
        message={
          methodToDelete
            ? `Bạn có chắc muốn xoá ${methodToDelete.name} (${methodToDelete.detail})?`
            : ''
        }
        confirmText="Xoá"
        cancelText="Huỷ"
        danger
        onConfirm={confirmDelete}
        onCancel={() => setMethodToDelete(null)}
      />

      {/* Modal thêm mới */}
      <Modal
        visible={showAddModal}
        animationType="slide"
        transparent
        onRequestClose={() => setShowAddModal(false)}
      >
        <View style={styles.modalBackdrop}>
          <View style={styles.modalCard}>
            <Text style={styles.modalTitle}>Thêm phương thức thanh toán</Text>

            <Text style={styles.modalSectionLabel}>Chọn hình thức</Text>
            <View style={styles.brandGrid}>
              {PAYMENT_BRANDS.map((brand) => {
                const isActive = selectedBrandKey === brand.key;
                return (
                  <Pressable
                    key={brand.key}
                    onPress={() => setSelectedBrandKey(brand.key)}
                    style={({ pressed }) => [
                      styles.brandOption,
                      { backgroundColor: brand.color },
                      isActive && styles.brandOptionActive,
                      pressed && styles.pressed,
                    ]}
                    accessibilityRole="button"
                    accessibilityLabel={brand.label}
                    accessibilityState={{ selected: isActive }}
                  >
                    <Text style={styles.brandOptionText}>{brand.shortName}</Text>
                    {isActive ? (
                      <Ionicons
                        name="checkmark-circle"
                        size={20}
                        color={colors.white}
                        style={styles.brandCheck}
                      />
                    ) : null}
                  </Pressable>
                );
              })}
            </View>

            {selectedBrandKey && PAYMENT_BRANDS.find((b) => b.key === selectedBrandKey)?.type === 'card' ? (
              <FormField
                label="Tên in trên thẻ (không dấu)"
                value={formHolderName}
                onChangeText={(t) => setFormHolderName(t.toUpperCase())}
                placeholder="Ví dụ: NGUYEN VAN A"
                autoCapitalize="characters"
              />
            ) : null}

            <FormField
              label={
                selectedBrandKey
                  ? PAYMENT_BRANDS.find((b) => b.key === selectedBrandKey)?.placeholder ?? 'Số thẻ'
                  : 'Số thẻ / SĐT'
              }
              value={formDetail}
              onChangeText={setFormDetail}
              placeholder="Nhập số thẻ hoặc số điện thoại"
              keyboardType="number-pad"
            />
            <FormField
              label="Hạn sử dụng (MM/YY)"
              value={formExpiry}
              onChangeText={setFormExpiry}
              placeholder="Ví dụ: 09/28"
              keyboardType="numbers-and-punctuation"
            />

            {formError ? <Text style={styles.formError}>{formError}</Text> : null}

            <View style={styles.modalActions}>
              <SecondaryButton
                title="Huỷ"
                onPress={() => setShowAddModal(false)}
                style={styles.modalButton}
              />
              <PrimaryButton
                title="Thêm"
                onPress={handleAddMethod}
                loading={submitting}
                disabled={submitting}
                style={styles.modalButton}
              />
            </View>
          </View>
        </View>
      </Modal>

      <Toast
        visible={toastVisible}
        message={toastMessage}
        onHide={() => setToastVisible(false)}
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: colors.background,
  },
  scroll: {
    flex: 1,
  },
  scrollContent: {
    paddingHorizontal: spacing.lg,
    paddingBottom: spacing.xxl,
  },

  /* Card preview */
  cardMockup: {
    borderRadius: radius.xl,
    paddingHorizontal: spacing.xl,
    paddingVertical: spacing.xl,
    marginTop: spacing.sm,
    overflow: 'hidden',
    ...Platform.select({
      ios: {
        shadowColor: '#1A1A1A',
        shadowOffset: { width: 0, height: 10 },
        shadowOpacity: 0.22,
        shadowRadius: 18,
      },
      android: {
        elevation: 6,
      },
    }),
  },
  cardMockupCod: {
    backgroundColor: '#0F172A',
  },
  codIconBadge: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: 'rgba(16, 185, 129, 0.15)',
    borderWidth: 1,
    borderColor: 'rgba(16, 185, 129, 0.35)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  codTitle: {
    color: colors.white,
    fontSize: 16,
    fontWeight: '800',
    letterSpacing: 0.5,
    marginTop: 20,
  },
  codSubtitle: {
    color: 'rgba(255, 255, 255, 0.75)',
    fontSize: 12.5,
    lineHeight: 18,
    marginTop: 6,
    maxWidth: 290,
  },
  cardOverlay: {
    ...StyleSheet.absoluteFill,
    backgroundColor: 'rgba(0, 0, 0, 0.18)',
  },
  cardDecorationOne: {
    position: 'absolute',
    top: -70,
    right: -50,
    width: 180,
    height: 180,
    borderRadius: 90,
    backgroundColor: 'rgba(255, 255, 255, 0.22)',
  },
  cardDecorationTwo: {
    position: 'absolute',
    bottom: -80,
    left: -40,
    width: 160,
    height: 160,
    borderRadius: 80,
    backgroundColor: 'rgba(255, 255, 255, 0.10)',
  },
  cardTopRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  chip: {
    width: 42,
    height: 32,
    borderRadius: 7,
    backgroundColor: '#E7C97A',
    justifyContent: 'center',
    paddingHorizontal: 8,
    gap: 5,
  },
  chipLine: {
    height: 2,
    borderRadius: 1,
    backgroundColor: 'rgba(26, 26, 26, 0.35)',
  },
  cardBrandRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  cardBrandText: {
    color: 'rgba(255, 255, 255, 0.75)',
    fontSize: 12,
    fontWeight: '600',
    marginRight: 8,
    letterSpacing: 0.5,
  },
  cardNumber: {
    color: colors.white,
    fontSize: 20,
    fontWeight: '700',
    letterSpacing: 2.4,
    marginTop: 26,
  },
  cardBottomRow: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    justifyContent: 'space-between',
    marginTop: 22,
  },
  cardExpiryBlock: {
    alignItems: 'flex-end',
  },
  cardLabel: {
    color: 'rgba(255, 255, 255, 0.45)',
    fontSize: 9,
    fontWeight: '700',
    letterSpacing: 1,
    marginBottom: 5,
  },
  cardValue: {
    color: colors.white,
    fontSize: 13,
    fontWeight: '700',
    letterSpacing: 0.6,
  },
  defaultBadge: {
    position: 'absolute',
    top: 66,
    right: 20,
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.primarySoft,
    paddingHorizontal: 9,
    paddingVertical: 5,
    borderRadius: radius.pill,
  },
  defaultBadgeText: {
    color: colors.primary,
    fontSize: 9,
    fontWeight: '800',
    letterSpacing: 0.8,
    marginLeft: 4,
  },

  sectionTitle: {
    fontSize: 12,
    fontWeight: '700',
    letterSpacing: 1,
    color: colors.gray,
    marginTop: 26,
    marginBottom: 12,
    marginLeft: 4,
  },

  optionRow: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.card,
    borderRadius: radius.lg,
    borderWidth: 1,
    borderColor: colors.border,
    padding: spacing.md,
    marginBottom: spacing.sm,
  },
  optionRowActive: {
    borderColor: colors.primary,
    backgroundColor: colors.primarySoft,
  },
  optionMainPress: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
  },
  optionIconBox: {
    width: 42,
    height: 42,
    borderRadius: radius.md,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: spacing.md,
    overflow: 'hidden',
  },
  optionIconText: {
    color: colors.white,
    fontSize: 10,
    fontWeight: '800',
    letterSpacing: 0.5,
  },
  optionTextBlock: {
    flex: 1,
  },
  optionTitle: {
    fontSize: 15,
    fontWeight: '600',
    color: colors.dark,
    marginBottom: 3,
  },
  optionTitleActive: {
    color: colors.primary,
    fontWeight: '700',
  },
  optionSubtitle: {
    fontSize: 12,
    color: colors.gray,
  },
  radioOuter: {
    width: 22,
    height: 22,
    borderRadius: 11,
    borderWidth: 2,
    borderColor: colors.grayLight,
    alignItems: 'center',
    justifyContent: 'center',
    marginLeft: spacing.sm,
  },
  radioOuterActive: {
    borderColor: colors.primary,
  },
  radioInner: {
    width: 10,
    height: 10,
    borderRadius: 5,
    backgroundColor: colors.primary,
  },
  deleteButton: {
    width: 34,
    height: 34,
    borderRadius: radius.md,
    backgroundColor: colors.primarySoft,
    alignItems: 'center',
    justifyContent: 'center',
    marginLeft: spacing.md,
  },
  pressed: { opacity: 0.7 },
  addNewCard: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    height: 54,
    borderRadius: radius.lg,
    borderWidth: 1.5,
    borderStyle: 'dashed',
    borderColor: colors.primary,
    backgroundColor: colors.card,
    marginTop: spacing.sm,
  },
  addNewCardText: {
    fontSize: 15,
    fontWeight: '700',
    color: colors.primary,
    marginLeft: 6,
  },
  footer: {
    paddingHorizontal: spacing.lg,
    paddingTop: spacing.md,
    paddingBottom: spacing.md,
    backgroundColor: colors.background,
    borderTopWidth: 1,
    borderTopColor: colors.border,
  },
  confirmButton: {
    width: '100%',
  },

  /* Modal */
  modalBackdrop: {
    flex: 1,
    backgroundColor: colors.overlay,
    justifyContent: 'center',
    padding: spacing.xl,
  },
  modalCard: {
    width: '100%',
    maxWidth: 400,
    backgroundColor: colors.card,
    borderRadius: radius.xl,
    padding: spacing.xl,
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: '800',
    color: colors.dark,
    marginBottom: spacing.md,
  },
  modalSectionLabel: {
    fontSize: 13,
    fontWeight: '600',
    color: colors.textMuted,
    marginBottom: spacing.sm,
  },
  brandGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.sm,
    marginBottom: spacing.md,
  },
  brandOption: {
    width: 80,
    height: 56,
    borderRadius: radius.md,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 2,
    borderColor: 'transparent',
  },
  brandOptionActive: {
    borderColor: colors.primary,
  },
  brandOptionText: {
    color: colors.white,
    fontSize: 12,
    fontWeight: '800',
    letterSpacing: 0.5,
  },
  brandCheck: {
    position: 'absolute',
    top: 4,
    right: 4,
  },
  formError: {
    color: colors.danger,
    fontSize: 13,
    fontWeight: '600',
    marginTop: spacing.sm,
  },
  modalActions: {
    flexDirection: 'row',
    gap: spacing.md,
    marginTop: spacing.lg,
  },
  modalButton: {
    flex: 1,
  },
  optionActions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
  },
  defaultPill: {
    backgroundColor: colors.primarySoft,
    paddingHorizontal: spacing.sm,
    paddingVertical: 3,
    borderRadius: radius.pill,
  },
  defaultPillText: {
    fontSize: 11,
    fontWeight: '700',
    color: colors.primary,
  },
  setDefaultBtn: {
    paddingHorizontal: spacing.sm,
    paddingVertical: 4,
    borderRadius: radius.sm,
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.card,
  },
  setDefaultBtnText: {
    fontSize: 11,
    fontWeight: '600',
    color: colors.textMuted,
  },
});
