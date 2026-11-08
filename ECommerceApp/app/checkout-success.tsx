import React, { useMemo, useState } from 'react';
import {
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
  ViewStyle,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { colors, radius, spacing } from '../src/constants/theme';
import { useCheckout } from '../src/context/CheckoutContext';
import { PrimaryButton, SecondaryButton } from '../src/components/Button';
import { EmptyState } from '../src/components/EmptyState';
import { InvoiceModal } from '../src/components/InvoiceModal';
import { formatMoney } from '../src/utils/format';
import { Order } from '../src/types';

type IoniconName = React.ComponentProps<typeof Ionicons>['name'];

type ConfettiDot = {
  color: string;
  size: number;
  style: ViewStyle;
};

type StepItem = {
  key: string;
  label: string;
  icon: IoniconName;
  active?: boolean;
};

const CONFETTI: ConfettiDot[] = [
  { color: '#F97316', size: 10, style: { top: 16, left: 96 } },
  { color: '#F97316', size: 10, style: { top: 42, right: 26 } },
  { color: '#EC4899', size: 10, style: { top: 88, left: 8 } },
  { color: '#FB923C', size: 10, style: { top: 124, right: 8 } },
  { color: '#3B82F6', size: 10, style: { bottom: 46, left: 26 } },
  { color: '#22C55E', size: 11, style: { bottom: 40, right: 38 } },
  { color: '#FACC15', size: 9, style: { bottom: 8, left: 92 } },
  { color: '#EF4444', size: 8, style: { top: 62, right: 60 } },
];

/** Bước mặc định nếu order.timeline không có. */
const FALLBACK_STEPS: StepItem[] = [
  { key: 'ordered', label: 'Đặt hàng', icon: 'checkmark', active: true },
  { key: 'processing', label: 'Xử lý', icon: 'cube-outline' },
  { key: 'shipped', label: 'Đang giao', icon: 'car-outline' },
  { key: 'delivered', label: 'Đã giao', icon: 'home-outline' },
];

/** Lấy 4 bước hiển thị từ timeline của đơn hoặc dùng bước mặc định. */
function getSteps(order: Order): StepItem[] {
  if (order.timeline && order.timeline.length >= 4) {
    return order.timeline.slice(0, 4).map((step) => ({
      key: step.key,
      label: step.label,
      icon: step.icon,
      active: step.completed,
    }));
  }
  return FALLBACK_STEPS;
}

export default function CheckoutSuccessScreen() {
  const router = useRouter();
  const { lastPlacedOrder } = useCheckout();
  const [invoiceVisible, setInvoiceVisible] = useState(false);

  // Dữ liệu đơn vừa đặt (nếu có)
  const order = lastPlacedOrder;

  // Tổng số sản phẩm
  const itemsCount = useMemo(
    () => order?.items.reduce((sum, item) => sum + item.quantity, 0) ?? 0,
    [order],
  );

  // Các bước tiến trình
  const steps = useMemo(() => (order ? getSteps(order) : FALLBACK_STEPS), [order]);

  // Nếu chưa có đơn (truy cập trực tiếp), hiển thị EmptyState
  if (!order) {
    return (
      <SafeAreaView style={styles.safeArea} edges={['top', 'bottom']}>
        <EmptyState
          icon="receipt-outline"
          title="Chưa có đơn hàng"
          subtitle="Bạn chưa hoàn tất đặt hàng. Hãy quay lại trang chủ để tiếp tục mua sắm."
          actionLabel="Về trang chủ"
          onAction={() => router.replace('/(tabs)/home')}
        />
      </SafeAreaView>
    );
  }

  const handleViewOrderDetails = () => {
    router.push({
      pathname: '/order/[id]',
      params: { id: order.id },
    });
  };

  const handleContinueShopping = () => {
    router.replace('/(tabs)/home');
  };

  return (
    <SafeAreaView style={styles.safeArea} edges={['top', 'bottom']}>
      <ScrollView
        style={styles.scroll}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {/* Success badge */}
        <View style={styles.badgeArea}>
          {CONFETTI.map((dot, index) => (
            <View
              key={`confetti-${index}`}
              style={[
                styles.confettiDot,
                {
                  width: dot.size,
                  height: dot.size,
                  borderRadius: dot.size / 2,
                  backgroundColor: dot.color,
                },
                dot.style,
              ]}
            />
          ))}

          <View style={styles.haloOuter}>
            <View style={styles.haloInner}>
              <View style={styles.checkCircle}>
                <Ionicons name="checkmark" size={52} color={colors.white} />
              </View>
            </View>
          </View>
        </View>

        {/* Title */}
        <Text style={styles.title}>Đặt hàng thành công!</Text>
        <Text style={styles.subtitle}>
          Cảm ơn bạn đã mua sắm. Xác nhận đơn hàng đã được gửi đến email của bạn.
        </Text>

        {/* Summary card */}
        <View style={styles.card}>
          <View style={styles.orderNumberRow}>
            <Text style={styles.orderNumberLabel}>Mã đơn hàng</Text>
            <Text style={styles.orderNumberValue}>#{order.id}</Text>
          </View>

          <View style={styles.divider} />

          <View style={styles.summaryRow}>
            <View style={styles.summaryIconBox}>
              <Ionicons name="calendar-outline" size={18} color={colors.primary} />
            </View>
            <View style={styles.summaryTextWrap}>
              <Text style={styles.summaryLabel}>Giao hàng dự kiến</Text>
              <Text style={styles.summaryValue}>
                {order.shippingMethodName ?? 'Đang cập nhật'}
              </Text>
            </View>
          </View>

          <View style={styles.summaryRow}>
            <View style={styles.summaryIconBox}>
              <Ionicons name="cube-outline" size={18} color={colors.primary} />
            </View>
            <View style={styles.summaryTextWrap}>
              <Text style={styles.summaryLabel}>Số lượng sản phẩm</Text>
              <Text style={styles.summaryValue}>{itemsCount} sản phẩm</Text>
            </View>
          </View>

          <View style={styles.summaryRow}>
            <View style={styles.summaryIconBox}>
              <Ionicons name="card-outline" size={18} color={colors.primary} />
            </View>
            <View style={styles.summaryTextWrap}>
              <Text style={styles.summaryLabel}>Tổng thanh toán</Text>
              <Text style={styles.summaryValue}>{formatMoney(order.totalAmount)}</Text>
            </View>
          </View>
        </View>

        {/* Stepper */}
        <View style={styles.stepper}>
          {steps.map((step, index) => {
            const isLast = index === steps.length - 1;
            return (
              <View key={step.key} style={styles.stepItem}>
                {!isLast && <View style={styles.stepLine} />}
                <View
                  style={[
                    styles.stepCircle,
                    step.active ? styles.stepCircleActive : styles.stepCircleIdle,
                  ]}
                >
                  <Ionicons
                    name={step.icon}
                    size={step.active ? 20 : 18}
                    color={step.active ? colors.white : '#B0B5BE'}
                  />
                </View>
                <Text
                  style={[
                    styles.stepLabel,
                    step.active ? styles.stepLabelActive : styles.stepLabelIdle,
                  ]}
                  numberOfLines={1}
                >
                  {step.label}
                </Text>
              </View>
            );
          })}
        </View>

        {/* Primary action */}
        <PrimaryButton
          title="Xem chi tiết đơn hàng"
          icon="chevron-forward"
          onPress={handleViewOrderDetails}
          style={styles.primaryButton}
        />

        {/* Invoice action */}
        <SecondaryButton
          title="Xem hóa đơn bán hàng"
          icon="receipt-outline"
          onPress={() => setInvoiceVisible(true)}
          style={styles.secondaryButton}
        />

        {/* Secondary action */}
        <SecondaryButton
          title="Tiếp tục mua sắm"
          icon="home-outline"
          onPress={handleContinueShopping}
          style={styles.secondaryButton}
        />
      </ScrollView>

      <InvoiceModal
        visible={invoiceVisible}
        onClose={() => setInvoiceVisible(false)}
        order={order}
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
    backgroundColor: colors.background,
  },
  scrollContent: {
    paddingHorizontal: spacing.xl,
    paddingTop: spacing.xs,
    paddingBottom: spacing.xxl,
  },

  /* Success badge */
  badgeArea: {
    width: 200,
    height: 200,
    alignSelf: 'center',
    alignItems: 'center',
    justifyContent: 'center',
  },
  confettiDot: {
    position: 'absolute',
  },
  haloOuter: {
    width: 140,
    height: 140,
    borderRadius: 70,
    backgroundColor: 'rgba(34,197,94,0.14)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  haloInner: {
    width: 118,
    height: 118,
    borderRadius: 59,
    backgroundColor: 'rgba(34,197,94,0.20)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  checkCircle: {
    width: 96,
    height: 96,
    borderRadius: 48,
    backgroundColor: colors.success,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: colors.success,
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.28,
    shadowRadius: 12,
    elevation: 6,
  },

  /* Texts */
  title: {
    marginTop: spacing.sm,
    fontSize: 26,
    lineHeight: 33,
    fontWeight: '800',
    color: colors.dark,
    textAlign: 'center',
    letterSpacing: -0.4,
  },
  subtitle: {
    marginTop: spacing.md,
    fontSize: 15,
    lineHeight: 22,
    color: colors.textSecondary,
    textAlign: 'center',
    paddingHorizontal: spacing.md,
  },

  /* Card */
  card: {
    marginTop: spacing.xl,
    backgroundColor: colors.card,
    borderRadius: radius.lg,
    borderWidth: 1,
    borderColor: colors.border,
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.lg,
    shadowColor: colors.dark,
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.04,
    shadowRadius: 14,
    elevation: 2,
  },
  orderNumberRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingBottom: spacing.md,
  },
  orderNumberLabel: {
    fontSize: 15,
    color: colors.textSecondary,
    fontWeight: '500',
  },
  orderNumberValue: {
    fontSize: 15,
    fontWeight: '800',
    color: colors.dark,
    letterSpacing: 0.2,
  },
  divider: {
    height: 1,
    backgroundColor: colors.border,
    marginBottom: spacing.sm,
  },
  summaryRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: spacing.md,
  },
  summaryIconBox: {
    width: 36,
    height: 36,
    borderRadius: radius.md,
    backgroundColor: colors.primarySoft,
    alignItems: 'center',
    justifyContent: 'center',
  },
  summaryTextWrap: {
    marginLeft: spacing.md,
    flex: 1,
  },
  summaryLabel: {
    fontSize: 13,
    color: colors.textMuted,
    fontWeight: '500',
    marginBottom: 3,
  },
  summaryValue: {
    fontSize: 15,
    fontWeight: '700',
    color: colors.dark,
  },

  /* Stepper */
  stepper: {
    marginTop: spacing.xl,
    flexDirection: 'row',
    alignItems: 'flex-start',
    paddingHorizontal: spacing.sm,
  },
  stepItem: {
    flex: 1,
    alignItems: 'center',
  },
  stepLine: {
    position: 'absolute',
    top: 21,
    left: '50%',
    width: '100%',
    height: 2,
    backgroundColor: colors.border,
    zIndex: 0,
  },
  stepCircle: {
    width: 44,
    height: 44,
    borderRadius: 22,
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 1,
  },
  stepCircleActive: {
    backgroundColor: colors.primary,
    shadowColor: colors.primary,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.28,
    shadowRadius: 8,
    elevation: 4,
  },
  stepCircleIdle: {
    backgroundColor: colors.background,
    borderWidth: 1.5,
    borderColor: colors.border,
  },
  stepLabel: {
    marginTop: spacing.sm,
    fontSize: 12,
    textAlign: 'center',
  },
  stepLabelActive: {
    color: colors.dark,
    fontWeight: '700',
  },
  stepLabelIdle: {
    color: colors.textMuted,
    fontWeight: '500',
  },

  /* Buttons spacing */
  primaryButton: {
    marginTop: spacing.xl,
  },
  secondaryButton: {
    marginTop: spacing.md,
  },
});
