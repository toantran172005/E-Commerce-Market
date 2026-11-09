import React, { useCallback, useMemo, useState } from 'react';
import {
  FlatList,
  ListRenderItem,
  Modal,
  Pressable,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { ScreenHeader, PrimaryButton, LoadingView, EmptyState } from '../src/components';
import { useNotifications } from '../src/context/NotificationsContext';
import { colors, radius, spacing } from '../src/constants/theme';
import { AppNotification, NotificationType, IoniconName } from '../src/types';
import { formatDate } from '../src/utils/format';

/* -------------------------------------------------------------------------- */
/*                              Local UI helpers                              */
/* -------------------------------------------------------------------------- */

/** Đổi createdAt ISO thành chuỗi thời gian tương đối tiếng Việt. */
function formatRelativeTime(value: string | number): string {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return '';

  const diffMinutes = Math.round((Date.now() - date.getTime()) / 60000);
  if (diffMinutes < 1) return 'Vừa xong';
  if (diffMinutes < 60) return `${diffMinutes} phút trước`;

  const diffHours = Math.floor(diffMinutes / 60);
  if (diffHours < 24) return `${diffHours} giờ trước`;

  const diffDays = Math.floor(diffHours / 24);
  if (diffDays < 7) return `${diffDays} ngày trước`;

  return formatDate(value);
}

/** Cấu hình icon + màu theo từng loại thông báo. */
const NOTIFICATION_META: Record<NotificationType, { icon: IoniconName; color: string; bg: string }> = {
  order: { icon: 'cube-outline', color: colors.primary, bg: colors.primarySoft },
  promo: { icon: 'pricetag-outline', color: colors.success, bg: colors.successSoft },
  system: { icon: 'shield-checkmark-outline', color: colors.info, bg: colors.infoSoft },
  review: { icon: 'star-outline', color: colors.warning, bg: colors.warningSoft },
};

const DEFAULT_META: { icon: IoniconName; color: string; bg: string } = {
  icon: 'notifications-outline',
  color: colors.primary,
  bg: colors.primarySoft,
};

function getNotificationMeta(type?: string): { icon: IoniconName; color: string; bg: string } {
  if (type && type in NOTIFICATION_META) {
    return NOTIFICATION_META[type as NotificationType];
  }
  return DEFAULT_META;
}

/* -------------------------------------------------------------------------- */
/*                                   Screen                                   */
/* -------------------------------------------------------------------------- */

export default function NotificationScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const {
    notifications,
    unreadCount,
    loading,
    markAsRead,
    markAllAsRead,
    loadNotifications,
  } = useNotifications();

  const [refreshing, setRefreshing] = useState(false);
  const [selectedNotification, setSelectedNotification] = useState<AppNotification | null>(null);

  const handleGoBack = useCallback(() => {
    if (router.canGoBack()) {
      router.back();
    } else {
      router.replace('/(tabs)/home');
    }
  }, [router]);

  const handleMarkAllAsRead = useCallback(() => {
    if (unreadCount === 0) return;
    markAllAsRead().catch(() => undefined);
  }, [unreadCount, markAllAsRead]);

  const handlePressNotification = useCallback(
    (item: AppNotification) => {
      // Đánh dấu đã đọc, sau đó mở modal chi tiết.
      if (!item.read) {
        markAsRead(item.id).catch(() => undefined);
      }
      setSelectedNotification(item);
    },
    [markAsRead],
  );

  const handleRefresh = useCallback(async () => {
    setRefreshing(true);
    try {
      await loadNotifications();
    } finally {
      setRefreshing(false);
    }
  }, [loadNotifications]);

  const renderItem: ListRenderItem<AppNotification> = useCallback(
    ({ item }) => {
      const meta = getNotificationMeta(item?.type);

      return (
        <Pressable
          onPress={() => handlePressNotification(item)}
          style={({ pressed }) => [
            styles.card,
            item.read ? styles.cardRead : styles.cardUnread,
            pressed && styles.pressed,
          ]}
          accessibilityRole="button"
          accessibilityLabel={`${item.title}, ${item.read ? 'đã đọc' : 'chưa đọc'}`}
        >
          <View style={[styles.iconCircle, { backgroundColor: meta.bg }]}>
            <Ionicons name={meta.icon} size={21} color={meta.color} />
          </View>

          <View style={styles.cardContent}>
            <View style={styles.cardTopRow}>
              <Text
                numberOfLines={1}
                style={[styles.cardTitle, item.read && styles.cardTitleRead]}
              >
                {item.title}
              </Text>
              {!item.read ? <View style={styles.unreadDot} /> : null}
            </View>

            <Text numberOfLines={2} style={styles.cardMessage}>
              {item.message}
            </Text>

            <View style={styles.cardFooter}>
              <Ionicons name="time-outline" size={12} color={colors.textMuted} />
              <Text style={styles.timeText}>{formatRelativeTime(item.createdAt)}</Text>
            </View>
          </View>
        </Pressable>
      );
    },
    [handlePressNotification],
  );

  const markAllButton = (
    <Pressable
      onPress={handleMarkAllAsRead}
      disabled={unreadCount === 0}
      style={({ pressed }) => [
        styles.markAllButton,
        pressed && styles.pressed,
      ]}
      hitSlop={8}
      accessibilityRole="button"
      accessibilityLabel="Đánh dấu tất cả đã đọc"
      accessibilityState={{ disabled: unreadCount === 0 }}
    >
      <Text
        style={[
          styles.markAllText,
          unreadCount === 0 && styles.markAllTextDisabled,
        ]}
      >
        Đánh dấu đã đọc
      </Text>
    </Pressable>
  );

  return (
    <SafeAreaView style={styles.safe} edges={['top', 'left', 'right']}>
      <ScreenHeader title="Thông báo" onBack={handleGoBack} right={markAllButton} />

      {/* Nội dung chính: loading -> list -> empty */}
      {loading ? (
        <LoadingView label="Đang tải thông báo..." />
      ) : notifications.length === 0 ? (
        <EmptyState
          icon="notifications-off-outline"
          title="Chưa có thông báo"
          subtitle="Khi có sự kiện mới, thông báo sẽ hiển thị tại đây."
          actionLabel="Khám phá sản phẩm"
          onAction={() => router.push('/(tabs)/home')}
        />
      ) : (
        <FlatList
          data={notifications}
          keyExtractor={(item) => item.id}
          renderItem={renderItem}
          showsVerticalScrollIndicator={false}
          contentContainerStyle={styles.listContent}
          refreshing={refreshing}
          onRefresh={handleRefresh}
        />
      )}

      {/* Modal chi tiết thông báo */}
      <Modal
        visible={selectedNotification !== null}
        transparent
        animationType="fade"
        onRequestClose={() => setSelectedNotification(null)}
      >
        <View style={styles.modalRoot}>
          <Pressable style={StyleSheet.absoluteFill} onPress={() => setSelectedNotification(null)} />
          <View style={styles.modalCard}>
            {selectedNotification && (() => {
              const meta = getNotificationMeta(selectedNotification.type);
              return (
                <>
                  <View
                    style={[
                      styles.modalIcon,
                      { backgroundColor: meta.bg },
                    ]}
                  >
                    <Ionicons
                      name={meta.icon}
                      size={32}
                      color={meta.color}
                    />
                  </View>
                  <Text style={styles.modalTitle}>{selectedNotification.title}</Text>
                  <Text style={styles.modalTime}>{formatDate(selectedNotification.createdAt)}</Text>
                  <Text style={styles.modalMessage}>{selectedNotification.message}</Text>
                  <PrimaryButton
                    title="Đã hiểu"
                    onPress={() => setSelectedNotification(null)}
                  />
                </>
              );
            })()}
          </View>
        </View>
      </Modal>
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

  /* Nút "Đánh dấu đã đọc" trên header */
  markAllButton: {
    minHeight: 44,
    paddingHorizontal: 4,
    justifyContent: 'center',
    alignItems: 'flex-end',
  },
  markAllText: {
    fontSize: 13,
    fontWeight: '700',
    color: colors.primary,
  },
  markAllTextDisabled: {
    color: colors.textMuted,
  },

  /* Danh sách thông báo */
  listContent: {
    paddingHorizontal: spacing.lg,
    paddingTop: spacing.sm,
    paddingBottom: spacing.xl,
    flexGrow: 1,
  },
  card: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    borderRadius: radius.lg,
    borderWidth: 1,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.md,
    marginBottom: spacing.md,
  },
  cardUnread: {
    backgroundColor: '#FFFFFF',
    borderColor: '#E2E8F0',
    shadowColor: colors.dark,
    shadowOpacity: 0.06,
    shadowRadius: 12,
    shadowOffset: { width: 0, height: 6 },
    elevation: 2,
  },
  cardRead: {
    backgroundColor: '#F3F4F6',
    borderColor: '#E5E7EB',
    opacity: 0.96,
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
    marginLeft: spacing.md,
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
    color: colors.textSecondary,
  },
  unreadDot: {
    width: 9,
    height: 9,
    borderRadius: 5,
    marginLeft: spacing.sm,
    backgroundColor: colors.primary,
  },
  cardMessage: {
    marginTop: spacing.xs,
    fontSize: 12.5,
    lineHeight: 18,
    color: colors.textMuted,
  },
  cardFooter: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: spacing.sm,
  },
  timeText: {
    marginLeft: spacing.xs,
    fontSize: 11.5,
    fontWeight: '500',
    color: colors.textMuted,
  },

  /* Modal chi tiết */
  modalRoot: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: colors.overlay,
    padding: spacing.xl,
  },
  modalCard: {
    width: '100%',
    maxWidth: 400,
    backgroundColor: colors.card,
    borderRadius: radius.xl,
    padding: spacing.xl,
    alignItems: 'center',
  },
  modalIcon: {
    width: 64,
    height: 64,
    borderRadius: 32,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: spacing.md,
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: '800',
    color: colors.dark,
    textAlign: 'center',
    marginBottom: spacing.xs,
  },
  modalTime: {
    fontSize: 13,
    color: colors.textMuted,
    marginBottom: spacing.md,
  },
  modalMessage: {
    fontSize: 14.5,
    lineHeight: 21,
    color: colors.textSecondary,
    textAlign: 'center',
    marginBottom: spacing.xl,
  },

  pressed: {
    opacity: 0.8,
  },
});
