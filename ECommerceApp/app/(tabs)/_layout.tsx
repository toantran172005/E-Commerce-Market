import { Tabs } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { colors } from '../../src/constants/theme';
import { useFavourites } from '../../src/context/FavouritesContext';
import { useNotifications } from '../../src/context/NotificationsContext';

export default function TabLayout() {
  const insets = useSafeAreaInsets();
  const { favourites } = useFavourites();
  const { unreadCount } = useNotifications();

  const bottomInset = Math.max(insets.bottom, 8);

  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        tabBarActiveTintColor: colors.primary,
        tabBarInactiveTintColor: colors.textMuted,
        tabBarStyle: {
          backgroundColor: colors.card,
          borderTopColor: colors.border,
          height: 52 + bottomInset,
          paddingBottom: bottomInset,
          paddingTop: 6,
        },
        tabBarLabelStyle: {
          fontSize: 12,
          fontWeight: '600',
        },
      }}
    >
      {/* Ẩn index, chỉ dùng làm màn hình redirect */}
      <Tabs.Screen name="index" options={{ href: null }} />

      <Tabs.Screen
        name="home"
        options={{
          title: 'Trang chủ',
          tabBarIcon: ({ color, focused }) => (
            <Ionicons
              name={focused ? 'home' : 'home-outline'}
              size={24}
              color={typeof color === 'string' ? color : colors.primary}
            />
          ),
        }}
      />

      <Tabs.Screen
        name="favourite"
        options={{
          title: 'Yêu thích',
          tabBarBadge: favourites.length > 0 ? favourites.length : undefined,
          // Badge màu primary, nổi bật trên nền trắng
          tabBarBadgeStyle: { backgroundColor: colors.primary, color: colors.white },
          tabBarIcon: ({ color, focused }) => (
            <Ionicons
              name={focused ? 'heart' : 'heart-outline'}
              size={24}
              color={typeof color === 'string' ? color : colors.primary}
            />
          ),
        }}
      />

      <Tabs.Screen
        name="account"
        options={{
          title: 'Tài khoản',
          tabBarBadge: unreadCount > 0 ? unreadCount : undefined,
          // Badge thông báo dùng màu danger
          tabBarBadgeStyle: { backgroundColor: colors.danger, color: colors.white },
          tabBarIcon: ({ color, focused }) => (
            <Ionicons
              name={focused ? 'person' : 'person-outline'}
              size={24}
              color={typeof color === 'string' ? color : colors.primary}
            />
          ),
        }}
      />
    </Tabs>
  );
}
