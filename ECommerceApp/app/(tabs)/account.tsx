import React, { useCallback, useMemo, useRef, useState } from 'react';
import {
  ActivityIndicator,
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
import { useRouter } from 'expo-router';
import { colors, radius, spacing } from '../../src/constants/theme';
import { ListItemRow } from '../../src/components/ListItemRow';
import { LoadingView } from '../../src/components/LoadingView';
import { useAuth } from '../../src/context/AuthContext';
import { useCart } from '../../src/context/CartContext';
import { useOrders } from '../../src/context/OrdersContext';
import { useAddresses } from '../../src/context/AddressesContext';
import { usePaymentMethods } from '../../src/context/PaymentMethodsContext';
import { useNotifications } from '../../src/context/NotificationsContext';

type IoniconName = keyof typeof Ionicons.glyphMap;

interface MenuItem {
  id: string;
  icon: IoniconName;
  title: string;
  subtitle?: string;
  onPress: () => void;
}

const CARD_SHADOW = {
  shadowColor: colors.dark,
  shadowOffset: { width: 0, height: 4 },
  shadowOpacity: 0.05,
  shadowRadius: 10,
  elevation: 2,
};

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
    paddingBottom: spacing.xxl + spacing.lg,
  },
  header: {
    paddingTop: spacing.sm,
    paddingBottom: spacing.lg,
  },
  headerTitle: {
    fontSize: 26,
    fontWeight: '800',
    color: colors.dark,
    letterSpacing: -0.4,
  },
  profileCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.card,
    borderRadius: radius.xl,
    padding: spacing.lg,
    borderWidth: 1,
    borderColor: colors.border,
    ...CARD_SHADOW,
  },
  avatar: {
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
    overflow: 'hidden',
  },
  avatarImage: {
    width: 60,
    height: 60,
    borderRadius: 30,
  },
  profileInfo: {
    flex: 1,
    marginLeft: spacing.md,
  },
  profileName: {
    fontSize: 18,
    fontWeight: '700',
    color: colors.dark,
  },
  profileEmail: {
    fontSize: 13,
    color: colors.textMuted,
    marginTop: 2,
  },
  proBadge: {
    alignSelf: 'flex-start',
    backgroundColor: colors.primarySoft,
    paddingHorizontal: spacing.sm,
    paddingVertical: 3,
    borderRadius: radius.sm,
    marginTop: spacing.xs,
  },
  proBadgeText: {
    fontSize: 10,
    fontWeight: '800',
    color: colors.primary,
    letterSpacing: 0.6,
  },
  editButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
  },
  statsRow: {
    flexDirection: 'row',
    gap: spacing.md,
    marginTop: spacing.md,
  },
  statCard: {
    flex: 1,
    minHeight: 64,
    backgroundColor: colors.card,
    borderRadius: radius.lg,
    paddingVertical: spacing.md,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: colors.border,
    ...CARD_SHADOW,
  },
  statValue: {
    fontSize: 20,
    fontWeight: '800',
    color: colors.dark,
  },
  statLabel: {
    fontSize: 12,
    fontWeight: '500',
    color: colors.textMuted,
    marginTop: 2,
  },
  sectionTitle: {
    fontSize: 12,
    fontWeight: '700',
    letterSpacing: 0.8,
    color: colors.textMuted,
    marginTop: spacing.xl,
    marginBottom: spacing.sm,
    marginLeft: spacing.xs,
  },
  card: {
    backgroundColor: colors.card,
    borderRadius: radius.lg,
    borderWidth: 1,
    borderColor: colors.border,
    overflow: 'hidden',
    ...CARD_SHADOW,
  },
  divider: {
    height: StyleSheet.hairlineWidth,
    backgroundColor: colors.border,
  },
  logoutButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    minHeight: 52,
    backgroundColor: colors.dangerSoft,
    paddingVertical: spacing.md,
    borderRadius: radius.lg,
    marginTop: spacing.xl,
    gap: spacing.sm,
  },
  logoutButtonDisabled: {
    opacity: 0.6,
  },
  logoutText: {
    fontSize: 15,
    fontWeight: '700',
    color: colors.danger,
  },
  versionText: {
    textAlign: 'center',
    fontSize: 12,
    color: colors.grayLight,
    marginTop: spacing.md,
  },
  pressed: {
    opacity: 0.85,
  },
});

interface MenuSectionProps {
  items: MenuItem[];
}

function MenuSection({ items }: MenuSectionProps) {
  return (
    <View style={styles.card}>
      {items.map((item, index) => (
        <View key={item.id}>
          <ListItemRow
            icon={item.icon}
            title={item.title}
            subtitle={item.subtitle}
            showChevron
            onPress={item.onPress}
          />
          {index < items.length - 1 ? <View style={styles.divider} /> : null}
        </View>
      ))}
    </View>
  );
}

export default function AccountScreen() {
  const router = useRouter();
  const { user, isLoading: authLoading, logout } = useAuth();
  const { totalItems } = useCart();
  const { orders, loading: ordersLoading, error: ordersError } = useOrders();
  const { addresses, defaultAddress, loading: addressesLoading } = useAddresses();
  const { methods, defaultMethod, loading: paymentsLoading } = usePaymentMethods();
  const { unreadCount, loading: notificationsLoading } = useNotifications();

  const [loggingOut, setLoggingOut] = useState(false);
  const loggingOutRef = useRef(false);

  const handleLogout = useCallback(async () => {
    if (loggingOutRef.current) return;

    loggingOutRef.current = true;
    setLoggingOut(true);
    try {
      await logout();
      router.replace('/(tabs)/home');
    } finally {
      loggingOutRef.current = false;
      setLoggingOut(false);
    }
  }, [logout, router]);

  const processingCount = useMemo(
    () => (orders ?? []).filter((order) => order.status === 'processing').length,
    [orders],
  );

  const userName = user?.fullName || user?.displayName || 'Khách';
  const userEmail = user?.email || 'Đăng nhập để xem thông tin';
  const isPro = Boolean(user && !user.isGuest);

  const orderSubtitle = ordersLoading
    ? 'Đang tải đơn hàng...'
    : ordersError
      ? `Lỗi: ${ordersError}`
      : processingCount > 0
        ? `${processingCount} đơn hàng đang xử lý`
        : 'Chưa có đơn hàng';

  const cartSubtitle = `${totalItems} món đồ trong giỏ`;

  const addressSubtitle = addressesLoading
    ? 'Đang tải địa chỉ...'
    : addresses.length === 0
      ? 'Chưa có địa chỉ nhận hàng'
      : `${addresses.length} địa chỉ đã lưu · ${defaultAddress?.label ?? 'Chưa có mặc định'}`;

  const paymentSubtitle = paymentsLoading
    ? 'Đang tải phương thức...'
    : methods.length === 0
      ? 'Chưa có phương thức thanh toán'
      : defaultMethod
        ? `${defaultMethod.name} · ${defaultMethod.detail}`
        : `${methods.length} phương thức thanh toán`;

  const notificationSubtitle = notificationsLoading
    ? 'Đang tải thông báo...'
    : unreadCount > 0
      ? `${unreadCount} thông báo chưa đọc`
      : 'Không có thông báo mới';

  const orderItems: MenuItem[] = [
    {
      id: 'my-orders',
      icon: 'cube-outline',
      title: 'Đơn hàng của tôi',
      subtitle: orderSubtitle,
      onPress: () => router.push('/orders'),
    },
    {
      id: 'my-cart',
      icon: 'cart-outline',
      title: 'Giỏ hàng của tôi',
      subtitle: cartSubtitle,
      onPress: () => router.push('/cart'),
    },
  ];

  const accountItems: MenuItem[] = [
    {
      id: 'shipping-address',
      icon: 'location-outline',
      title: 'Địa chỉ nhận hàng',
      subtitle: addressSubtitle,
      onPress: () => router.push('/shipping-address'),
    },
    {
      id: 'payment-methods',
      icon: 'card-outline',
      title: 'Phương thức thanh toán',
      subtitle: paymentSubtitle,
      onPress: () => router.push('/payment-method'),
    },
    {
      id: 'notifications',
      icon: 'notifications-outline',
      title: 'Thông báo',
      subtitle: notificationSubtitle,
      onPress: () => router.push('/notification'),
    },
    {
      id: 'app-settings',
      icon: 'settings-outline',
      title: 'Cài đặt ứng dụng',
      subtitle: 'Giao diện, ngôn ngữ, bảo mật',
      onPress: () => router.push('/app-settings'),
    },
  ];

  const supportItems: MenuItem[] = [
    {
      id: 'help-center',
      icon: 'help-buoy-outline',
      title: 'Trung tâm hỗ trợ',
      subtitle: 'Câu hỏi thường gặp & Hỗ trợ 24/7',
      onPress: () => router.push('/help'),
    },
  ];

  if (authLoading) {
    return <LoadingView label="Đang tải hồ sơ..." />;
  }

  return (
    <SafeAreaView style={styles.safeArea} edges={['top']}>
      <ScrollView
        style={styles.scroll}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.header}>
          <Text style={styles.headerTitle}>Tài khoản</Text>
        </View>

        <View style={styles.profileCard}>
          <View style={styles.avatar} accessibilityLabel="Ảnh đại diện">
            {user?.avatarUrl ? (
              <Image source={{ uri: user.avatarUrl }} style={styles.avatarImage} />
            ) : (
              <Ionicons name="person" size={30} color={colors.white} />
            )}
          </View>

          <View style={styles.profileInfo}>
            <Text style={styles.profileName}>{userName}</Text>
            <Text style={styles.profileEmail}>{userEmail}</Text>

            {isPro ? (
              <View style={styles.proBadge}>
                <Text style={styles.proBadgeText}>THÀNH VIÊN PRO</Text>
              </View>
            ) : null}
          </View>

          <Pressable
            onPress={() => router.push(user ? '/update-user' : '/(auth)/login')}
            style={({ pressed }) => [styles.editButton, pressed && styles.pressed]}
            hitSlop={4}
            accessibilityRole="button"
            accessibilityLabel={user ? 'Chỉnh sửa hồ sơ' : 'Đăng nhập'}
          >
            <Ionicons name={user ? 'pencil' : 'log-in-outline'} size={18} color={colors.white} />
          </Pressable>
        </View>

        <Text style={styles.sectionTitle}>ĐƠN HÀNG & MUA SẮM</Text>
        <MenuSection items={orderItems} />

        <Text style={styles.sectionTitle}>CÀI ĐẶT TÀI KHOẢN</Text>
        <MenuSection items={accountItems} />

        <Text style={styles.sectionTitle}>TRỢ GIÚP</Text>
        <MenuSection items={supportItems} />

        {user ? (
          <Pressable
            onPress={() => {
              Alert.alert('Đăng xuất', 'Bạn có muốn đăng xuất khỏi tài khoản?', [
                { text: 'Huỷ', style: 'cancel' },
                {
                  text: 'Đăng xuất',
                  style: 'destructive',
                  onPress: () => {
                    void handleLogout();
                  },
                },
              ]);
            }}
            disabled={loggingOut}
            style={({ pressed }) => [
              styles.logoutButton,
              loggingOut && styles.logoutButtonDisabled,
              pressed && styles.pressed,
            ]}
            accessibilityRole="button"
            accessibilityLabel="Đăng xuất"
            accessibilityState={{ disabled: loggingOut, busy: loggingOut }}
          >
            {loggingOut ? (
              <ActivityIndicator size="small" color={colors.danger} />
            ) : (
              <Ionicons name="log-out-outline" size={20} color={colors.danger} />
            )}
            <Text style={styles.logoutText}>
              {loggingOut ? 'Đang đăng xuất...' : 'Đăng xuất'}
            </Text>
          </Pressable>
        ) : (
          <Pressable
            onPress={() => router.push('/(auth)/login')}
            style={({ pressed }) => [
              styles.logoutButton,
              { borderColor: colors.primary, backgroundColor: colors.primarySoft },
              pressed && styles.pressed,
            ]}
            accessibilityRole="button"
            accessibilityLabel="Đăng nhập"
          >
            <Ionicons name="log-in-outline" size={20} color={colors.primary} />
            <Text style={[styles.logoutText, { color: colors.primary }]}>Đăng nhập / Đăng ký</Text>
          </Pressable>
        )}

        <Text style={styles.versionText}>Phiên bản 1.0.4 · E-Commerce Market</Text>
      </ScrollView>
    </SafeAreaView>
  );
}
