import React, { useCallback, useMemo, useState } from 'react';
import {
  FlatList,
  ListRenderItem,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { colors } from '../src/constants/theme';

/* -------------------------------------------------------------------------- */
/*                                    Types                                   */
/* -------------------------------------------------------------------------- */

type NotificationCategory = 'orders' | 'promotions' | 'account';
type TabKey = 'all' | 'orders' | 'promotions';

interface NotificationItem {
  id: string;
  category: NotificationCategory;
  icon: keyof typeof Ionicons.glyphMap;
  iconColor: string;
  iconBackground: string;
  title: string;
  message: string;
  time: string;
  unread: boolean;
}

/* -------------------------------------------------------------------------- */
/*                                  Constants                                 */
/* -------------------------------------------------------------------------- */

const MUTED = '#8E929B';
const SECONDARY = '#5A5F6B';
const SOFT_ORANGE = '#FFF0EA';
const SOFT_GREEN = '#E8F8F0';
const SOFT_BLUE = '#EAF2FF';
const SOFT_PURPLE = '#F1EEFF';
const GREEN = '#1FA971';
const BLUE = '#2F6FED';
const PURPLE = '#6C5CE7';

const TABS: { key: TabKey; label: string }[] = [
  { key: 'all', label: 'All' },
  { key: 'orders', label: 'Orders' },
  { key: 'promotions', label: 'Promotions' },
];

const INITIAL_NOTIFICATIONS: NotificationItem[] = [
  {
    id: '1',
    category: 'orders',
    icon: 'checkmark-circle-outline',
    iconColor: GREEN,
    iconBackground: SOFT_GREEN,
    title: 'Order delivered successfully',
    message: 'Your order #ORD-4821 has been delivered. We hope you love it!',
    time: '2 hours ago',
    unread: true,
  },
  {
    id: '2',
    category: 'promotions',
    icon: 'flash-outline',
    iconColor: colors.primary,
    iconBackground: SOFT_ORANGE,
    title: 'Flash Sale is live ⚡',
    message: 'Up to 50% off selected items — today only, ends at midnight.',
    time: '2 hours ago',
    unread: true,
  },
  {
    id: '3',
    category: 'orders',
    icon: 'bicycle-outline',
    iconColor: BLUE,
    iconBackground: SOFT_BLUE,
    title: 'Your order is on the way',
    message: 'Package #ORD-4790 has left our warehouse and arrives tomorrow.',
    time: '5 hours ago',
    unread: true,
  },
  {
    id: '4',
    category: 'account',
    icon: 'person-circle-outline',
    iconColor: PURPLE,
    iconBackground: SOFT_PURPLE,
    title: 'Account information updated',
    message: 'Your name, email and phone number were updated successfully.',
    time: 'Yesterday',
    unread: false,
  },
  {
    id: '5',
    category: 'promotions',
    icon: 'pricetag-outline',
    iconColor: colors.primary,
    iconBackground: SOFT_ORANGE,
    title: 'Weekend deal: free shipping',
    message: 'Enjoy free shipping on all orders over $50 until Sunday.',
    time: 'Yesterday',
    unread: false,
  },
  {
    id: '6',
    category: 'orders',
    icon: 'return-down-back-outline',
    iconColor: GREEN,
    iconBackground: SOFT_GREEN,
    title: 'Return request approved',
    message: 'Your return for order #ORD-4712 was approved. Refund in 3–5 days.',
    time: '2 days ago',
    unread: false,
  },
  {
    id: '7',
    category: 'account',
    icon: 'shield-checkmark-outline',
    iconColor: PURPLE,
    iconBackground: SOFT_PURPLE,
    title: 'New login detected',
    message: 'We noticed a new sign-in from iPhone 15 · Ho Chi Minh City.',
    time: '3 days ago',
    unread: false,
  },
];

/* -------------------------------------------------------------------------- */
/*                                   Screen                                   */
/* -------------------------------------------------------------------------- */

export default function NotificationScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();

  const [activeTab, setActiveTab] = useState<TabKey>('all');
  const [notifications, setNotifications] = useState<NotificationItem[]>(
    INITIAL_NOTIFICATIONS,
  );

  const unreadCount = useMemo(
    () => notifications.filter((item) => item.unread).length,
    [notifications],
  );

  const filteredNotifications = useMemo(() => {
    if (activeTab === 'all') {
      return notifications;
    }
    return notifications.filter((item) => item.category === activeTab);
  }, [notifications, activeTab]);

  const handleMarkAllAsRead = useCallback(() => {
    setNotifications((prev) =>
      prev.map((item) => (item.unread ? { ...item, unread: false } : item)),
    );
  }, []);

  const handlePressNotification = useCallback((id: string) => {
    setNotifications((prev) =>
      prev.map((item) =>
        item.id === id && item.unread ? { ...item, unread: false } : item,
      ),
    );
  }, []);

  const handleGoBack = useCallback(() => {
    if (router.canGoBack()) {
      router.back();
    }
  }, [router]);

  const renderItem: ListRenderItem<NotificationItem> = useCallback(
    ({ item }) => (
      <TouchableOpacity
        activeOpacity={0.85}
        onPress={() => handlePressNotification(item.id)}
        style={[styles.card, item.unread && styles.cardUnread]}
      >
        <View style={[styles.iconCircle, { backgroundColor: item.iconBackground }]}>
          <Ionicons name={item.icon} size={21} color={item.iconColor} />
        </View>

        <View style={styles.cardContent}>
          <View style={styles.cardTopRow}>
            <Text
              numberOfLines={1}
              style={[styles.cardTitle, !item.unread && styles.cardTitleRead]}
            >
              {item.title}
            </Text>
            {item.unread ? <View style={styles.unreadDot} /> : null}
          </View>

          <Text numberOfLines={2} style={styles.cardMessage}>
            {item.message}
          </Text>

          <View style={styles.cardFooter}>
            <Ionicons name="time-outline" size={12} color={MUTED} />
            <Text style={styles.timeText}>{item.time}</Text>
          </View>
        </View>
      </TouchableOpacity>
    ),
    [handlePressNotification],
  );

  return (
    <SafeAreaView style={styles.safe} edges={['top', 'left', 'right']}>
      {/* ------------------------------ Header ------------------------------ */}
      <View style={styles.header}>
        <TouchableOpacity
          activeOpacity={0.7}
          onPress={handleGoBack}
          hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
          style={styles.backButton}
        >
          <Ionicons name="chevron-back" size={22} color={colors.dark} />
        </TouchableOpacity>

        <Text style={styles.headerTitle} numberOfLines={1}>
          Notifications
        </Text>

        <TouchableOpacity
          activeOpacity={0.7}
          onPress={handleMarkAllAsRead}
          disabled={unreadCount === 0}
          style={styles.markAllButton}
        >
          <Text
            style={[
              styles.markAllText,
              unreadCount === 0 && styles.markAllTextDisabled,
            ]}
          >
            Mark all as read
          </Text>
        </TouchableOpacity>
      </View>

      {/* ------------------------------- Tabs ------------------------------- */}
      <View style={styles.tabsRow}>
        {TABS.map((tab) => {
          const isActive = tab.key === activeTab;
          return (
            <TouchableOpacity
              key={tab.key}
              activeOpacity={0.8}
              onPress={() => setActiveTab(tab.key)}
              style={[styles.tab, isActive && styles.tabActive]}
            >
              <Text style={[styles.tabText, isActive && styles.tabTextActive]}>
                {tab.label}
              </Text>
            </TouchableOpacity>
          );
        })}
      </View>

      {/* ------------------------------- List ------------------------------- */}
      <FlatList
        data={filteredNotifications}
        keyExtractor={(item) => item.id}
        renderItem={renderItem}
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.listContent}
        ListEmptyComponent={
          <View style={styles.emptyContainer}>
            <View style={styles.emptyIconCircle}>
              <Ionicons
                name="notifications-off-outline"
                size={30}
                color={colors.primary}
              />
            </View>
            <Text style={styles.emptyTitle}>No notifications yet</Text>
            <Text style={styles.emptyText}>
              When something happens, you will see it right here.
            </Text>
          </View>
        }
      />

      {/* ------------------------------ Footer ------------------------------ */}
      <View style={[styles.footer, { paddingBottom: insets.bottom + 14 }]}>
        <TouchableOpacity
          activeOpacity={0.85}
          onPress={handleGoBack}
          style={styles.doneButton}
        >
          <Text style={styles.doneText}>Done</Text>
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
}

/* -------------------------------------------------------------------------- */
/*                                 Stylesheet                                 */
/* -------------------------------------------------------------------------- */

const styles = StyleSheet.create({
  safe: {
    flex: 1,
    backgroundColor: colors.background,
  },

  /* Header */
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingTop: 8,
    paddingBottom: 12,
  },
  backButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: colors.border,
  },
  headerTitle: {
    flex: 1,
    marginLeft: 12,
    fontSize: 20,
    fontWeight: '700',
    letterSpacing: -0.4,
    color: colors.dark,
  },
  markAllButton: {
    paddingHorizontal: 10,
    paddingVertical: 8,
    borderRadius: 12,
  },
  markAllText: {
    fontSize: 13,
    fontWeight: '600',
    color: colors.primary,
  },
  markAllTextDisabled: {
    color: '#C3C7CE',
  },

  /* Tabs */
  tabsRow: {
    flexDirection: 'row',
    paddingHorizontal: 16,
    paddingBottom: 6,
  },
  tab: {
    paddingHorizontal: 18,
    paddingVertical: 9,
    borderRadius: 999,
    marginRight: 8,
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: colors.border,
  },
  tabActive: {
    backgroundColor: colors.primary,
    borderColor: colors.primary,
  },
  tabText: {
    fontSize: 13.5,
    fontWeight: '600',
    color: SECONDARY,
  },
  tabTextActive: {
    color: '#FFFFFF',
  },

  /* List */
  listContent: {
    paddingHorizontal: 16,
    paddingTop: 10,
    paddingBottom: 20,
    flexGrow: 1,
  },
  card: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    backgroundColor: '#FFFFFF',
    borderRadius: 18,
    borderWidth: 1,
    borderColor: colors.border,
    paddingHorizontal: 14,
    paddingVertical: 14,
    marginBottom: 12,
  },
  cardUnread: {
    borderColor: '#FFD9C7',
    shadowColor: colors.dark,
    shadowOpacity: 0.06,
    shadowRadius: 12,
    shadowOffset: { width: 0, height: 6 },
    elevation: 2,
  },
  iconCircle: {
    width: 44,
    height: 44,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
  },
  cardContent: {
    flex: 1,
    marginLeft: 12,
  },
  cardTopRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  cardTitle: {
    flex: 1,
    fontSize: 14.5,
    fontWeight: '700',
    letterSpacing: -0.2,
    color: colors.dark,
  },
  cardTitleRead: {
    fontWeight: '600',
    color: '#3C4149',
  },
  unreadDot: {
    width: 9,
    height: 9,
    borderRadius: 5,
    marginLeft: 8,
    backgroundColor: colors.primary,
  },
  cardMessage: {
    marginTop: 4,
    fontSize: 12.5,
    lineHeight: 18,
    color: MUTED,
  },
  cardFooter: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 8,
  },
  timeText: {
    marginLeft: 4,
    fontSize: 11.5,
    fontWeight: '500',
    color: MUTED,
  },

  /* Empty state */
  emptyContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 32,
    paddingVertical: 64,
  },
  emptyIconCircle: {
    width: 68,
    height: 68,
    borderRadius: 34,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: SOFT_ORANGE,
    marginBottom: 16,
  },
  emptyTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: colors.dark,
    marginBottom: 6,
  },
  emptyText: {
    fontSize: 13,
    lineHeight: 19,
    textAlign: 'center',
    color: MUTED,
  },

  /* Footer */
  footer: {
    paddingHorizontal: 16,
    paddingTop: 12,
    backgroundColor: '#FFFFFF',
    borderTopWidth: 1,
    borderTopColor: colors.border,
  },
  doneButton: {
    height: 52,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.primary,
    shadowColor: colors.primary,
    shadowOpacity: 0.3,
    shadowRadius: 12,
    shadowOffset: { width: 0, height: 6 },
    elevation: 4,
  },
  doneText: {
    fontSize: 15.5,
    fontWeight: '700',
    letterSpacing: 0.2,
    color: '#FFFFFF',
  },
});