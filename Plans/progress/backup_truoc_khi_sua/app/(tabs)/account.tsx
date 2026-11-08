import React from 'react';
import {
  View,
  Alert,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  Platform,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { colors } from '../../src/constants/theme';

type IoniconName = keyof typeof Ionicons.glyphMap;

interface MenuRowProps {
  icon: IoniconName;
  title: string;
  subtitle?: string;
  onPress?: () => void;
  isLast?: boolean;
}

const USER = {
  name: 'Trần Minh Alex',
  email: 'alex.carter@novatech.io',
  isPro: true,
  initials: 'TA',
};

const STATS = [
  { id: 'orders', value: '1', label: 'Đơn hàng' },
  { id: 'wishlist', value: '3', label: 'Yêu thích' },
];

const ORDERS_ITEMS: { id: string; icon: IoniconName; title: string; subtitle: string }[] = [
  { id: 'my-orders', icon: 'cube-outline', title: 'Đơn hàng của tôi', subtitle: '1 đơn hàng đang xử lý' },
  { id: 'my-cart', icon: 'cart-outline', title: 'Giỏ hàng của tôi', subtitle: '1 món đồ trong giỏ' },
  { id: 'favourites', icon: 'heart-outline', title: 'Danh sách yêu thích', subtitle: '3 sản phẩm đã lưu' },
];

const ACCOUNT_ITEMS: { id: string; icon: IoniconName; title: string; subtitle: string }[] = [
  { id: 'shipping-address', icon: 'location-outline', title: 'Địa chỉ nhận hàng', subtitle: '2 địa chỉ đã lưu · Nhà riêng' },
  { id: 'payment-methods', icon: 'card-outline', title: 'Phương thức thanh toán', subtitle: 'Visa · •••• 4242' },
  { id: 'notifications', icon: 'notifications-outline', title: 'Thông báo', subtitle: 'Cập nhật đơn hàng & Khuyến mãi' },
  { id: 'app-settings', icon: 'settings-outline', title: 'Cài đặt ứng dụng', subtitle: 'Giao diện, ngôn ngữ, bảo mật' },
];

const SUPPORT_ITEMS: { id: string; icon: IoniconName; title: string; subtitle?: string }[] = [
  { id: 'help-center', icon: 'help-buoy-outline', title: 'Trung tâm hỗ trợ', subtitle: 'Câu hỏi thường gặp & Hỗ trợ 24/7' },
];

const MenuRow: React.FC<MenuRowProps> = ({ icon, title, subtitle, onPress, isLast }) => (
  <TouchableOpacity
    activeOpacity={0.7}
    onPress={onPress}
    style={[styles.row, !isLast && styles.rowDivider]}
  >
    <View style={styles.rowIconWrap}>
      <Ionicons name={icon} size={20} color={colors.primary} />
    </View>

    <View style={styles.rowTextWrap}>
      <Text style={styles.rowTitle}>{title}</Text>
      {!!subtitle && <Text style={styles.rowSubtitle}>{subtitle}</Text>}
    </View>

    <Ionicons name="chevron-forward" size={18} color="#C3C7CE" />
  </TouchableOpacity>
);

export default function AccountScreen() {
  const router = useRouter();

  return (
    <SafeAreaView style={styles.safeArea} edges={['top']}>
      <ScrollView
        style={styles.scroll}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {/* Header (đã bỏ icon chat không cần thiết) */}
        <View style={styles.header}>
          <Text style={styles.headerTitle}>Tài khoản</Text>
        </View>

        {/* Profile card */}
        <View style={styles.profileCard}>
          <View style={styles.avatar}>
            <Ionicons name="person" size={30} color="#FFFFFF" />
          </View>

          <View style={styles.profileInfo}>
            <Text style={styles.profileName}>{USER.name}</Text>
            <Text style={styles.profileEmail}>{USER.email}</Text>

            {USER.isPro && (
              <View style={styles.proBadge}>
                <Text style={styles.proBadgeText}>THÀNH VIÊN PRO</Text>
              </View>
            )}
          </View>

          <TouchableOpacity
            activeOpacity={0.8}
            style={styles.editButton}
            onPress={() => router.push('/update-user')}
          >
            <Ionicons name="pencil" size={16} color="#FFFFFF" />
          </TouchableOpacity>
        </View>

        {/* Stats */}
        <View style={styles.statsRow}>
          {STATS.map((stat) => (
            <TouchableOpacity
              key={stat.id}
              activeOpacity={0.85}
              style={styles.statCard}
              onPress={() => router.push(stat.id === 'orders' ? '/orders' : '/(tabs)/favourite')}
            >
              <Text style={styles.statValue}>{stat.value}</Text>
              <Text style={styles.statLabel}>{stat.label}</Text>
            </TouchableOpacity>
          ))}
        </View>

        {/* Đơn hàng & Giỏ hàng */}
        <Text style={styles.sectionTitle}>ĐƠN HÀNG & MUA SẮM</Text>
        <View style={styles.card}>
          {ORDERS_ITEMS.map((item, index) => (
            <MenuRow
              key={item.id}
              icon={item.icon}
              title={item.title}
              subtitle={item.subtitle}
              isLast={index === ORDERS_ITEMS.length - 1}
              onPress={() => {
                if (item.id === 'my-orders') router.push('/orders');
                else if (item.id === 'my-cart') router.push('/cart');
                else if (item.id === 'favourites') router.push('/(tabs)/favourite');
              }}
            />
          ))}
        </View>

        {/* Tài khoản cá nhân */}
        <Text style={styles.sectionTitle}>CÀI ĐẶT TÀI KHOẢN</Text>
        <View style={styles.card}>
          {ACCOUNT_ITEMS.map((item, index) => (
            <MenuRow
              key={item.id}
              icon={item.icon}
              title={item.title}
              subtitle={item.subtitle}
              isLast={index === ACCOUNT_ITEMS.length - 1}
              onPress={() => {
                if (item.id === 'shipping-address') router.push('/shipping-address');
                else if (item.id === 'payment-methods') router.push('/payment-method');
                else if (item.id === 'notifications') router.push('/notification');
                else if (item.id === 'app-settings') router.push('/app-settings');
              }}
            />
          ))}
        </View>

        {/* Hỗ trợ */}
        <Text style={styles.sectionTitle}>TRỢ GIÚP</Text>
        <View style={styles.card}>
          {SUPPORT_ITEMS.map((item, index) => (
            <MenuRow
              key={item.id}
              icon={item.icon}
              title={item.title}
              subtitle={item.subtitle}
              isLast={index === SUPPORT_ITEMS.length - 1}
              onPress={() => router.push('/help')}
            />
          ))}
        </View>

        {/* Đăng xuất */}
        <TouchableOpacity
          activeOpacity={0.85}
          style={styles.logoutButton}
          onPress={() => router.replace('/(auth)/login')}
        >
          <Ionicons name="log-out-outline" size={20} color="#E53935" />
          <Text style={styles.logoutText}>Đăng xuất</Text>
        </TouchableOpacity>

        <Text style={styles.versionText}>Phiên bản 1.0.4 · E-Commerce Market</Text>
      </ScrollView>
    </SafeAreaView>
  );
}

const CARD_SHADOW = Platform.select({
  ios: {
    shadowColor: '#1A1A1A',
    shadowOpacity: 0.05,
    shadowRadius: 10,
    shadowOffset: { width: 0, height: 4 },
  },
  android: {
    elevation: 2,
  },
  default: {},
});

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: colors.background,
  },
  scroll: {
    flex: 1,
  },
  scrollContent: {
    paddingHorizontal: 18,
    paddingBottom: 40,
  },
  header: {
    paddingTop: 10,
    paddingBottom: 16,
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
    backgroundColor: '#FFFFFF',
    borderRadius: 20,
    padding: 16,
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
  },
  profileInfo: {
    flex: 1,
    marginLeft: 14,
  },
  profileName: {
    fontSize: 18,
    fontWeight: '700',
    color: colors.dark,
  },
  profileEmail: {
    fontSize: 13,
    color: '#8E9299',
    marginTop: 2,
  },
  proBadge: {
    alignSelf: 'flex-start',
    backgroundColor: '#FFF2EB',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 6,
    marginTop: 6,
  },
  proBadgeText: {
    fontSize: 10,
    fontWeight: '800',
    color: colors.primary,
    letterSpacing: 0.6,
  },
  editButton: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
  },
  statsRow: {
    flexDirection: 'row',
    gap: 12,
    marginTop: 14,
  },
  statCard: {
    flex: 1,
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    paddingVertical: 14,
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
    color: '#8E9299',
    marginTop: 2,
  },
  sectionTitle: {
    fontSize: 12,
    fontWeight: '700',
    letterSpacing: 0.8,
    color: '#8E9299',
    marginTop: 24,
    marginBottom: 8,
    marginLeft: 4,
  },
  card: {
    backgroundColor: '#FFFFFF',
    borderRadius: 18,
    borderWidth: 1,
    borderColor: colors.border,
    overflow: 'hidden',
    ...CARD_SHADOW,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 14,
    paddingHorizontal: 16,
  },
  rowDivider: {
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: colors.border,
  },
  rowIconWrap: {
    width: 38,
    height: 38,
    borderRadius: 12,
    backgroundColor: '#FFF2EB',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 14,
  },
  rowTextWrap: {
    flex: 1,
  },
  rowTitle: {
    fontSize: 15,
    fontWeight: '600',
    color: colors.dark,
  },
  rowSubtitle: {
    fontSize: 12,
    color: '#8E9299',
    marginTop: 2,
  },
  logoutButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#FDECEC',
    paddingVertical: 14,
    borderRadius: 16,
    marginTop: 26,
    gap: 8,
  },
  logoutText: {
    fontSize: 15,
    fontWeight: '700',
    color: '#E53935',
  },
  versionText: {
    textAlign: 'center',
    fontSize: 12,
    color: '#A0A4AB',
    marginTop: 14,
  },
});
