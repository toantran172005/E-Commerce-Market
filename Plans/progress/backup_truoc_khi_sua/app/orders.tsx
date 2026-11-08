import React, { useCallback, useMemo, useState } from 'react';
import {
  Alert,
  FlatList,
  Pressable,
  RefreshControl,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { colors } from '../src/constants/theme';

/* ------------------------------- Types ------------------------------- */

type OrderStatus = 'processing' | 'delivered' | 'cancelled';
type TabKey = 'all' | OrderStatus;
type IconName = keyof typeof Ionicons.glyphMap;

type OrderItem = {
  id: string;
  name: string;
  qty: number;
  icon: IconName;
};

type Order = {
  id: string;
  code: string;
  date: string;
  itemCount: number;
  total: string;
  status: OrderStatus;
  items: OrderItem[];
};

/* ------------------------------- Config ------------------------------ */

const STATUS_META: Record<
  OrderStatus,
  { label: string; color: string; bg: string }
> = {
  processing: { label: 'Đang xử lý', color: colors.primary, bg: '#FFF0EA' },
  delivered: { label: 'Đã giao thành công', color: '#16A34A', bg: '#E9F9F0' },
  cancelled: { label: 'Đã hủy', color: '#8A8F98', bg: '#F1F2F4' },
};

const TABS: { key: TabKey; label: string }[] = [
  { key: 'all', label: 'All' },
  { key: 'processing', label: 'Processing' },
  { key: 'delivered', label: 'Delivered' },
  { key: 'cancelled', label: 'Cancelled' },
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
    title: 'Không có đơn đã hủy',
    text: 'Thật tuyệt! Bạn chưa phải hủy đơn hàng nào cả.',
  },
};

const INITIAL_ORDERS: Order[] = [
  {
    id: 'ORD-21530',
    code: '#ORD-21530',
    date: '27/10/2026',
    itemCount: 1,
    total: '$249.00',
    status: 'processing',
    items: [
      {
        id: 'p-aurabeats-pro',
        name: 'Tai nghe chống ồn AuraBeats Pro',
        qty: 1,
        icon: 'headset-outline',
      },
    ],
  },
  {
    id: 'ORD-19842',
    code: '#ORD-19842',
    date: '20/10/2026',
    itemCount: 2,
    total: '$1,048.00',
    status: 'delivered',
    items: [
      {
        id: 'p-pulse-11-ultra',
        name: 'Điện thoại Pulse 11 Ultra',
        qty: 1,
        icon: 'phone-portrait-outline',
      },
      {
        id: 'p-tempo-watch-active-2',
        name: 'Đồng hồ Tempo Watch Active 2',
        qty: 1,
        icon: 'watch-outline',
      },
    ],
  },
  {
    id: 'ORD-16504',
    code: '#ORD-16504',
    date: '22/10/2026',
    itemCount: 1,
    total: '$154.00',
    status: 'cancelled',
    items: [
      {
        id: 'p-nova-sound-mini',
        name: 'Loa Bluetooth Nova Sound Mini',
        qty: 1,
        icon: 'volume-high-outline',
      },
    ],
  },
];

/* ------------------------------ Screen ------------------------------- */

export default function MyOrdersScreen() {
  const router = useRouter();

  const [activeTab, setActiveTab] = useState<TabKey>('all');
  const [orders, setOrders] = useState<Order[]>(INITIAL_ORDERS);
  const [refreshing, setRefreshing] = useState(false);

  const filteredOrders = useMemo(
    () =>
      activeTab === 'all'
        ? orders
        : orders.filter((order) => order.status === activeTab),
    [orders, activeTab],
  );

  const openOrderDetail = useCallback(
    (order: Order) => {
      router.push({
        pathname: '/order/[id]',
        params: { id: order.id },
      });
    },
    [router],
  );

  const handleTrackOrder = useCallback(
    (order: Order) => {
      openOrderDetail(order);
    },
    [openOrderDetail],
  );

  const handleCancelOrder = useCallback((order: Order) => {
    Alert.alert(
      'Hủy đơn hàng',
      `Bạn có chắc chắn muốn hủy đơn ${order.code} không?`,
      [
        { text: 'Không, giữ đơn', style: 'cancel' },
        {
          text: 'Hủy đơn',
          style: 'destructive',
          onPress: () => {
            setOrders((prev) =>
              prev.map((item) =>
                item.id === order.id ? { ...item, status: 'cancelled' } : item,
              ),
            );
          },
        },
      ],
    );
  }, []);

  const handleReorder = useCallback((order: Order) => {
    Alert.alert(
      'Đặt lại đơn hàng',
      `Đã thêm ${order.itemCount} sản phẩm từ ${order.code} vào giỏ hàng.`,
      [{ text: 'OK' }],
    );
  }, []);

  const handleRate = useCallback((order: Order) => {
    Alert.alert(
      'Đánh giá đơn hàng',
      `Bạn cảm thấy đơn ${order.code} thế nào? Hãy chia sẻ cảm nhận nhé!`,
      [{ text: 'Để sau', style: 'cancel' }, { text: 'Đánh giá ngay' }],
    );
  }, []);

  const onRefresh = useCallback(() => {
    setRefreshing(true);
    // TODO: thay bằng gọi API thật (fetch orders)
    setTimeout(() => setRefreshing(false), 900);
  }, []);

  const goShopping = useCallback(() => {
    router.back();
  }, [router]);

  const renderItem = useCallback(
    ({ item }: { item: Order }) => {
      const meta = STATUS_META[item.status];
      const primaryItem = item.items[0];

      return (
        <Pressable
          onPress={() => openOrderDetail(item)}
          android_ripple={{ color: 'rgba(255,87,34,0.08)' }}
          style={({ pressed }) => [
            styles.card,
            pressed && styles.cardPressed,
          ]}
        >
          {/* Card header */}
          <View style={styles.cardHeader}>
            <View style={styles.thumb}>
              <Ionicons
                name={primaryItem?.icon ?? 'cube-outline'}
                size={22}
                color={colors.primary}
              />
            </View>

            <View style={styles.headerInfo}>
              <Text style={styles.orderCode}>{item.code}</Text>
              <Text style={styles.orderMeta}>
                {item.date} · {item.itemCount}{' '}
                {item.itemCount > 1 ? 'items' : 'item'}
              </Text>
            </View>

            <View style={styles.headerRight}>
              <Text style={styles.totalText}>{item.total}</Text>
              <View style={[styles.badge, { backgroundColor: meta.bg }]}>
                <Text style={[styles.badgeText, { color: meta.color }]}>
                  {meta.label}
                </Text>
              </View>
            </View>
          </View>

          <View style={styles.divider} />

          {/* Products */}
          <View style={styles.products}>
            {item.items.map((product) => (
              <View key={product.id} style={styles.productRow}>
                <View style={styles.productIcon}>
                  <Ionicons
                    name={product.icon}
                    size={14}
                    color={colors.primary}
                  />
                </View>
                <Text style={styles.productName} numberOfLines={1}>
                  {product.name}
                </Text>
                <Text style={styles.productQty}>x{product.qty}</Text>
              </View>
            ))}
          </View>

          <View style={styles.divider} />

          {/* Actions */}
          <View style={styles.actionsRow}>
            {item.status === 'processing' && (
              <>
                <Pressable
                  onPress={() => handleTrackOrder(item)}
                  style={({ pressed }) => [
                    styles.btn,
                    styles.btnPrimary,
                    pressed && styles.btnPressed,
                  ]}
                >
                  <Ionicons
                    name="navigate-outline"
                    size={16}
                    color={colors.white}
                  />
                  <Text style={styles.btnPrimaryText}>Track Order</Text>
                </Pressable>

                <Pressable
                  onPress={() => handleCancelOrder(item)}
                  style={({ pressed }) => [
                    styles.btn,
                    styles.btnDanger,
                    pressed && styles.btnPressed,
                  ]}
                >
                  <Ionicons
                    name="close-circle-outline"
                    size={16}
                    color="#EF4444"
                  />
                  <Text style={styles.btnDangerText}>Cancel Order</Text>
                </Pressable>
              </>
            )}

            {item.status === 'delivered' && (
              <>
                <Pressable
                  onPress={() => handleReorder(item)}
                  style={({ pressed }) => [
                    styles.btn,
                    styles.btnPrimary,
                    pressed && styles.btnPressed,
                  ]}
                >
                  <Ionicons
                    name="repeat-outline"
                    size={16}
                    color={colors.white}
                  />
                  <Text style={styles.btnPrimaryText}>Re-order</Text>
                </Pressable>

                <Pressable
                  onPress={() => handleRate(item)}
                  style={({ pressed }) => [
                    styles.btn,
                    styles.btnOutline,
                    pressed && styles.btnPressed,
                  ]}
                >
                  <Ionicons
                    name="star-outline"
                    size={16}
                    color={colors.dark}
                  />
                  <Text style={styles.btnOutlineText}>Rate</Text>
                </Pressable>
              </>
            )}

            {item.status === 'cancelled' && (
              <>
                <Pressable
                  onPress={() => handleReorder(item)}
                  style={({ pressed }) => [
                    styles.btn,
                    styles.btnPrimary,
                    pressed && styles.btnPressed,
                  ]}
                >
                  <Ionicons
                    name="cart-outline"
                    size={16}
                    color={colors.white}
                  />
                  <Text style={styles.btnPrimaryText}>Buy Again</Text>
                </Pressable>

                <Pressable
                  onPress={() => openOrderDetail(item)}
                  style={({ pressed }) => [
                    styles.btn,
                    styles.btnOutline,
                    pressed && styles.btnPressed,
                  ]}
                >
                  <Ionicons
                    name="document-text-outline"
                    size={16}
                    color={colors.dark}
                  />
                  <Text style={styles.btnOutlineText}>View Details</Text>
                </Pressable>
              </>
            )}
          </View>
        </Pressable>
      );
    },
    [
      openOrderDetail,
      handleTrackOrder,
      handleCancelOrder,
      handleReorder,
      handleRate,
    ],
  );

  const renderEmpty = () => {
    const copy = EMPTY_COPY[activeTab];
    return (
      <View style={styles.emptyWrap}>
        <View style={styles.emptyCircle}>
          <Ionicons name="receipt-outline" size={42} color={colors.primary} />
        </View>
        <Text style={styles.emptyTitle}>{copy.title}</Text>
        <Text style={styles.emptyText}>{copy.text}</Text>
        <Pressable
          onPress={goShopping}
          style={({ pressed }) => [
            styles.emptyBtn,
            pressed && styles.btnPressed,
          ]}
        >
          <Ionicons name="bag-handle-outline" size={18} color={colors.white} />
          <Text style={styles.emptyBtnText}>Tiếp tục mua sắm</Text>
        </Pressable>
      </View>
    );
  };

  return (
    <SafeAreaView style={styles.safe} edges={['top']}>
      {/* Header */}
      <View style={styles.header}>
        <Pressable
          onPress={() => router.back()}
          hitSlop={8}
          style={({ pressed }) => [
            styles.backBtn,
            pressed && styles.backBtnPressed,
          ]}
        >
          <Ionicons name="arrow-back" size={20} color={colors.dark} />
        </Pressable>

        <View style={styles.headerText}>
          <Text style={styles.title}>My Orders</Text>
          <Text style={styles.subtitle}>
            {filteredOrders.length}{' '}
            {filteredOrders.length > 1 ? 'orders' : 'order'}
          </Text>
        </View>
      </View>

      {/* Tabs */}
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
            >
              <Text
                numberOfLines={1}
                style={[styles.tabLabel, isActive && styles.tabLabelActive]}
              >
                {tab.label}
              </Text>
            </Pressable>
          );
        })}
      </View>

      {/* List */}
      <FlatList
        data={filteredOrders}
        keyExtractor={(item) => item.id}
        renderItem={renderItem}
        extraData={activeTab}
        showsVerticalScrollIndicator={false}
        contentContainerStyle={[
          styles.listContent,
          filteredOrders.length === 0 && styles.listContentEmpty,
        ]}
        ListEmptyComponent={renderEmpty}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            tintColor={colors.primary}
            colors={[colors.primary]}
          />
        }
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

  /* Header */
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingTop: 8,
    paddingBottom: 18,
  },
  backBtn: {
    width: 44,
    height: 44,
    borderRadius: 14,
    backgroundColor: colors.white,
    borderWidth: 1,
    borderColor: colors.border,
    alignItems: 'center',
    justifyContent: 'center',
  },
  backBtnPressed: {
    backgroundColor: '#F1F2F5',
    transform: [{ scale: 0.96 }],
  },
  headerText: {
    flex: 1,
    marginLeft: 14,
  },
  title: {
    fontSize: 22,
    fontWeight: '700',
    color: colors.dark,
    letterSpacing: -0.3,
  },
  subtitle: {
    marginTop: 2,
    fontSize: 13,
    color: '#8A8F98',
    fontWeight: '500',
  },

  /* Tabs */
  tabsRow: {
    flexDirection: 'row',
    paddingHorizontal: 20,
    gap: 6,
    marginBottom: 16,
  },
  tab: {
    flex: 1,
    paddingVertical: 10,
    borderRadius: 12,
    backgroundColor: colors.white,
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
    backgroundColor: '#F1F2F5',
  },
  tabLabel: {
    fontSize: 12,
    fontWeight: '600',
    color: '#6B7280',
  },
  tabLabelActive: {
    color: colors.white,
  },

  /* List */
  listContent: {
    paddingHorizontal: 20,
    paddingBottom: 32,
  },
  listContentEmpty: {
    flexGrow: 1,
  },

  /* Card */
  card: {
    backgroundColor: colors.white,
    borderRadius: 18,
    padding: 16,
    marginBottom: 14,
    borderWidth: 1,
    borderColor: colors.border,
    shadowColor: '#1A1A1A',
    shadowOpacity: 0.04,
    shadowRadius: 12,
    shadowOffset: { width: 0, height: 4 },
    elevation: 2,
  },
  cardPressed: {
    backgroundColor: '#FCFCFD',
    transform: [{ scale: 0.995 }],
  },
  cardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  thumb: {
    width: 44,
    height: 44,
    borderRadius: 14,
    backgroundColor: '#FFF0EA',
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerInfo: {
    flex: 1,
    marginLeft: 12,
  },
  orderCode: {
    fontSize: 15,
    fontWeight: '700',
    color: colors.dark,
    letterSpacing: 0.2,
  },
  orderMeta: {
    marginTop: 3,
    fontSize: 12,
    color: '#8A8F98',
    fontWeight: '500',
  },
  headerRight: {
    alignItems: 'flex-end',
    marginLeft: 8,
  },
  totalText: {
    fontSize: 15,
    fontWeight: '700',
    color: colors.dark,
  },
  badge: {
    marginTop: 6,
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 8,
  },
  badgeText: {
    fontSize: 10,
    fontWeight: '700',
  },

  /* Divider */
  divider: {
    height: 1,
    backgroundColor: colors.border,
    marginVertical: 12,
  },

  /* Products */
  products: {
    gap: 8,
  },
  productRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  productIcon: {
    width: 26,
    height: 26,
    borderRadius: 8,
    backgroundColor: '#F6F7F9',
    alignItems: 'center',
    justifyContent: 'center',
  },
  productName: {
    flex: 1,
    marginLeft: 10,
    fontSize: 13,
    fontWeight: '500',
    color: colors.dark,
  },
  productQty: {
    marginLeft: 8,
    fontSize: 12,
    fontWeight: '600',
    color: '#8A8F98',
  },

  /* Actions */
  actionsRow: {
    flexDirection: 'row',
    gap: 10,
  },
  btn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    paddingVertical: 11,
    borderRadius: 12,
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
    backgroundColor: colors.white,
    borderWidth: 1,
    borderColor: colors.border,
  },
  btnOutlineText: {
    fontSize: 13,
    fontWeight: '700',
    color: colors.dark,
  },
  btnDanger: {
    backgroundColor: '#FEF2F2',
    borderWidth: 1,
    borderColor: '#FBDADA',
  },
  btnDangerText: {
    fontSize: 13,
    fontWeight: '700',
    color: '#EF4444',
  },

  /* Empty */
  emptyWrap: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 24,
    paddingBottom: 60,
  },
  emptyCircle: {
    width: 96,
    height: 96,
    borderRadius: 48,
    backgroundColor: '#FFF0EA',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 18,
  },
  emptyTitle: {
    fontSize: 17,
    fontWeight: '700',
    color: colors.dark,
    textAlign: 'center',
  },
  emptyText: {
    marginTop: 8,
    fontSize: 13,
    lineHeight: 20,
    color: '#8A8F98',
    textAlign: 'center',
    fontWeight: '500',
  },
  emptyBtn: {
    marginTop: 22,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    backgroundColor: colors.primary,
    paddingHorizontal: 22,
    paddingVertical: 12,
    borderRadius: 14,
  },
  emptyBtnText: {
    fontSize: 14,
    fontWeight: '700',
    color: colors.white,
  },
});