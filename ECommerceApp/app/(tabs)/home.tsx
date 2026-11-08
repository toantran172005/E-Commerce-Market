import React, { useCallback, useEffect, useMemo, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TextInput,
  Pressable,
  FlatList,
  Image,
  Dimensions,
  ScrollView,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { colors, radius, spacing } from '../../src/constants/theme';
import { CatalogService } from '../../src/services/catalog.service';
import { useProductSearch } from '../../src/hooks/useProductSearch';
import { useProductFilter } from '../../src/context/ProductFilterContext';
import { useCart } from '../../src/context/CartContext';
import { useFavourites } from '../../src/context/FavouritesContext';
import { useNotifications } from '../../src/context/NotificationsContext';
import { useAuth } from '../../src/context/AuthContext';
import { Category, Product } from '../../src/types';
import { formatMoney, calcDiscountPercent } from '../../src/utils/format';
import { RatingStars } from '../../src/components/RatingStars';
import { LoadingView } from '../../src/components/LoadingView';
import { ErrorView } from '../../src/components/ErrorView';
import { EmptyState } from '../../src/components/EmptyState';

const { width } = Dimensions.get('window');
const H_PADDING = spacing.xl; // 20
const CARD_GAP = spacing.md;   // 12
const CARD_WIDTH = (width - H_PADDING * 2 - CARD_GAP) / 2;

interface HomeProductCardProps {
  product: Product;
  width?: number;
  isFavourite: boolean;
  onToggleFavourite: () => void;
  onPress: () => void;
}

function HomeProductCard({
  product,
  width,
  isFavourite,
  onToggleFavourite,
  onPress,
}: HomeProductCardProps) {
  const discountPercent = calcDiscountPercent(product.price, product.originalPrice);

  return (
    <View style={[styles.card, width ? { width } : null]}>
      <Pressable
        onPress={onPress}
        style={({ pressed }) => [pressed && styles.pressedCard]}
        accessibilityRole="button"
        accessibilityLabel={`${product.name}, giá ${formatMoney(product.price)}`}
      >
        <View style={styles.cardImageWrap}>
          <Image source={{ uri: product.imageUrl }} style={styles.cardImage} resizeMode="contain" />

          {discountPercent != null ? (
            <View style={styles.discountBadge}>
              <Text style={styles.discountText}>-{discountPercent}%</Text>
            </View>
          ) : product.badge === 'new' ? (
            <View style={[styles.discountBadge, styles.newBadge]}>
              <Text style={styles.discountText}>NEW</Text>
            </View>
          ) : null}
        </View>

        <Text style={styles.cardName} numberOfLines={2}>{product.name}</Text>

        <View style={styles.ratingRow}>
          <RatingStars rating={product.rating ?? 0} size={11} />
          <Text style={styles.reviewCount}>({product.reviewCount ?? 0})</Text>
        </View>

        <View style={styles.priceRow}>
          <Text style={styles.price}>{formatMoney(product.price)}</Text>
          {product.originalPrice && product.originalPrice > product.price ? (
            <Text style={styles.oldPrice}>{formatMoney(product.originalPrice)}</Text>
          ) : null}
        </View>
      </Pressable>

      <Pressable
        onPress={onToggleFavourite}
        hitSlop={8}
        style={styles.heartButton}
        accessibilityRole="button"
        accessibilityLabel={isFavourite ? 'Bỏ yêu thích' : 'Thêm yêu thích'}
      >
        <Ionicons
          name={isFavourite ? 'heart' : 'heart-outline'}
          size={16}
          color={isFavourite ? colors.primary : colors.gray}
        />
      </Pressable>
    </View>
  );
}

interface HomeProductListRowProps {
  product: Product;
  isFavourite: boolean;
  onToggleFavourite: () => void;
  onPress: () => void;
}

function HomeProductListRow({
  product,
  isFavourite,
  onToggleFavourite,
  onPress,
}: HomeProductListRowProps) {
  const discountPercent = calcDiscountPercent(product.price, product.originalPrice);

  return (
    <View style={styles.listCard}>
      <Pressable
        onPress={onPress}
        style={({ pressed }) => [styles.listCardContent, pressed && styles.pressedCard]}
        accessibilityRole="button"
        accessibilityLabel={`${product.name}, giá ${formatMoney(product.price)}`}
      >
        <View style={styles.listImageWrap}>
          <Image source={{ uri: product.imageUrl }} style={styles.listImage} resizeMode="contain" />

          {discountPercent != null ? (
            <View style={styles.discountBadge}>
              <Text style={styles.discountText}>-{discountPercent}%</Text>
            </View>
          ) : product.badge === 'new' ? (
            <View style={[styles.discountBadge, styles.newBadge]}>
              <Text style={styles.discountText}>NEW</Text>
            </View>
          ) : null}
        </View>

        <View style={styles.listInfo}>
          <Text style={styles.cardName} numberOfLines={2}>{product.name}</Text>

          <View style={styles.ratingRow}>
            <RatingStars rating={product.rating ?? 0} size={11} />
            <Text style={styles.reviewCount}>({product.reviewCount ?? 0})</Text>
          </View>

          <View style={styles.priceRow}>
            <Text style={styles.price}>{formatMoney(product.price)}</Text>
            {product.originalPrice && product.originalPrice > product.price ? (
              <Text style={styles.oldPrice}>{formatMoney(product.originalPrice)}</Text>
            ) : null}
          </View>
        </View>
      </Pressable>

      <Pressable
        onPress={onToggleFavourite}
        hitSlop={8}
        style={styles.listHeartButton}
        accessibilityRole="button"
        accessibilityLabel={isFavourite ? 'Bỏ yêu thích' : 'Thêm yêu thích'}
      >
        <Ionicons
          name={isFavourite ? 'heart' : 'heart-outline'}
          size={18}
          color={isFavourite ? colors.primary : colors.gray}
        />
      </Pressable>
    </View>
  );
}

export default function HomeScreen() {
  const router = useRouter();
  const { user } = useAuth();
  const cart = useCart();
  const notifications = useNotifications();
  const { favourites, isFavourite, toggleFavourite } = useFavourites();
  const { filters, setQuery, setCategoryIds, resetFilters } = useProductFilter();
  const { products, loading, error, refresh } = useProductSearch();

  const [isGrid, setIsGrid] = useState(true);

  const [homeCategories, setHomeCategories] = useState<Category[]>([]);

  useEffect(() => {
    let isMounted = true;
    CatalogService.getCategories().then((cats) => {
      if (isMounted) setHomeCategories(cats.slice(0, 7));
    }).catch(() => {});
    return () => { isMounted = false; };
  }, []);

  const greeting = useMemo(() => {
    const hour = new Date().getHours();
    if (hour < 12) return 'Chào buổi sáng';
    if (hour < 18) return 'Chào buổi chiều';
    return 'Chào buổi tối';
  }, []);

  const displayName = useMemo(() => {
    if (!user) return 'Khách';
    if (user.isGuest) return 'Khách';
    return user.fullName?.split(' ').pop() ?? 'Bạn';
  }, [user]);

  const goToProduct = useCallback(
    (id: string) => {
      router.push({ pathname: '/product/[id]', params: { id } });
    },
    [router],
  );

  const handleToggleFavourite = useCallback(
    (product: Product) => {
      toggleFavourite(product);
    },
    [toggleFavourite],
  );

  const handleSelectCategory = useCallback(
    (categoryId: string) => {
      const active = filters.categoryIds.includes(categoryId);
      setCategoryIds(active ? [] : [categoryId]);
    },
    [filters.categoryIds, setCategoryIds],
  );

  const handleSearchChange = useCallback(
    (text: string) => {
      setQuery(text);
    },
    [setQuery],
  );

  const handleRetry = useCallback(() => {
    void refresh();
  }, [refresh]);

  const renderProduct = useCallback(
    ({ item }: { item: Product }) => {
      const favourite = isFavourite(item.id);
      const onPress = () => goToProduct(item.id);
      const onToggle = () => handleToggleFavourite(item);

      if (isGrid) {
        return (
          <HomeProductCard
            product={item}
            width={CARD_WIDTH}
            isFavourite={favourite}
            onToggleFavourite={onToggle}
            onPress={onPress}
          />
        );
      }

      return (
        <HomeProductListRow
          product={item}
          isFavourite={favourite}
          onToggleFavourite={onToggle}
          onPress={onPress}
        />
      );
    },
    [isGrid, isFavourite, handleToggleFavourite, goToProduct],
  );

  const listEmptyComponent = useMemo(() => {
    if (loading) {
      return <LoadingView label="Đang tải sản phẩm..." />;
    }
    if (error) {
      return <ErrorView message={error.message} onRetry={handleRetry} />;
    }
    return (
      <EmptyState
        icon="search-outline"
        title="Không tìm thấy sản phẩm"
        subtitle="Thử thay đổi từ khoá hoặc bộ lọc."
        actionLabel="Xoá bộ lọc"
        onAction={resetFilters}
      />
    );
  }, [loading, error, handleRetry, resetFilters]);

  const header = (
    <View>
      {/* Header */}
      <View style={styles.headerRow}>
        <View>
          <Text style={styles.greeting}>{greeting}</Text>
          <Text style={styles.title}>{displayName}</Text>
        </View>
        <View style={styles.headerActions}>
          <Pressable
            onPress={() => router.push('/notification')}
            style={({ pressed }) => [styles.bellButton, pressed && styles.pressedIcon]}
            accessibilityRole="button"
            accessibilityLabel="Thông báo"
          >
            <Ionicons name="notifications-outline" size={22} color={colors.dark} />
            {notifications.unreadCount > 0 ? <View style={styles.badgeDot} /> : null}
          </Pressable>
          <Pressable
            onPress={() => router.push('/cart')}
            style={({ pressed }) => [styles.cartButton, pressed && styles.pressedIcon]}
            accessibilityRole="button"
            accessibilityLabel="Giỏ hàng"
          >
            <Ionicons name="cart-outline" size={20} color={colors.white} />
            {cart.totalItems > 0 ? (
              <View style={styles.cartBadge}>
                <Text style={styles.cartBadgeText}>
                  {cart.totalItems > 99 ? '99+' : cart.totalItems}
                </Text>
              </View>
            ) : null}
          </Pressable>
        </View>
      </View>

      {/* Search + Filter */}
      <View style={styles.searchRow}>
        <View style={styles.searchBox}>
          <Ionicons name="search-outline" size={20} color={colors.placeholder} />
          <TextInput
            style={styles.searchInput}
            placeholder="Tìm kiếm tai nghe, điện thoại, laptop..."
            placeholderTextColor={colors.placeholder}
            returnKeyType="search"
            value={filters.query}
            onChangeText={handleSearchChange}
            accessibilityLabel="Tìm kiếm sản phẩm"
          />
        </View>
        <Pressable
          onPress={() => router.push('/filter')}
          style={({ pressed }) => [styles.filterButton, pressed && styles.pressedIcon]}
          accessibilityRole="button"
          accessibilityLabel="Bộ lọc sản phẩm"
        >
          <Ionicons name="options-outline" size={22} color={colors.white} />
        </Pressable>
      </View>

      {/* Categories */}
      <View style={styles.sectionHeader}>
        <Text style={styles.sectionTitle}>Danh mục sản phẩm</Text>
      </View>
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.categoriesScroll}
      >
        {homeCategories.map((cat) => {
          const active = filters.categoryIds.includes(cat.id);
          return (
            <Pressable
              key={cat.id}
              onPress={() => handleSelectCategory(cat.id)}
              style={styles.categoryItem}
              accessibilityRole="button"
              accessibilityLabel={cat.name}
              accessibilityState={{ selected: active }}
            >
              <View style={[styles.categoryIconBox, active && styles.categoryIconBoxActive]}>
                <Ionicons
                  name={cat.icon}
                  size={24}
                  color={active ? colors.white : colors.primary}
                />
              </View>
              <Text
                style={[styles.categoryLabel, active && styles.categoryLabelActive]}
                numberOfLines={1}
              >
                {cat.name}
              </Text>
            </Pressable>
          );
        })}
      </ScrollView>

      {/* Products header */}
      <View style={styles.productsHeader}>
        <Text style={styles.sectionTitle}>Sản phẩm</Text>
        <View style={styles.productsHeaderRight}>
          <Pressable
            onPress={() => setIsGrid((prev) => !prev)}
            style={({ pressed }) => [styles.viewToggle, pressed && styles.pressedIcon]}
            hitSlop={6}
            accessibilityRole="button"
            accessibilityLabel={isGrid ? 'Chuyển sang chế độ danh sách' : 'Chuyển sang chế độ lưới'}
          >
            <Ionicons
              name={isGrid ? 'list-outline' : 'grid-outline'}
              size={18}
              color={colors.dark}
            />
          </Pressable>
        </View>
      </View>
    </View>
  );

  return (
    <SafeAreaView style={styles.safeArea} edges={['top']}>
      <FlatList
        key={isGrid ? 'grid' : 'list'}
        data={products}
        keyExtractor={(item) => item.id}
        renderItem={renderProduct}
        ListHeaderComponent={header}
        ListEmptyComponent={listEmptyComponent}
        numColumns={isGrid ? 2 : 1}
        columnWrapperStyle={isGrid ? styles.gridRow : undefined}
        contentContainerStyle={styles.listContent}
        showsVerticalScrollIndicator={false}
        extraData={[favourites, isGrid, cart.totalItems, notifications.unreadCount]}
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: colors.background,
  },
  listContent: {
    paddingHorizontal: H_PADDING,
    paddingTop: spacing.xs,
    paddingBottom: 120,
  },
  headerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: spacing.lg,
  },
  greeting: {
    fontSize: 13,
    color: colors.textMuted,
    fontWeight: '500',
    marginBottom: spacing.xs,
  },
  title: {
    fontSize: 26,
    fontWeight: '800',
    color: colors.dark,
    letterSpacing: -0.5,
  },
  headerActions: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  bellButton: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: colors.card,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: colors.border,
    shadowColor: '#000',
    shadowOpacity: 0.05,
    shadowRadius: 8,
    shadowOffset: { width: 0, height: 3 },
    elevation: 2,
  },
  badgeDot: {
    position: 'absolute',
    top: 10,
    right: 11,
    width: 10,
    height: 10,
    borderRadius: 5,
    backgroundColor: colors.danger,
    borderWidth: 2,
    borderColor: colors.card,
  },
  cartButton: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
    marginLeft: spacing.sm,
    shadowColor: colors.primary,
    shadowOpacity: 0.35,
    shadowRadius: 10,
    shadowOffset: { width: 0, height: 5 },
    elevation: 5,
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
  searchRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: spacing.xl,
  },
  searchBox: {
    flex: 1,
    height: 52,
    backgroundColor: colors.card,
    borderRadius: radius.lg,
    borderWidth: 1,
    borderColor: colors.border,
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: spacing.md,
  },
  searchInput: {
    flex: 1,
    marginLeft: spacing.sm,
    fontSize: 14,
    color: colors.dark,
    paddingVertical: 0,
  },
  filterButton: {
    width: 52,
    height: 52,
    borderRadius: radius.lg,
    backgroundColor: colors.dark,
    alignItems: 'center',
    justifyContent: 'center',
    marginLeft: spacing.md,
  },
  sectionHeader: {
    marginBottom: spacing.md,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '800',
    color: colors.dark,
    letterSpacing: -0.3,
  },
  sectionMeta: {
    fontSize: 13,
    fontWeight: '500',
    color: colors.textMuted,
  },
  categoriesScroll: {
    paddingBottom: spacing.lg,
    paddingRight: spacing.md,
    gap: spacing.md,
  },
  categoryItem: {
    alignItems: 'center',
    width: 74,
  },
  categoryIconBox: {
    width: 60,
    height: 60,
    borderRadius: 20,
    backgroundColor: colors.card,
    borderWidth: 1,
    borderColor: colors.border,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: spacing.xs,
  },
  categoryIconBoxActive: {
    backgroundColor: colors.primary,
    borderColor: colors.primary,
  },
  categoryLabel: {
    fontSize: 12,
    fontWeight: '600',
    color: colors.dark,
  },
  categoryLabelActive: {
    color: colors.primary,
  },
  productsHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: spacing.md,
  },
  productsHeaderRight: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
  },
  viewToggle: {
    width: 40,
    height: 40,
    borderRadius: radius.md,
    backgroundColor: colors.card,
    borderWidth: 1,
    borderColor: colors.border,
    alignItems: 'center',
    justifyContent: 'center',
  },
  gridRow: {
    justifyContent: 'space-between',
  },
  card: {
    backgroundColor: colors.card,
    borderRadius: radius.xl,
    borderWidth: 1,
    borderColor: colors.border,
    padding: spacing.sm,
    marginBottom: CARD_GAP,
  },
  pressedCard: {
    opacity: 0.9,
  },
  cardImageWrap: {
    height: 124,
    borderRadius: radius.lg,
    backgroundColor: colors.background,
    overflow: 'hidden',
    marginBottom: spacing.sm,
  },
  cardImage: {
    width: '100%',
    height: '100%',
  },
  discountBadge: {
    position: 'absolute',
    top: 8,
    left: 8,
    backgroundColor: colors.primary,
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: radius.sm,
  },
  newBadge: {
    backgroundColor: colors.info,
  },
  discountText: {
    color: colors.white,
    fontSize: 10,
    fontWeight: '800',
  },
  heartButton: {
    position: 'absolute',
    top: 8,
    right: 8,
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: colors.card,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000',
    shadowOpacity: 0.08,
    shadowRadius: 4,
    shadowOffset: { width: 0, height: 2 },
    elevation: 2,
  },
  cardName: {
    fontSize: 14,
    fontWeight: '700',
    color: colors.dark,
    marginBottom: spacing.xs,
    minHeight: 36,
  },
  ratingRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: spacing.sm,
  },
  reviewCount: {
    marginLeft: 4,
    fontSize: 11,
    fontWeight: '500',
    color: colors.textMuted,
  },
  priceRow: {
    flexDirection: 'row',
    alignItems: 'baseline',
    gap: 6,
  },
  price: {
    fontSize: 15,
    fontWeight: '800',
    color: colors.dark,
  },
  oldPrice: {
    fontSize: 12,
    fontWeight: '500',
    color: colors.grayLight,
    textDecorationLine: 'line-through',
  },
  listCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.card,
    borderRadius: radius.xl,
    borderWidth: 1,
    borderColor: colors.border,
    padding: spacing.sm,
    marginBottom: CARD_GAP,
  },
  listCardContent: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
  },
  listImageWrap: {
    width: 92,
    height: 92,
    borderRadius: radius.lg,
    backgroundColor: colors.background,
    overflow: 'hidden',
    marginRight: spacing.md,
  },
  listImage: {
    width: '100%',
    height: '100%',
  },
  listInfo: {
    flex: 1,
    justifyContent: 'center',
  },
  listHeartButton: {
    width: 34,
    height: 34,
    borderRadius: 17,
    backgroundColor: colors.background,
    alignItems: 'center',
    justifyContent: 'center',
    marginLeft: spacing.sm,
  },
  pressedIcon: {
    opacity: 0.7,
  },
});
