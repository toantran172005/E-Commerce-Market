import React, { useCallback, useEffect, useMemo, useState } from 'react';
import {
  Alert,
  BackHandler,
  FlatList,
  Image,
  Pressable,
  RefreshControl,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { colors, radius, spacing } from '../src/constants/theme';
import { ScreenHeader } from '../src/components/ScreenHeader';
import { EmptyState } from '../src/components/EmptyState';
import { LoadingView } from '../src/components/LoadingView';
import { ErrorView } from '../src/components/ErrorView';
import { ConfirmSheet } from '../src/components/ConfirmSheet';
import { Toast } from '../src/components/Toast';
import { ReviewModal } from '../src/components/ReviewModal';
import { useOrders } from '../src/context/OrdersContext';
import { useNotifications } from '../src/context/NotificationsContext';
import { formatDate, formatMoney } from '../src/utils/format';
import { Order, OrderItem, OrderStatus } from '../src/types';

/* ------------------------------- Types ------------------------------- */

type TabKey = 'all' | 'processing' | 'delivered' | 'cancelled';

/* ------------------------------- Config ------------------------------ */

const STATUS_META: Record<OrderStatus, { label: string; color: string; bg: string }> = {
  pending: { label: 'Đang chờ xử lý', color: colors.primary, bg: colors.primarySoft },
  processing: { label: 'Đang xử lý', color: colors.primary, bg: colors.primarySoft },
  shipped: { label: 'Đang giao', color: colors.info, bg: colors.infoSoft },
  delivered: { label: 'Đã giao thành công', color: colors.success, bg: colors.successSoft },
  cancelled: { label: 'Đã huỷ', color: colors.gray, bg: colors.border },
};

const TABS: { key: TabKey; label: string }[] = [
  { key: 'all', label: 'Tất cả' },
  { key: 'processing', label: 'Đang xử lý' },
  { key: 'delivered', label: 'Đã giao' },
  { key: 'cancelled', label: 'Đã huỷ' },
];

const EMPTY_COPY: Record<TabKey, { title: string; text: string }> = {
  all: {
    title: 'Chưa có đơn hàng nào',
    text: 'Hãy khám phá cửa hàng và đặt món đồ đầu tiên của bạn nhé!',
  },
  processing: {
    title: 'Không có đơn đang xử lý',
    text: 'Tất cả đơn hàng của bạn đã được xử lý xong rồi đó.',
  },
  delivered: {
    title: 'Chưa có đơn đã giao',
    text: 'Các đơn hàng đã giao thành công sẽ xuất hiện tại đây.',
  },
  cancelled: {
    title: 'Không có đơn đã huỷ',
    text: 'Thật tuyệt! Bạn chưa phải huỷ đơn hàng nào cả.',
  },
};

/* ------------------------------ Screen ------------------------------- */

export default function MyOrdersScreen() {
  const router = useRouter();
  const { fromSuccess } = useLocalSearchParams<{ fromSuccess?: string }>();
  const { orders, loading, error, loadOrders, cancelOrder, markItemReviewed } = useOrders();
  const { loadNotifications } = useNotifications();

  const handleBack = useCallback(() => {
    if (fromSuccess === '1' || fromSuccess === 'true') {
      router.replace('/(tabs)/home');
      return true;
    }
    if (router.canGoBack()) {
      router.back();
    } else {
      router.replace('/(tabs)/home');
    }
    return true;
  }, [fromSuccess, router]);

  useEffect(() => {
    if (fromSuccess === '1' || fromSuccess === 'true') {
      const sub = BackHandler.addEventListener('hardwareBackPress', handleBack);
      return () => sub.remove();
    }
  }, [fromSuccess, handleBack]);

  const [activeTab, setActiveTab] = useState<TabKey>('all');
  const [refreshing, setRefreshing] = useState(false);
  const [cancelTarget, setCancelTarget] = useState<Order | null>(null);
  const [confirmVisible, setConfirmVisible] = useState(false);
  const [toastMessage, setToastMessage] = useState('');
  const [toastVisible, setToastVisible] = useState(false);

  // State cho Modal đánh giá sản phẩm theo từng card Shopee
  const [reviewModalVisible, setReviewModalVisible] = useState(false);
  const [reviewTargetItem, setReviewTargetItem] = useState<OrderItem | null>(null);
  const [reviewTargetOrderId, setReviewTargetOrderId] = useState<string>('');

  const filteredOrders = useMemo(() => {
    if (activeTab === 'all') return orders;
    if (activeTab === 'processing') {
      return orders.filter((order) => order.status === 'pending' || order.status === 'processing');
    }
    return orders.filter((order) => order.status === activeTab);
  }, [orders, activeTab]);

  // Tách từng sản phẩm trong các đơn hàng "Đã giao" thành từng card độc lập (Shopee style)
  const deliveredItems = useMemo(() => {
    const list: { order: Order; item: OrderItem; uniqueKey: string }[] = [];
    orders
      .filter((o) => o.status === 'delivered')
      .forEach((order) => {
        order.items.forEach((item, idx) => {
          list.push({
            order,
            item,
            uniqueKey: `${order.id}-${item.productId}-${idx}`,
          });
        });
      });
    return list;
  }, [orders]);

  const handleRefresh = useCallback(async () => {
    setRefreshing(true);
    await loadOrders();
    setRefreshing(false);
  }, [loadOrders]);

  const openOrderDetail = useCallback(
    (orderId: string) => {
      router.push({ pathname: '/order/[id]', params: { id: orderId } });
    },
    [router],
  );

  const handleTrackOrder = useCallback(
    (orderId: string) => {
      openOrderDetail(orderId);
    },
    [openOrderDetail],
  );

  const handleCancelOrder = useCallback((order: Order) => {
    setCancelTarget(order);
    setConfirmVisible(true);
  }, []);

  const confirmCancel = useCallback(async () => {
    if (!cancelTarget) return;
    try {
      await cancelOrder(cancelTarget.id, 'Huỷ theo yêu cầu người dùng');
      void loadNotifications();
      setToastMessage('Đã huỷ đơn hàng');
      setToastVisible(true);
    } catch (e) {
      const message = e instanceof Error ? e.message : 'Không thể huỷ đơn hàng.';
      Alert.alert('Lỗi', message);
    } finally {
      setConfirmVisible(false);
      setCancelTarget(null);
    }
  }, [cancelTarget, cancelOrder, loadNotifications]);

  const handleRateProduct = useCallback((orderId: string, item: OrderItem) => {
    setReviewTargetOrderId(orderId);
    setReviewTargetItem(item);
    setReviewModalVisible(true);
  }, []);

  const handleViewReview = useCallback((_orderId: string, item: OrderItem) => {
    router.push({
      pathname: '/product/[id]',
      params: { id: item.productId },
    });
  }, [router]);

  const handleReviewSuccess = useCallback(
    (msg: string, reviewedProductId?: string) => {
      const prodId = reviewedProductId || reviewTargetItem?.productId;
      if (reviewTargetOrderId && prodId) {
        markItemReviewed(reviewTargetOrderId, prodId);
      }
      setToastMessage(msg);
      setToastVisible(true);
      setReviewModalVisible(false);
      void loadOrders();
    },
    [reviewTargetOrderId, reviewTargetItem, markItemReviewed, loadOrders],
  );

  const goShopping = useCallback(() => {
    router.replace('/(tabs)/home');
  }, [router]);

  const renderItem = useCallback(
    ({ item }: { item: Order }) => {
      const statusMeta = STATUS_META[item.status];
      const totalItems = item.items.reduce((sum, i) => sum + i.quantity, 0);
      const primaryImage = item.items[0]?.imageUrl;
      const totalDisplay = formatMoney(item.totalAmount);

      return (
        <View style={styles.card}>
          {/* Card header */}
          <View style={styles.cardHeader}>
            <View style={styles.thumb}>
              {primaryImage ? (
                <Image source={{ uri: primaryImage }} style={styles.thumbImage} resizeMode="contain" />
              ) : (
                <Ionicons name="cube-outline" size={22} color={colors.primary} />
              )}
            </View>

            <View style={styles.headerInfo}>
              <Text style={styles.orderCode}>#{item.id}</Text>
              <Text style={styles.orderMeta}>
                {formatDate(item.createdAt)} · {totalItems}{' '}
                {totalItems > 1 ? 'sản phẩm' : 'sản phẩm'}
              </Text>
            </View>

            <View style={styles.headerRight}>
              <Text style={styles.totalText}>{totalDisplay}</Text>
              <View style={[styles.badge, { backgroundColor: statusMeta.bg }]}>
                <Text style={[styles.badgeText, { color: statusMeta.color }]}>{statusMeta.label}</Text>
              </View>
            </View>
          </View>

          <View style={styles.divider} />

          {/* Danh sách sản phẩm trong đơn */}
          <View style={styles.products}>
            {item.items.map((product) => (
              <View key={`${item.id}-${product.productId}`} style={styles.productRow}>
                <View style={styles.productIcon}>
                  <Ionicons name="cube-outline" size={14} color={colors.primary} />
                </View>
                <Text style={styles.productName} numberOfLines={1}>
                  {product.name}
                </Text>
                <Text style={styles.productQty}>x{product.quantity}</Text>
              </View>
            ))}
          </View>

          <View style={styles.divider} />

          {/* Hành động theo trạng thái */}
          <View style={styles.actionsRow}>
            {(item.status === 'pending' || item.status === 'processing') && (
              <>
                <Pressable
                  onPress={() => handleTrackOrder(item.id)}
                  style={({ pressed }) => [styles.btn, styles.btnPrimary, pressed && styles.btnPressed]}
                  accessibilityRole="button"
                  accessibilityLabel="Theo dõi đơn hàng"
                >
                  <Ionicons name="navigate-outline" size={16} color={colors.white} />
                  <Text style={styles.btnPrimaryText}>Theo dõi</Text>
                </Pressable>

                {item.canCancel && (
                  <Pressable
                    onPress={() => handleCancelOrder(item)}
                    style={({ pressed }) => [styles.btn, styles.btnDanger, pressed && styles.btnPressed]}
                    accessibilityRole="button"
                    accessibilityLabel="Huỷ đơn hàng"
                  >
                    <Ionicons name="close-circle-outline" size={16} color={colors.danger} />
                    <Text style={styles.btnDangerText}>Huỷ đơn</Text>
                  </Pressable>
                )}
              </>
            )}

            {item.status === 'delivered' && (
              <Pressable
                onPress={() => openOrderDetail(item.id)}
                style={({ pressed }) => [styles.btn, styles.btnOutline, pressed && styles.btnPressed]}
                accessibilityRole="button"
                accessibilityLabel="Xem chi tiết đơn hàng"
              >
                <Ionicons name="document-text-outline" size={16} color={colors.dark} />
                <Text style={styles.btnOutlineText}>Chi tiết</Text>
              </Pressable>
            )}

            {item.status === 'cancelled' && (
              <Pressable
                onPress={() => openOrderDetail(item.id)}
                style={({ pressed }) => [styles.btn, styles.btnOutline, pressed && styles.btnPressed]}
                accessibilityRole="button"
                accessibilityLabel="Xem chi tiết đơn hàng"
              >
                <Ionicons name="document-text-outline" size={16} color={colors.dark} />
                <Text style={styles.btnOutlineText}>Chi tiết</Text>
              </Pressable>
            )}
          </View>
        </View>
      );
    },
    [handleCancelOrder, handleTrackOrder, openOrderDetail],
  );

  // Render từng sản phẩm tách biệt khi ở tab "Đã giao" (Shopee style)
  const renderDeliveredItem = useCallback(
    ({ item: entry }: { item: { order: Order; item: OrderItem; uniqueKey: string } }) => {
      const { order, item: prod } = entry;
      const isReviewed = Boolean(order.reviewedItemIds?.includes(prod.productId));

      return (
        <View style={styles.card}>
          {/* Header Shopee style */}
          <View style={styles.cardHeader}>
            <View style={styles.headerInfo}>
              <Text style={styles.orderCode}>#{order.id}</Text>
              <Text style={styles.orderMeta}>{formatDate(order.createdAt)}</Text>
            </View>
            <View style={[styles.badge, { backgroundColor: colors.successSoft }]}>
              <Text style={[styles.badgeText, { color: colors.success }]}>Đã giao</Text>
            </View>
          </View>

          <View style={styles.divider} />

          {/* Chi tiết sản phẩm */}
          <View style={styles.deliveredProdRow}>
            <Image source={{ uri: prod.imageUrl }} style={styles.deliveredThumb} resizeMode="contain" />
            <View style={styles.deliveredProdInfo}>
              <Text style={styles.productName} numberOfLines={2}>
                {prod.name}
              </Text>
              {prod.variantName ? (
                <Text style={styles.variantTag}>Phân loại: {prod.variantName}</Text>
              ) : null}
              <View style={styles.priceRow}>
                <Text style={styles.priceText}>{formatMoney(prod.price)}</Text>
                <Text style={styles.qtyText}>x{prod.quantity}</Text>
              </View>
            </View>
          </View>

          <View style={styles.divider} />

          {/* Hàng hành động */}
          <View style={styles.actionsRow}>
            {isReviewed ? (
              <View style={styles.reviewedGroup}>
                <View style={styles.reviewedBadge}>
                  <Ionicons name="checkmark-circle" size={15} color={colors.success} />
                  <Text style={styles.reviewedBadgeText}>Đã đánh giá</Text>
                </View>
                <Pressable
                  onPress={() => handleViewReview(order.id, prod)}
                  style={({ pressed }) => [styles.btn, styles.btnOutline, pressed && styles.btnPressed]}
                  accessibilityRole="button"
                  accessibilityLabel="Xem lại đánh giá"
                >
                  <Text style={styles.btnOutlineText}>Xem đánh giá</Text>
                </Pressable>
              </View>
            ) : (
              <Pressable
                onPress={() => handleRateProduct(order.id, prod)}
                style={({ pressed }) => [styles.btn, styles.btnPrimary, pressed && styles.btnPressed, { flex: 1 }]}
                accessibilityRole="button"
                accessibilityLabel="Đánh giá sản phẩm"
              >
                <Ionicons name="star" size={16} color={colors.white} />
                <Text style={styles.btnPrimaryText}>Đánh giá</Text>
              </Pressable>
            )}
          </View>
        </View>
      );
    },
    [handleRateProduct, handleViewReview],
  );

  const renderEmpty = useCallback(() => {
    const copy = EMPTY_COPY[activeTab];
    return (
      <EmptyState
        icon="receipt-outline"
        title={copy.title}
        subtitle={copy.text}
        actionLabel="Tiếp tục mua sắm"
        onAction={goShopping}
      />
    );
  }, [activeTab, goShopping]);

  // Trạng thái loading ban đầu
  if (loading && orders.length === 0) {
    return (
      <SafeAreaView style={styles.safe} edges={['top']}>
        <LoadingView label="Đang tải đơn hàng..." />
      </SafeAreaView>
    );
  }

  // Lỗi khi chưa có dữ liệu
  if (error && orders.length === 0) {
    return (
      <SafeAreaView style={styles.safe} edges={['top']}>
        <ErrorView message={error} onRetry={loadOrders} />
      </SafeAreaView>
    );
  }

  const itemsCountText =
    activeTab === 'delivered'
      ? `${deliveredItems.length} sản phẩm`
      : `${filteredOrders.length} đơn hàng`;

  return (
    <SafeAreaView style={styles.safe} edges={['top']}>
      <ScreenHeader
        title="Đơn hàng của tôi"
        subtitle={itemsCountText}
        onBack={handleBack}
      />

      {/* Bộ lọc trạng thái */}
      <View style={styles.tabsRow}>
        {TABS.map((tab) => {
          const isActive = tab.key === activeTab;
          return (
            <Pressable
              key={tab.key}
              onPress={() => setActiveTab(tab.key)}
              style={({ pressed }) => [
                styles.tab,
                isActive && styles.tabActive,
                pressed && !isActive && styles.tabPressed,
              ]}
              accessibilityRole="button"
              accessibilityState={{ selected: isActive }}
              accessibilityLabel={tab.label}
            >
              <Text numberOfLines={1} style={[styles.tabLabel, isActive && styles.tabLabelActive]}>
                {tab.label}
              </Text>
            </Pressable>
          );
        })}
      </View>

      <FlatList
        data={activeTab === 'delivered' ? (deliveredItems as any) : filteredOrders}
        keyExtractor={(item: any) => (activeTab === 'delivered' ? item.uniqueKey : item.id)}
        renderItem={activeTab === 'delivered' ? (renderDeliveredItem as any) : renderItem}
        showsVerticalScrollIndicator={false}
        contentContainerStyle={[
          styles.listContent,
          (activeTab === 'delivered' ? deliveredItems.length === 0 : filteredOrders.length === 0) &&
            styles.listContentEmpty,
        ]}
        ListEmptyComponent={renderEmpty}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={handleRefresh}
            tintColor={colors.primary}
            colors={[colors.primary]}
          />
        }
      />

      {/* Modal đánh giá sản phẩm */}
      <ReviewModal
        visible={reviewModalVisible}
        onClose={() => setReviewModalVisible(false)}
        item={reviewTargetItem}
        orderId={reviewTargetOrderId}
        reviewedItemIds={orders.find((o) => o.id === reviewTargetOrderId)?.reviewedItemIds || []}
        onSuccess={handleReviewSuccess}
      />

      {/* Xác nhận huỷ đơn */}
      <ConfirmSheet
        visible={confirmVisible}
        title="Huỷ đơn hàng"
        message={`Bạn có chắc chắn muốn huỷ đơn ${cancelTarget?.id ?? ''} không?`}
        confirmText="Huỷ đơn"
        cancelText="Giữ đơn"
        danger
        onConfirm={confirmCancel}
        onCancel={() => setConfirmVisible(false)}
      />

      {/* Thông báo nhẹ */}
      <Toast
        message={toastMessage}
        visible={toastVisible}
        onHide={() => setToastVisible(false)}
      />
    </SafeAreaView>
  );
}

/* ------------------------------ Styles ------------------------------- */

const styles = StyleSheet.create({
  safe: {
    flex: 1,
    backgroundColor: colors.background,
  },
  tabsRow: {
    flexDirection: 'row',
    paddingHorizontal: spacing.lg,
    gap: spacing.xs,
    marginBottom: spacing.lg,
  },
  tab: {
    flex: 1,
    height: 44,
    borderRadius: radius.md,
    backgroundColor: colors.card,
    borderWidth: 1,
    borderColor: colors.border,
    alignItems: 'center',
    justifyContent: 'center',
  },
  tabActive: {
    backgroundColor: colors.dark,
    borderColor: colors.dark,
  },
  tabPressed: {
    backgroundColor: colors.border,
  },
  tabLabel: {
    fontSize: 13,
    fontWeight: '600',
    color: colors.textSecondary,
  },
  tabLabelActive: {
    color: colors.white,
  },
  listContent: {
    paddingHorizontal: spacing.lg,
    paddingBottom: spacing.xxl,
  },
  listContentEmpty: {
    flexGrow: 1,
  },
  card: {
    backgroundColor: colors.card,
    borderRadius: radius.lg,
    padding: spacing.lg,
    marginBottom: spacing.lg,
    borderWidth: 1,
    borderColor: colors.border,
    shadowColor: colors.dark,
    shadowOpacity: 0.04,
    shadowRadius: 12,
    shadowOffset: { width: 0, height: 4 },
    elevation: 2,
  },
  cardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  thumb: {
    width: 44,
    height: 44,
    borderRadius: radius.md,
    backgroundColor: colors.primarySoft,
    alignItems: 'center',
    justifyContent: 'center',
    overflow: 'hidden',
  },
  thumbImage: {
    width: '86%',
    height: '86%',
  },
  headerInfo: {
    flex: 1,
    marginLeft: spacing.md,
  },
  orderCode: {
    fontSize: 15,
    fontWeight: '700',
    color: colors.dark,
  },
  orderMeta: {
    marginTop: 2,
    fontSize: 12,
    color: colors.textMuted,
  },
  headerRight: {
    alignItems: 'flex-end',
    marginLeft: spacing.sm,
  },
  totalText: {
    fontSize: 15,
    fontWeight: '700',
    color: colors.dark,
  },
  badge: {
    marginTop: spacing.xs,
    paddingHorizontal: spacing.sm,
    paddingVertical: 3,
    borderRadius: radius.sm,
  },
  badgeText: {
    fontSize: 10.5,
    fontWeight: '800',
  },
  divider: {
    height: 1,
    backgroundColor: colors.border,
    marginVertical: spacing.md,
  },
  products: {
    gap: spacing.sm,
  },
  productRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  productIcon: {
    width: 26,
    height: 26,
    borderRadius: radius.sm,
    backgroundColor: colors.card,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: colors.border,
  },
  productName: {
    flex: 1,
    marginLeft: spacing.sm,
    fontSize: 13,
    fontWeight: '500',
    color: colors.dark,
  },
  productQty: {
    marginLeft: spacing.sm,
    fontSize: 12,
    fontWeight: '600',
    color: colors.textMuted,
  },
  actionsRow: {
    flexDirection: 'row',
    gap: spacing.sm,
  },
  btn: {
    flex: 1,
    minHeight: 44,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.xs,
    borderRadius: radius.md,
  },
  btnPressed: {
    opacity: 0.85,
    transform: [{ scale: 0.98 }],
  },
  btnPrimary: {
    backgroundColor: colors.primary,
  },
  btnPrimaryText: {
    fontSize: 13,
    fontWeight: '700',
    color: colors.white,
  },
  btnOutline: {
    backgroundColor: colors.card,
    borderWidth: 1,
    borderColor: colors.border,
  },
  btnOutlineText: {
    fontSize: 13,
    fontWeight: '700',
    color: colors.dark,
  },
  btnDanger: {
    backgroundColor: colors.dangerSoft,
    borderWidth: 1,
    borderColor: '#FBDADA',
  },
  btnDangerText: {
    fontSize: 13,
    fontWeight: '700',
    color: colors.danger,
  },
  deliveredProdRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  deliveredThumb: {
    width: 68,
    height: 68,
    borderRadius: radius.md,
    backgroundColor: colors.border,
  },
  deliveredProdInfo: {
    flex: 1,
    marginLeft: spacing.md,
  },
  variantTag: {
    fontSize: 12,
    color: colors.textMuted,
    marginTop: 2,
  },
  priceRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginTop: 4,
  },
  priceText: {
    fontSize: 14,
    fontWeight: '700',
    color: colors.primary,
  },
  qtyText: {
    fontSize: 12,
    fontWeight: '600',
    color: colors.textMuted,
  },
  reviewedGroup: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
  },
  reviewedBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: '#ECFDF5',
    paddingHorizontal: 8,
    paddingVertical: 6,
    borderRadius: radius.sm,
  },
  reviewedBadgeText: {
    fontSize: 12,
    fontWeight: '700',
    color: colors.success,
  },
});
