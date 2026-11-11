import React, { useCallback, useMemo } from 'react';
import {
  Alert,
  FlatList,
  Image,
  Pressable,
  StyleSheet,
  Text,
  View,
  useWindowDimensions,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { Product } from '../../src/types';
import { colors, radius, spacing } from '../../src/constants/theme';
import { useAuth } from '../../src/context/AuthContext';
import { useFavourites } from '../../src/context/FavouritesContext';
import { useCart } from '../../src/context/CartContext';
import { EmptyState } from '../../src/components/EmptyState';
import { RatingStars } from '../../src/components/RatingStars';
import { formatMoney, calcDiscountPercent } from '../../src/utils/format';

const HORIZONTAL_PADDING = spacing.lg; // 16
const GRID_GAP = spacing.md; // 12

export default function FavouriteScreen() {
  const router = useRouter();
  const { user } = useAuth();
  const { favourites, toggleFavourite } = useFavourites();
  const { addItem, totalItems } = useCart();
  const { width: screenWidth } = useWindowDimensions();

  const cardWidth = useMemo(
    () => (screenWidth - HORIZONTAL_PADDING * 2 - GRID_GAP) / 2,
    [screenWidth],
  );

  const handleProductPress = useCallback(
    (id: string) => {
      router.push({ pathname: '/product/[id]', params: { id } });
    },
    [router],
  );

  const handleAddToCart = useCallback(
    (product: Product) => {
      if (user?.isGuest || !user) {
        Alert.alert(
          'Yêu cầu đăng nhập',
          'Vui lòng đăng nhập để thêm sản phẩm vào giỏ hàng.',
          [
            { text: 'Huỷ', style: 'cancel' },
            { text: 'Đăng nhập', onPress: () => router.push('/(auth)/login') },
          ],
        );
        return;
      }
      addItem(product, 1);
    },
    [addItem, user, router],
  );

  const handleRemoveFavourite = useCallback(
    (product: Product) => {
      toggleFavourite(product);
    },
    [toggleFavourite],
  );

  const goToHome = useCallback(() => {
    router.push('/(tabs)/home');
  }, [router]);

  const goToCart = useCallback(() => {
    router.push('/cart');
  }, [router]);

  const countLabel = `${favourites.length} sản phẩm đã lưu`;
  const badgeCount = totalItems > 9 ? '9+' : totalItems.toString();

  const renderItem = useCallback(
    ({ item }: { item: Product }) => {
      const discountPercent = calcDiscountPercent(item.price, item.originalPrice);
      const hasDiscount = discountPercent != null && discountPercent > 0;

      return (
        <View
          style={[
            styles.card,
            { width: cardWidth, maxWidth: cardWidth },
          ]}
        >
          <Pressable
            onPress={() => handleProductPress(item.id)}
            style={({ pressed }) => [pressed && styles.pressed]}
            accessibilityRole="button"
            accessibilityLabel={`Xem chi tiết ${item.name}`}
          >
            <View style={styles.imageWrapper}>
              <Image source={{ uri: item.imageUrl }} style={styles.image} resizeMode="contain" />

              {hasDiscount && (
                <View style={styles.saleBadge}>
                  <Text style={styles.saleBadgeText}>-{discountPercent}%</Text>
                </View>
              )}
            </View>

            {item.brandName ? (
              <Text style={styles.brandText}>{item.brandName.toUpperCase()}</Text>
            ) : null}

            <Text style={styles.nameText} numberOfLines={2}>
              {item.name}
            </Text>

            <View style={styles.ratingRow}>
              <RatingStars rating={item.rating ?? 0} size={11} />
              <Text style={styles.reviewsText}>({item.reviewCount ?? 0})</Text>
            </View>
          </Pressable>

          <View style={styles.bottomRow}>
            <Pressable
              onPress={() => handleProductPress(item.id)}
              style={styles.priceColumn}
            >
              <Text style={styles.priceText} numberOfLines={1}>{formatMoney(item.price)}</Text>
              {item.originalPrice && item.originalPrice > item.price ? (
                <Text style={styles.oldPriceText} numberOfLines={1}>{formatMoney(item.originalPrice)}</Text>
              ) : null}
            </Pressable>

            <Pressable
              onPress={() => handleAddToCart(item)}
              hitSlop={6}
              style={styles.addButton}
              accessibilityRole="button"
              accessibilityLabel={`Thêm ${item.name} vào giỏ hàng`}
            >
              <Ionicons name="add" size={20} color={colors.white} />
            </Pressable>
          </View>

          <Pressable
            onPress={() => handleRemoveFavourite(item)}
            hitSlop={8}
            style={styles.heartButton}
            accessibilityRole="button"
            accessibilityLabel={`Bỏ yêu thích ${item.name}`}
          >
            <Ionicons name="heart" size={16} color={colors.primary} />
          </Pressable>
        </View>
      );
    },
    [handleProductPress, handleAddToCart, handleRemoveFavourite, cardWidth],
  );

  if (user?.isGuest || !user) {
    return (
      <SafeAreaView style={styles.safeArea} edges={['top', 'left', 'right']}>
        <View style={styles.header}>
          <View style={styles.headerTextBlock}>
            <Text style={styles.headerTitle}>Yêu thích</Text>
            <Text style={styles.headerSubtitle}>0 sản phẩm đã lưu</Text>
          </View>
        </View>
        <EmptyState
          icon="heart-outline"
          title="Yêu cầu đăng nhập"
          subtitle="Bạn đang duyệt với tư cách Khách. Vui lòng đăng nhập để xem và lưu sản phẩm yêu thích."
          actionLabel="Đăng nhập ngay"
          onAction={() => router.push('/(auth)/login')}
        />
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.safeArea} edges={['top', 'left', 'right']}>
      <View style={styles.header}>
        <View style={styles.headerTextBlock}>
          <Text style={styles.headerTitle}>Yêu thích</Text>
          <Text style={styles.headerSubtitle}>{countLabel}</Text>
        </View>

        <Pressable
          style={styles.cartButton}
          onPress={goToCart}
          accessibilityRole="button"
          accessibilityLabel="Mở giỏ hàng"
        >
          <Ionicons name="cart-outline" size={20} color={colors.white} />
          {totalItems > 0 && (
            <View style={styles.cartBadge}>
              <Text style={styles.cartBadgeText}>{badgeCount}</Text>
            </View>
          )}
        </Pressable>
      </View>

      <FlatList
        data={favourites}
        keyExtractor={(item) => item.id}
        renderItem={renderItem}
        numColumns={2}
        showsVerticalScrollIndicator={false}
        columnWrapperStyle={styles.columnWrapper}
        contentContainerStyle={[
          styles.listContent,
          favourites.length === 0 && styles.emptyListContent,
        ]}
        ListEmptyComponent={
          <EmptyState
            icon="heart-outline"
            title="Chưa có sản phẩm yêu thích"
            subtitle="Bấm vào biểu tượng trái tim ở bất kỳ sản phẩm nào để lưu lại tại đây."
            actionLabel="Khám phá sản phẩm"
            onAction={goToHome}
          />
        }
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: colors.background,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: HORIZONTAL_PADDING,
    paddingTop: spacing.sm,
    paddingBottom: spacing.md,
  },
  headerTextBlock: {
    flex: 1,
  },
  headerTitle: {
    fontSize: 28,
    fontWeight: '800',
    color: colors.dark,
    letterSpacing: -0.4,
  },
  headerSubtitle: {
    marginTop: 2,
    fontSize: 13,
    fontWeight: '500',
    color: colors.placeholder,
  },
  cartButton: {
    width: 44,
    height: 44,
    borderRadius: radius.pill,
    backgroundColor: colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: colors.primary,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.28,
    shadowRadius: 8,
    elevation: 4,
  },
  cartBadge: {
    position: 'absolute',
    top: -2,
    right: -2,
    minWidth: 18,
    height: 18,
    borderRadius: 9,
    paddingHorizontal: 4,
    backgroundColor: colors.dark,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1.5,
    borderColor: colors.background,
  },
  cartBadgeText: {
    fontSize: 10,
    fontWeight: '700',
    color: colors.white,
  },
  listContent: {
    paddingHorizontal: HORIZONTAL_PADDING,
    paddingBottom: spacing.xxl,
  },
  emptyListContent: {
    flexGrow: 1,
    justifyContent: 'center',
  },
  columnWrapper: {
    gap: GRID_GAP,
    marginBottom: spacing.md,
    justifyContent: 'flex-start',
  },
  card: {
    backgroundColor: colors.card,
    borderRadius: radius.lg,
    borderWidth: 1,
    borderColor: colors.border,
    padding: spacing.sm,
    shadowColor: colors.dark,
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.05,
    shadowRadius: 10,
    elevation: 2,
  },
  pressed: {
    opacity: 0.9,
  },
  imageWrapper: {
    height: 116,
    borderRadius: radius.md,
    backgroundColor: colors.background,
    alignItems: 'center',
    justifyContent: 'center',
    overflow: 'hidden',
  },
  image: {
    width: '86%',
    height: '86%',
  },
  saleBadge: {
    position: 'absolute',
    top: spacing.sm,
    left: spacing.sm,
    backgroundColor: colors.primary,
    borderRadius: radius.sm,
    paddingHorizontal: 7,
    paddingVertical: 3,
  },
  saleBadgeText: {
    fontSize: 10,
    fontWeight: '700',
    color: colors.white,
  },
  heartButton: {
    position: 'absolute',
    top: 6,
    right: 6,
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: colors.card,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  brandText: {
    marginTop: spacing.sm,
    fontSize: 11,
    fontWeight: '600',
    color: colors.placeholder,
    textTransform: 'uppercase',
    letterSpacing: 0.4,
  },
  nameText: {
    marginTop: 2,
    fontSize: 13,
    fontWeight: '700',
    color: colors.dark,
    lineHeight: 18,
    minHeight: 36,
  },
  ratingRow: {
    marginTop: 4,
    flexDirection: 'row',
    alignItems: 'center',
  },
  reviewsText: {
    marginLeft: 4,
    fontSize: 10,
    color: colors.placeholder,
    fontWeight: '500',
  },
  bottomRow: {
    marginTop: spacing.sm,
    flexDirection: 'row',
    alignItems: 'flex-end',
    justifyContent: 'space-between',
  },
  priceColumn: {
    flexDirection: 'column',
    alignItems: 'flex-start',
    justifyContent: 'center',
    flex: 1,
    minWidth: 0,
    minHeight: 36,
  },
  priceText: {
    fontSize: 14.5,
    fontWeight: '800',
    color: colors.dark,
  },
  oldPriceText: {
    marginTop: 2,
    fontSize: 11,
    fontWeight: '500',
    color: colors.grayLight,
    textDecorationLine: 'line-through',
  },
  addButton: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: colors.primary,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 4,
    elevation: 3,
  },
});
