import React, { useMemo, useState } from 'react';
import {
  Alert,
  Image,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useRouter, useLocalSearchParams } from 'expo-router';
import {
  Badge,
  ConfirmSheet,
  ErrorView,
  LoadingView,
  PrimaryButton,
  SecondaryButton,
  ScreenHeader,
  Toast,
  InvoiceModal,
  ReviewModal,
} from '../../src/components';
import { colors, radius, spacing } from '../../src/constants/theme';
import { useOrders } from '../../src/context/OrdersContext';
import { getErrorMessage } from '../../src/services/http';
import { formatDate, formatMoney } from '../../src/utils/format';
import { Order, OrderTimelineStep } from '../../src/types';

type BadgeVariant = 'primary' | 'success' | 'danger' | 'warning' | 'dark';

const STATUS_META: Record<string, { label: string; variant: BadgeVariant }> = {
  pending: { label: 'Chờ xử lý', variant: 'warning' },
  processing: { label: 'Đang xử lý', variant: 'primary' },
  shipped: { label: 'Đang giao', variant: 'dark' },
  delivered: { label: 'Đã giao', variant: 'success' },
  cancelled: { label: 'Đã huỷ', variant: 'danger' },
};

function buildFallbackTimeline(order: Order): OrderTimelineStep[] {
  const isCancelled = order.status === 'cancelled';
  const isDelivered = order.status === 'delivered';
  const isShipped = order.status === 'shipped';
  const isProcessing = order.status === 'processing';

  const steps: OrderTimelineStep[] = [
    { key: 'ordered', label: 'Đặt hàng', icon: 'cart', date: formatDate(order.createdAt), completed: true },
    { key: 'processing', label: 'Xử lý', icon: 'cube', date: 'Chờ cập nhật', completed: isProcessing || isShipped || isDelivered },
    { key: 'shipped', label: 'Đang giao', icon: 'car', date: 'Chờ cập nhật', completed: isShipped || isDelivered },
    { key: 'delivered', label: 'Đã giao', icon: 'home', date: 'Chờ cập nhật', completed: isDelivered },
  ];

  if (isCancelled) {
    steps[1] = { key: 'processing', label: 'Xử lý', icon: 'cube', date: 'Đã dừng', completed: false };
    steps[2] = { key: 'shipped', label: 'Đang giao', icon: 'car', date: 'Đã dừng', completed: false };
    steps[3] = { key: 'cancelled', label: 'Đã huỷ', icon: 'close', date: order.cancelledAt ? formatDate(order.cancelledAt) : 'Đã huỷ', completed: true };
  }

  return steps;
}

function formatItemCount(count: number): string {
  return `${count} sản phẩm`;
}

export default function OrderDetailScreen() {
  const router = useRouter();
  const { id } = useLocalSearchParams<{ id?: string }>();
  const orderId = id ?? '';

  const { orders, loading, loadOrders, cancelOrder } = useOrders();
  const order = useMemo(() => orders.find((o) => o.id === orderId), [orders, orderId]);

  const [cancelVisible, setCancelVisible] = useState(false);
  const [canceling, setCanceling] = useState(false);
  const [toastVisible, setToastVisible] = useState(false);
  const [toastMessage, setToastMessage] = useState('');
  const [invoiceVisible, setInvoiceVisible] = useState(false);
  const [reviewVisible, setReviewVisible] = useState(false);

  const itemCount = useMemo(
    () => (order ? order.items.reduce((sum, item) => sum + item.quantity, 0) : 0),
    [order],
  );

  const steps = useMemo(
    () => order ? order.timeline?.length ? order.timeline : buildFallbackTimeline(order) : [],
    [order],
  );

  const statusMeta = order ? STATUS_META[order.status] ?? STATUS_META.pending : null;

  const showToast = (message: string) => {
    setToastMessage(message);
    setToastVisible(true);
  };

  const handleTrackOrder = () => {
    if (!order) return;
    const label = statusMeta?.label ?? 'Không xác định';
    if (order.status === 'delivered') {
      showToast('Đơn hàng đã được giao thành công.');
    } else if (order.status === 'cancelled') {
      showToast('Đơn hàng đã bị huỷ.');
    } else {
      showToast(`Trạng thái đơn hàng hiện tại: ${label}.`);
    }
  };

  const handleCancelOrder = async () => {
    if (!order || !order.canCancel || order.status === 'cancelled') return;
    setCanceling(true);
    try {
      await cancelOrder(order.id, 'Người dùng huỷ đơn');
      showToast('Đã huỷ đơn hàng thành công.');
    } catch (error) {
      Alert.alert('Lỗi', getErrorMessage(error));
    } finally {
      setCanceling(false);
      setCancelVisible(false);
    }
  };

  const handleChangeAddress = () => {
    router.push('/shipping-address');
  };

  const handleChangePayment = () => {
    router.push('/payment-method');
  };

  const handleInvoice = () => {
    setInvoiceVisible(true);
  };

  if (loading) {
    return <LoadingView label="Đang tải đơn hàng..." />;
  }

  if (!order || !statusMeta) {
    return (
      <ErrorView
        message={`Không tìm thấy đơn hàng #${orderId || '---'}.`}
        onRetry={() => loadOrders()}
      />
    );
  }

  const canCancel = order.canCancel === true && order.status !== 'cancelled';

  return (
    <SafeAreaView style={styles.safe} edges={['top', 'left', 'right', 'bottom']}>
      <ScreenHeader
        title={`#${order.id}`}
        subtitle={`${formatDate(order.createdAt)} • ${formatItemCount(itemCount)}`}
      />

      <ScrollView
        style={styles.scroll}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {/* Status + Timeline */}
        <View style={styles.statusCard}>
          <View style={styles.statusTopRow}>
            <View style={styles.statusIconBox}>
              <Ionicons name="cube-outline" size={22} color={colors.primary} />
            </View>
            <View style={styles.statusMain}>
              <View style={styles.statusTitleRow}>
                <Text style={styles.statusOrderNumber}>#{order.id}</Text>
                <Text style={styles.statusPrice}>{formatMoney(order.totalAmount)}</Text>
              </View>
              <View style={styles.statusMetaRow}>
                <Text style={styles.statusMeta}>
                  {formatDate(order.createdAt)} • {formatItemCount(itemCount)}
                </Text>
                <Badge label={statusMeta.label} variant={statusMeta.variant} />
              </View>
            </View>
          </View>

          <View style={styles.timeline}>
            {steps.map((step, index) => {
              const prevStep = index > 0 ? steps[index - 1] : null;
              return (
                <View key={step.key} style={styles.stepWrapper}>
                  <View style={styles.stepRow}>
                    <View
                      style={[
                        styles.connector,
                        index === 0 && styles.connectorHidden,
                        prevStep && prevStep.completed && styles.connectorDone,
                      ]}
                    />
                    <View
                      style={[
                        styles.stepCircle,
                        step.completed && styles.stepCircleActive,
                      ]}
                    >
                      <Ionicons
                        name={step.icon}
                        size={18}
                        color={step.completed ? colors.white : colors.grayLight}
                      />
                    </View>
                    <View
                      style={[
                        styles.connector,
                        index === steps.length - 1 && styles.connectorHidden,
                      ]}
                    />
                  </View>
                  <Text
                    style={[
                      styles.stepLabel,
                      step.completed && styles.stepLabelActive,
                    ]}
                    numberOfLines={1}
                  >
                    {step.label}
                  </Text>
                  <Text style={styles.stepDate} numberOfLines={1}>
                    {formatDate(step.date) || step.date}
                  </Text>
                </View>
              );
            })}
          </View>
        </View>

        {/* Order items */}
        <View style={styles.sectionHeader}>
          <Text style={styles.sectionTitle}>Sản phẩm ({itemCount})</Text>
          <Text style={styles.sectionLink} onPress={handleInvoice}>Hoá đơn</Text>
        </View>

        <View style={styles.itemsCard}>
          {order.items.map((item, index) => (
            <View
              key={`${item.productId}-${index}`}
              style={[
                styles.productRow,
                index !== order.items.length - 1 && styles.productRowDivider,
              ]}
            >
              <Image source={{ uri: item.imageUrl }} style={styles.productImage} />
              <View style={styles.productInfo}>
                <Text style={styles.productName} numberOfLines={2}>
                  {item.name}
                </Text>
                {item.variantName ? (
                  <Text style={styles.productVariant}>{item.variantName}</Text>
                ) : null}
                <View style={styles.productQtyRow}>
                  <View style={styles.qtyChip}>
                    <Text style={styles.qtyChipText}>x{item.quantity}</Text>
                  </View>
                  <Text style={styles.productUnitPrice}>
                    {formatMoney(item.price)} / sản phẩm
                  </Text>
                </View>
              </View>
              <Text style={styles.productPrice}>
                {formatMoney(item.price * item.quantity)}
              </Text>
            </View>
          ))}
        </View>

        {/* Thông tin giao hàng */}
        <Text style={styles.sectionTitleStandalone}>Thông tin giao hàng</Text>

        <View style={styles.infoCard}>
          <View style={styles.infoIconWrap}>
            <Ionicons name="location-outline" size={20} color={colors.primary} />
          </View>
          <View style={styles.infoBody}>
            <Text style={styles.infoLabel}>ĐỊA CHỈ GIAO HÀNG</Text>
            <Text style={styles.infoTitle}>{order.customerName}</Text>
            <Text style={styles.infoText}>{order.shippingAddress}</Text>
            <Text style={styles.infoText}>{order.phoneNumber}</Text>
          </View>
          <Pressable
            onPress={handleChangeAddress}
            hitSlop={8}
            accessibilityRole="button"
            accessibilityLabel="Thay đổi địa chỉ"
          >
            <Text style={styles.changeText}>Đổi</Text>
          </Pressable>
        </View>

        <View style={styles.infoCard}>
          <View style={styles.infoIconWrap}>
            <Ionicons name="card-outline" size={20} color={colors.primary} />
          </View>
          <View style={styles.infoBody}>
            <Text style={styles.infoLabel}>PHƯƠNG THỨC THANH TOÁN</Text>
            <Text style={styles.infoTitle}>
              {order.paymentMethodName ?? 'Chưa xác định'}
            </Text>
            <Text style={styles.infoText}>
              {order.shippingMethodName ?? 'Phí vận chuyển'} • {order.voucherCode ? `Mã ${order.voucherCode}` : 'Không áp dụng mã'}
            </Text>
          </View>
          <Pressable
            onPress={handleChangePayment}
            hitSlop={8}
            accessibilityRole="button"
            accessibilityLabel="Thay đổi phương thức thanh toán"
          >
            <Text style={styles.changeText}>Đổi</Text>
          </Pressable>
        </View>

        {/* Tóm tắt thanh toán */}
        <Text style={styles.sectionTitleStandalone}>Tóm tắt thanh toán</Text>

        <View style={styles.summaryCard}>
          <View style={styles.summaryRow}>
            <Text style={styles.summaryLabel}>Tạm tính</Text>
            <Text style={styles.summaryValue}>
              {formatMoney(order.subtotal ?? 0)}
            </Text>
          </View>

          {order.discount ? (
            <View style={styles.summaryRow}>
              <Text style={styles.summaryLabel}>Giảm giá</Text>
              <Text style={[styles.summaryValue, styles.discountText]}>
                -{formatMoney(order.discount)}
              </Text>
            </View>
          ) : null}

          <View style={styles.summaryRow}>
            <Text style={styles.summaryLabel}>Phí vận chuyển</Text>
            <Text style={order.shippingFee === 0 ? styles.freeText : styles.summaryValue}>
              {order.shippingFee === 0 ? 'Miễn phí' : formatMoney(order.shippingFee ?? 0)}
            </Text>
          </View>

          <View style={styles.summaryRow}>
            <Text style={styles.summaryLabel}>Thuế</Text>
            <Text style={styles.summaryValue}>{formatMoney(order.tax ?? 0)}</Text>
          </View>

          <View style={styles.summaryDivider} />

          <View style={styles.summaryRow}>
            <Text style={styles.totalLabel}>Tổng cộng</Text>
            <Text style={styles.totalValue}>{formatMoney(order.totalAmount)}</Text>
          </View>
        </View>

        <View style={styles.noteWrap}>
          <Ionicons name="information-circle-outline" size={15} color={colors.grayLight} />
          <Text style={styles.noteText}>
            {order.status === 'cancelled'
              ? `Đơn hàng đã bị huỷ. ${order.cancelReason ? `Lý do: ${order.cancelReason}` : ''}`
              : canCancel
                ? 'Bạn có thể huỷ đơn hàng này.'
                : 'Đơn hàng không thể huỷ.'}
          </Text>
        </View>
      </ScrollView>

      {/* Bottom actions */}
      <View style={styles.bottomBar}>
        {order.status === 'delivered' ? (
          <>
            <SecondaryButton
              title="Xem hóa đơn"
              onPress={() => setInvoiceVisible(true)}
              icon="receipt-outline"
              style={styles.cancelBtn}
            />
            <PrimaryButton
              title="Đánh giá sản phẩm"
              onPress={() => setReviewVisible(true)}
              icon="star"
              style={styles.trackBtn}
            />
          </>
        ) : (
          <>
            <SecondaryButton
              title="Huỷ đơn"
              onPress={() => setCancelVisible(true)}
              disabled={!canCancel || canceling}
              loading={canceling}
              style={styles.cancelBtn}
            />
            <PrimaryButton
              title="Theo dõi đơn"
              onPress={handleTrackOrder}
              icon="navigate"
              disabled={order.status === 'cancelled'}
              style={styles.trackBtn}
            />
          </>
        )}
      </View>

      <ConfirmSheet
        visible={cancelVisible}
        title="Huỷ đơn hàng"
        message="Bạn có chắc chắn muốn huỷ đơn hàng này không?"
        confirmText="Huỷ đơn"
        cancelText="Giữ đơn"
        danger
        onConfirm={() => {
          void handleCancelOrder();
        }}
        onCancel={() => setCancelVisible(false)}
      />

      <InvoiceModal
        visible={invoiceVisible}
        onClose={() => setInvoiceVisible(false)}
        order={order}
      />

      <ReviewModal
        visible={reviewVisible}
        onClose={() => setReviewVisible(false)}
        items={order.items}
        onSuccess={(msg) => showToast(msg)}
      />

      <Toast
        message={toastMessage}
        visible={toastVisible}
        onHide={() => setToastVisible(false)}
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: {
    flex: 1,
    backgroundColor: colors.background,
  },

  /* Scroll */
  scroll: {
    flex: 1,
  },
  scrollContent: {
    paddingHorizontal: spacing.lg,
    paddingBottom: spacing.xxl,
  },

  /* Status card */
  statusCard: {
    backgroundColor: colors.card,
    borderRadius: radius.lg,
    borderWidth: 1,
    borderColor: colors.border,
    padding: spacing.lg,
    shadowColor: colors.dark,
    shadowOpacity: 0.05,
    shadowRadius: 14,
    shadowOffset: { width: 0, height: 6 },
    elevation: 3,
  },
  statusTopRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
  },
  statusIconBox: {
    width: 44,
    height: 44,
    borderRadius: radius.md,
    backgroundColor: colors.primarySoft,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: spacing.md,
  },
  statusMain: {
    flex: 1,
  },
  statusTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  statusOrderNumber: {
    fontSize: 15,
    fontWeight: '700',
    color: colors.dark,
    letterSpacing: 0.2,
  },
  statusPrice: {
    fontSize: 15,
    fontWeight: '700',
    color: colors.dark,
  },
  statusMetaRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginTop: spacing.sm,
  },
  statusMeta: {
    fontSize: 12,
    fontWeight: '500',
    color: colors.textSecondary,
  },

  /* Timeline */
  timeline: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginTop: spacing.xl,
  },
  stepWrapper: {
    flex: 1,
    alignItems: 'center',
  },
  stepRow: {
    flexDirection: 'row',
    alignItems: 'center',
    width: '100%',
  },
  connector: {
    flex: 1,
    height: 1.5,
    backgroundColor: '#E6E9EE',
    marginHorizontal: 3,
  },
  connectorDone: {
    backgroundColor: '#FFC9B5',
  },
  connectorHidden: {
    backgroundColor: 'transparent',
  },
  stepCircle: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#F2F4F7',
    alignItems: 'center',
    justifyContent: 'center',
  },
  stepCircleActive: {
    backgroundColor: colors.primary,
    shadowColor: colors.primary,
    shadowOpacity: 0.35,
    shadowRadius: 8,
    shadowOffset: { width: 0, height: 4 },
    elevation: 4,
  },
  stepLabel: {
    marginTop: spacing.sm,
    fontSize: 11,
    fontWeight: '600',
    color: '#9AA0A9',
  },
  stepLabelActive: {
    color: colors.primary,
    fontWeight: '700',
  },
  stepDate: {
    marginTop: 3,
    fontSize: 9.5,
    fontWeight: '500',
    color: colors.grayLight,
  },

  /* Section titles */
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginTop: spacing.xl,
    marginBottom: spacing.md,
  },
  sectionTitle: {
    fontSize: 15,
    fontWeight: '700',
    color: colors.dark,
    letterSpacing: -0.2,
  },
  sectionLink: {
    fontSize: 12,
    fontWeight: '700',
    color: colors.primary,
  },
  sectionTitleStandalone: {
    fontSize: 15,
    fontWeight: '700',
    color: colors.dark,
    letterSpacing: -0.2,
    marginTop: spacing.xl,
    marginBottom: spacing.md,
  },

  /* Items */
  itemsCard: {
    backgroundColor: colors.card,
    borderRadius: radius.lg,
    borderWidth: 1,
    borderColor: colors.border,
    paddingHorizontal: spacing.md,
  },
  productRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: spacing.md,
  },
  productRowDivider: {
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  productImage: {
    width: 64,
    height: 64,
    borderRadius: radius.md,
    backgroundColor: '#F2F4F7',
  },
  productInfo: {
    flex: 1,
    marginLeft: spacing.md,
    marginRight: spacing.sm,
  },
  productName: {
    fontSize: 14,
    fontWeight: '600',
    color: colors.dark,
    lineHeight: 18,
  },
  productVariant: {
    marginTop: 3,
    fontSize: 12,
    fontWeight: '500',
    color: colors.textSecondary,
  },
  productQtyRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: spacing.sm,
  },
  qtyChip: {
    paddingHorizontal: 7,
    paddingVertical: 2,
    borderRadius: radius.sm,
    backgroundColor: '#F2F4F7',
    marginRight: spacing.sm,
  },
  qtyChipText: {
    fontSize: 10.5,
    fontWeight: '700',
    color: colors.textSecondary,
  },
  productUnitPrice: {
    fontSize: 11.5,
    fontWeight: '500',
    color: colors.grayLight,
  },
  productPrice: {
    fontSize: 14,
    fontWeight: '700',
    color: colors.dark,
    marginLeft: spacing.sm,
  },

  /* Info cards */
  infoCard: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    backgroundColor: colors.card,
    borderRadius: radius.lg,
    borderWidth: 1,
    borderColor: colors.border,
    padding: spacing.md,
    marginBottom: spacing.md,
  },
  infoIconWrap: {
    width: 38,
    height: 38,
    borderRadius: radius.md,
    backgroundColor: colors.primarySoft,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: spacing.md,
  },
  infoBody: {
    flex: 1,
  },
  infoLabel: {
    fontSize: 10,
    fontWeight: '700',
    color: colors.grayLight,
    letterSpacing: 0.8,
  },
  infoTitle: {
    marginTop: 5,
    fontSize: 14,
    fontWeight: '700',
    color: colors.dark,
  },
  infoText: {
    marginTop: 3,
    fontSize: 12.5,
    fontWeight: '500',
    color: colors.textSecondary,
    lineHeight: 18,
  },
  changeText: {
    fontSize: 12,
    fontWeight: '700',
    color: colors.primary,
    marginLeft: spacing.sm,
    marginTop: 2,
    padding: 4,
  },

  /* Summary */
  summaryCard: {
    backgroundColor: colors.card,
    borderRadius: radius.lg,
    borderWidth: 1,
    borderColor: colors.border,
    padding: spacing.md,
  },
  summaryRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: spacing.xs + 2,
  },
  summaryLabel: {
    fontSize: 13,
    fontWeight: '500',
    color: colors.textSecondary,
  },
  summaryValue: {
    fontSize: 13,
    fontWeight: '600',
    color: colors.dark,
  },
  discountText: {
    color: colors.success,
  },
  freeText: {
    fontSize: 13,
    fontWeight: '700',
    color: colors.success,
  },
  summaryDivider: {
    height: 1,
    backgroundColor: colors.border,
    marginVertical: spacing.sm,
  },
  totalLabel: {
    fontSize: 15,
    fontWeight: '700',
    color: colors.dark,
  },
  totalValue: {
    fontSize: 19,
    fontWeight: '800',
    color: colors.dark,
    letterSpacing: -0.3,
  },

  /* Note */
  noteWrap: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: spacing.md,
  },
  noteText: {
    marginLeft: 6,
    fontSize: 11.5,
    fontWeight: '500',
    color: colors.grayLight,
  },

  /* Bottom bar */
  bottomBar: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: spacing.lg,
    paddingTop: spacing.md,
    paddingBottom: spacing.md,
    backgroundColor: colors.card,
    borderTopWidth: 1,
    borderTopColor: colors.border,
  },
  cancelBtn: {
    flex: 1,
    marginRight: spacing.md,
  },
  trackBtn: {
    flex: 1.35,
  },
});
