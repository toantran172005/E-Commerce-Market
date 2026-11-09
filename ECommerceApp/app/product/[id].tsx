import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  Pressable,
  Dimensions,
  NativeSyntheticEvent,
  NativeScrollEvent,
  Image,
  Share,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { colors, radius, spacing } from '../../src/constants/theme';
import {
  ScreenHeader,
  PrimaryButton,
  SecondaryButton,
  RatingStars,
  Chip,
  LoadingView,
  ErrorView,
  EmptyState,
  Toast,
  ProductSpecsTable,
  ProductDescriptionView,
  ProductReviewsList,
} from '../../src/components';
import { useCart } from '../../src/context/CartContext';
import { useFavourites } from '../../src/context/FavouritesContext';
import { useAsync } from '../../src/hooks/useAsync';
import { CatalogService } from '../../src/services/catalog.service';
import { formatMoney, calcDiscountPercent } from '../../src/utils/format';

const { width: SCREEN_WIDTH } = Dimensions.get('window');
const H_PADDING = spacing.xl; // 20
const CAROUSEL_WIDTH = SCREEN_WIDTH - H_PADDING * 2;
const CAROUSEL_HEIGHT = 340;

export default function ProductDetailScreen() {
  const router = useRouter();
  const { id } = useLocalSearchParams<{ id: string }>();
  const productId = id ?? '';

  const { addItem } = useCart();
  const { isFavourite, toggleFavourite } = useFavourites();

  const { data: product, loading, error, run } = useAsync(
    () => CatalogService.getProductById(productId),
    [productId],
  );

  const { data: reviews = [] } = useAsync(
    () => CatalogService.getProductReviews(productId),
    [productId],
  );

  const [activeImage, setActiveImage] = useState(0);
  const [selectedVariantId, setSelectedVariantId] = useState<string | undefined>(undefined);
  const [toastVisible, setToastVisible] = useState(false);
  const [toastMessage, setToastMessage] = useState('');

  const gallery = useMemo(() => {
    if (!product) return [];
    const images = product.images?.filter(Boolean) ?? [];
    if (images.length > 0) return images;
    return [product.imageUrl];
  }, [product]);

  const colorVariants = useMemo(
    () => product?.variants?.filter((v) => v.type === 'color') ?? [],
    [product],
  );
  const otherVariants = useMemo(
    () => product?.variants?.filter((v) => v.type !== 'color') ?? [],
    [product],
  );

  const discountPercent = product
    ? calcDiscountPercent(product.price, product.originalPrice)
    : null;

  const isOutOfStock = product != null && product.stock === 0;
  const isFav = product ? isFavourite(product.id) : false;

  const scrollRef = useRef<any>(null);

  useEffect(() => {
    setActiveImage(0);
  }, [productId]);

  useEffect(() => {
    if (product?.variants?.length) {
      setSelectedVariantId(product.variants[0].id);
    } else {
      setSelectedVariantId(undefined);
    }
  }, [product]);

  const handleScroll = useCallback(
    (event: NativeSyntheticEvent<NativeScrollEvent>) => {
      const offsetX = event.nativeEvent.contentOffset.x;
      const index = Math.round(offsetX / CAROUSEL_WIDTH);
      if (index !== activeImage) setActiveImage(index);
    },
    [activeImage],
  );

  const handleShare = useCallback(async () => {
    if (!product) return;
    try {
      await Share.share({
        title: product.name,
        message: `${product.name} - ${formatMoney(product.price)}`,
      });
    } catch {
      // Người dùng huỷ chia sẻ hoặc không có ứng dụng nhận.
    }
  }, [product]);

  const handleToggleFavourite = useCallback(() => {
    if (product) toggleFavourite(product);
  }, [product, toggleFavourite]);

  const handleAddToCart = useCallback(() => {
    if (!product || isOutOfStock) return;
    addItem(product, 1, selectedVariantId);
    setToastMessage('Đã thêm vào giỏ hàng');
    setToastVisible(true);
  }, [product, isOutOfStock, addItem, selectedVariantId]);

  const handleBuyNow = useCallback(() => {
    if (!product || isOutOfStock) return;
    addItem(product, 1, selectedVariantId);
    router.push('/checkout');
  }, [product, isOutOfStock, addItem, selectedVariantId, router]);

  if (loading) {
    return <LoadingView />;
  }

  if (error) {
    if (error.code === 'PRODUCT_NOT_FOUND') {
      return (
        <SafeAreaView style={styles.safeArea} edges={['top', 'bottom']}>
          <EmptyState
            icon="alert-circle-outline"
            title="Không tìm thấy sản phẩm"
            subtitle="Sản phẩm có thể đã bị gỡ hoặc đường dẫn không đúng."
            actionLabel="Quay lại"
            onAction={() => router.back()}
          />
        </SafeAreaView>
      );
    }
    return (
      <SafeAreaView style={styles.safeArea} edges={['top', 'bottom']}>
        <ErrorView message={error.message} onRetry={run} />
      </SafeAreaView>
    );
  }

  if (!product) {
    return (
      <SafeAreaView style={styles.safeArea} edges={['top', 'bottom']}>
        <ErrorView message="Không tìm thấy sản phẩm." onRetry={run} />
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.safeArea} edges={['top']}>
      <ScreenHeader
        title="Chi tiết"
        right={
          <View style={styles.headerRight}>
            <Pressable
              onPress={handleShare}
              style={({ pressed }) => [styles.iconButton, pressed && styles.pressed]}
              accessibilityRole="button"
              accessibilityLabel="Chia sẻ sản phẩm"
            >
              <Ionicons name="share-social-outline" size={20} color={colors.dark} />
            </Pressable>
            <Pressable
              onPress={handleToggleFavourite}
              style={({ pressed }) => [styles.iconButton, pressed && styles.pressed]}
              accessibilityRole="button"
              accessibilityLabel={isFav ? 'Bỏ yêu thích' : 'Thêm yêu thích'}
              accessibilityState={{ selected: isFav }}
            >
              <Ionicons
                name={isFav ? 'heart' : 'heart-outline'}
                size={20}
                color={isFav ? colors.primary : colors.dark}
              />
            </Pressable>
          </View>
        }
      />

      <ScrollView
        style={styles.scroll}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {/* Carousel ảnh */}
        <View style={styles.carouselWrapper}>
          <ScrollView
            ref={scrollRef}
            horizontal
            pagingEnabled
            decelerationRate="fast"
            snapToInterval={CAROUSEL_WIDTH}
            snapToAlignment="start"
            showsHorizontalScrollIndicator={false}
            onMomentumScrollEnd={handleScroll}
            contentContainerStyle={styles.carouselContainer}
          >
            {gallery.map((uri, index) => (
              <View key={`${index}-${uri}`} style={styles.imageSlide}>
                {uri ? (
                  <Image source={{ uri }} style={styles.productImage} resizeMode="contain" />
                ) : (
                  <Ionicons name="image-outline" size={100} color={colors.grayLight} />
                )}
                <View style={styles.imageGlow} />
              </View>
            ))}
          </ScrollView>
        </View>

        {/* Chấm phân trang */}
        <View style={styles.dotsRow}>
          {gallery.map((uri, index) => (
            <View
              key={`${index}-dot-${uri}`}
              style={[styles.dot, index === activeImage ? styles.dotActive : styles.dotInactive]}
            />
          ))}
        </View>

        {/* Thông tin sản phẩm */}
        <View style={styles.infoContainer}>
          <Text style={styles.brand}>{product.brandName ?? product.category ?? ''}</Text>
          <Text style={styles.productName}>{product.name}</Text>

          <View style={styles.ratingRow}>
            <RatingStars rating={product.rating ?? 0} size={15} />
            <Text style={styles.ratingValue}>{product.rating ?? 0}</Text>
            <Text style={styles.reviewsText}>({product.reviewCount ?? 0} đánh giá)</Text>
          </View>

          <View style={styles.priceContainer}>
            <View style={styles.priceTopRow}>
              <Text style={styles.price}>{formatMoney(product.price)}</Text>
              <View style={styles.stockWrapper}>
                <Ionicons
                  name={isOutOfStock ? 'close-circle' : 'checkmark-circle'}
                  size={14}
                  color={isOutOfStock ? colors.danger : colors.success}
                />
                <Text style={[styles.stockText, { color: isOutOfStock ? colors.danger : colors.success }]}>
                  {isOutOfStock ? 'Hết hàng' : `Còn hàng (${product.stock ?? 0})`}
                </Text>
              </View>
            </View>
            {product.originalPrice && product.originalPrice > product.price && (
              <View style={styles.priceBottomRow}>
                <Text style={styles.originalPrice}>{formatMoney(product.originalPrice)}</Text>
                {discountPercent != null && (
                  <View style={styles.discountBadge}>
                    <Text style={styles.discountText}>-{discountPercent}%</Text>
                  </View>
                )}
              </View>
            )}
          </View>

          <Text style={styles.description}>{product.description}</Text>

          {/* Màu sắc */}
          {colorVariants.length > 0 && (
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>Màu sắc</Text>
              <View style={styles.variantRow}>
                {colorVariants.map((variant) => (
                  <Chip
                    key={variant.id}
                    label={variant.name}
                    selected={selectedVariantId === variant.id}
                    onPress={() => setSelectedVariantId(variant.id)}
                  />
                ))}
              </View>
            </View>
          )}

          {/* Phiên bản */}
          {otherVariants.length > 0 && (
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>Phiên bản</Text>
              <View style={styles.variantRow}>
                {otherVariants.map((variant) => (
                  <Chip
                    key={variant.id}
                    label={variant.name}
                    selected={selectedVariantId === variant.id}
                    onPress={() => setSelectedVariantId(variant.id)}
                  />
                ))}
              </View>
            </View>
          )}
          {/* CHI TIẾT SẢN PHẨM (Shopee style - mobile.docx B) */}
          <ProductSpecsTable product={product} />

          {/* MÔ TẢ SẢN PHẨM (Shopee style - mobile.docx B) */}
          <ProductDescriptionView product={product} />

          {/* ĐÁNH GIÁ SẢN PHẨM (UC010) */}
          <ProductReviewsList
            reviews={reviews ?? []}
            rating={product.rating ?? 4.8}
            reviewCount={product.reviewCount ?? 0}
          />
        </View>
      </ScrollView>

      <SafeAreaView edges={['bottom']} style={styles.bottomBarWrapper}>
        <View style={styles.bottomBar}>
          <SecondaryButton
            title="Thêm vào giỏ"
            onPress={handleAddToCart}
            style={styles.cartButton}
            disabled={isOutOfStock}
          />
          <PrimaryButton
            title="Mua ngay"
            onPress={handleBuyNow}
            style={styles.buyButton}
            disabled={isOutOfStock}
          />
        </View>
      </SafeAreaView>

      <Toast
        visible={toastVisible}
        message={toastMessage}
        bottom={130}
        onHide={() => setToastVisible(false)}
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: colors.card,
  },
  pressed: { opacity: 0.8 },
  headerRight: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  iconButton: {
    width: 44,
    height: 44,
    borderRadius: radius.pill,
    backgroundColor: colors.card,
    alignItems: 'center',
    justifyContent: 'center',
    marginLeft: spacing.sm,
    shadowColor: colors.dark,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06,
    shadowRadius: 6,
    elevation: 2,
  },
  scroll: {
    flex: 1,
  },
  scrollContent: {
    paddingBottom: spacing.xl,
  },
  carouselWrapper: {
    marginTop: spacing.sm,
  },
  carouselContainer: {
    paddingHorizontal: H_PADDING,
  },
  imageSlide: {
    width: CAROUSEL_WIDTH,
    height: CAROUSEL_HEIGHT,
    borderRadius: radius.xl,
    alignItems: 'center',
    justifyContent: 'center',
    overflow: 'hidden',
    backgroundColor: colors.background,
  },
  productImage: {
    width: '90%',
    height: '90%',
  },
  imageGlow: {
    position: 'absolute',
    width: CAROUSEL_WIDTH * 0.7,
    height: CAROUSEL_WIDTH * 0.7,
    borderRadius: CAROUSEL_WIDTH,
    backgroundColor: 'rgba(255, 255, 255, 0.55)',
    top: -CAROUSEL_WIDTH * 0.25,
    right: -CAROUSEL_WIDTH * 0.2,
  },
  dotsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: spacing.md,
  },
  dot: {
    height: 6,
    borderRadius: radius.sm,
    marginHorizontal: spacing.xs,
  },
  dotActive: {
    width: 22,
    backgroundColor: colors.primary,
  },
  dotInactive: {
    width: 6,
    backgroundColor: colors.grayLight,
  },
  infoContainer: {
    paddingHorizontal: H_PADDING,
    paddingTop: spacing.xl,
  },
  brand: {
    fontSize: 12,
    fontWeight: '700',
    letterSpacing: 1.6,
    color: colors.primary,
    marginBottom: spacing.xs,
  },
  productName: {
    fontSize: 24,
    fontWeight: '800',
    color: colors.dark,
    letterSpacing: -0.4,
    marginBottom: spacing.md,
  },
  ratingRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: spacing.lg,
  },
  ratingValue: {
    fontSize: 13,
    fontWeight: '700',
    color: colors.dark,
    marginLeft: spacing.xs,
    marginRight: spacing.xs,
  },
  reviewsText: {
    fontSize: 13,
    fontWeight: '500',
    color: colors.gray,
  },
  priceContainer: {
    marginBottom: spacing.md,
  },
  priceTopRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  priceBottomRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 4,
  },
  price: {
    fontSize: 30,
    fontWeight: '800',
    color: colors.dark,
    letterSpacing: -0.8,
  },
  originalPrice: {
    fontSize: 15,
    fontWeight: '500',
    color: colors.placeholder,
    textDecorationLine: 'line-through',
    marginRight: spacing.sm,
  },
  discountBadge: {
    backgroundColor: colors.primarySoft,
    paddingHorizontal: spacing.sm,
    paddingVertical: spacing.xs,
    borderRadius: radius.sm,
  },
  discountText: {
    fontSize: 12,
    fontWeight: '700',
    color: colors.primary,
  },
  stockWrapper: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  stockText: {
    fontSize: 13,
    fontWeight: '600',
    marginLeft: 2,
  },
  description: {
    fontSize: 15,
    lineHeight: 22,
    fontWeight: '400',
    color: colors.textSecondary,
    marginBottom: spacing.xl,
  },
  section: {
    marginBottom: spacing.xl,
  },
  sectionTitle: {
    fontSize: 15,
    fontWeight: '700',
    color: colors.dark,
    marginBottom: spacing.md,
  },
  variantRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.sm,
  },
  bottomBarWrapper: {
    backgroundColor: colors.card,
    borderTopWidth: 1,
    borderTopColor: colors.border,
  },
  bottomBar: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: H_PADDING,
    paddingTop: spacing.md,
    paddingBottom: spacing.md,
  },
  cartButton: {
    flex: 1,
    marginRight: spacing.md,
  },
  buyButton: {
    flex: 1.25,
  },
});
