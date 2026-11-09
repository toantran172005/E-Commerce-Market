import React, { useRef, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Dimensions,
  NativeScrollEvent,
  NativeSyntheticEvent,
  Alert,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { colors } from '../../src/constants/theme';

const { width: SCREEN_WIDTH } = Dimensions.get('window');

const H_PADDING = 20;
const CAROUSEL_WIDTH = SCREEN_WIDTH - H_PADDING * 2;
const CAROUSEL_HEIGHT = 340;

type ColorOption = {
  id: string;
  name: string;
  hex: string;
};

type VariantOption = {
  id: string;
  label: string;
};

type Product = {
  id: string;
  brand: string;
  name: string;
  rating: number;
  reviews: number;
  price: number;
  originalPrice: number;
  inStock: number;
  description: string;
  images: { id: string; tint: string; icon: keyof typeof Ionicons.glyphMap }[];
  colorOptions: ColorOption[];
  variantOptions: VariantOption[];
};

const PRODUCTS: Record<string, Product> = {
  '1': {
    id: '1',
    brand: 'AURASOUND',
    name: 'AuraBeats Pro Wireless',
    rating: 4.8,
    reviews: 1284,
    price: 249,
    originalPrice: 299,
    inStock: 24,
    description:
      'Active noise cancelling over-ear headphones with 40h battery life.',
    images: [
      { id: 'img-1', tint: '#F2F2F3', icon: 'headset' },
      { id: 'img-2', tint: '#ECEEF1', icon: 'headset-outline' },
      { id: 'img-3', tint: '#F5EFEA', icon: 'musical-notes' },
    ],
    colorOptions: [
      { id: 'carbon', name: 'Carbon Black', hex: '#1A1A1A' },
      { id: 'silver', name: 'Moon Silver', hex: '#C9C9CB' },
      { id: 'brown', name: 'Chestnut Brown', hex: '#A85B3A' },
    ],
    variantOptions: [
      { id: 'standard', label: 'Standard' },
      { id: 'premium', label: 'Premium Case' },
    ],
  },
};

const FALLBACK_PRODUCT: Product = PRODUCTS['1'];

export default function ProductDetailScreen() {
  const router = useRouter();
  const params = useLocalSearchParams<{ id?: string }>();
  const product = PRODUCTS[String(params?.id ?? '1')] ?? FALLBACK_PRODUCT;

  const [activeImage, setActiveImage] = useState(0);
  const [selectedColor, setSelectedColor] = useState<string>(
    product.colorOptions[0].id
  );
  const [selectedVariant, setSelectedVariant] = useState<string>(
    product.variantOptions[0].id
  );
  const [liked, setLiked] = useState(false);

  const scrollRef = useRef<any>(null);

  const selectedColorName =
    product.colorOptions.find((c) => c.id === selectedColor)?.name ??
    product.colorOptions[0].name;

  const discountPercent = Math.round(
    ((product.originalPrice - product.price) / product.originalPrice) * 100
  );

  const handleScroll = (event: NativeSyntheticEvent<NativeScrollEvent>) => {
    const offsetX = event.nativeEvent.contentOffset.x;
    const index = Math.round(offsetX / CAROUSEL_WIDTH);
    if (index !== activeImage) {
      setActiveImage(index);
    }
  };

  const handleShare = () => {
    Alert.alert('Share', `Share product #${product.id} with your friends.`);
  };

  const handleAddToCart = () => {
    Alert.alert(
      'Đã thêm vào giỏ hàng',
      `${product.name} đã được thêm vào giỏ hàng thành công!`,
      [
        { text: 'Tiếp tục xem', style: 'cancel' },
        { text: 'Xem giỏ hàng', onPress: () => router.push('/cart') }
      ]
    );
  };

  const handleBuyNow = () => {
    router.push("/checkout");
  };

  return (
    <SafeAreaView style={styles.safeArea} edges={['top']}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity
          style={styles.iconButton}
          activeOpacity={0.8}
          onPress={() => router.back()}
          accessibilityLabel="Go back"
        >
          <Ionicons name="arrow-back" size={20} color={colors.dark} />
        </TouchableOpacity>

        <View style={styles.headerRight}>
          <TouchableOpacity
            style={styles.iconButton}
            activeOpacity={0.8}
            onPress={handleShare}
            accessibilityLabel="Share product"
          >
            <Ionicons name="share-social-outline" size={20} color={colors.dark} />
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.iconButton}
            activeOpacity={0.8}
            onPress={() => setLiked((prev) => !prev)}
            accessibilityLabel="Add to favorites"
          >
            <Ionicons
              name={liked ? 'heart' : 'heart-outline'}
              size={20}
              color={liked ? colors.primary : colors.dark}
            />
          </TouchableOpacity>
        </View>
      </View>

      <ScrollView
        style={styles.scroll}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {/* Image carousel */}
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
            {product.images.map((image) => (
              <View
                key={image.id}
                style={[styles.imageSlide, { backgroundColor: image.tint }]}
              >
                <Ionicons
                  name={image.icon}
                  size={170}
                  color="rgba(26, 26, 26, 0.16)"
                />
                <View style={styles.imageGlow} />
              </View>
            ))}
          </ScrollView>
        </View>

        {/* Pagination dots */}
        <View style={styles.dotsRow}>
          {product.images.map((image, index) => (
            <View
              key={image.id}
              style={[
                styles.dot,
                index === activeImage ? styles.dotActive : styles.dotInactive,
              ]}
            />
          ))}
        </View>

        {/* Product info */}
        <View style={styles.infoContainer}>
          <Text style={styles.brand}>{product.brand}</Text>
          <Text style={styles.productName}>{product.name}</Text>

          {/* Rating */}
          <View style={styles.ratingRow}>
            <View style={styles.starsRow}>
              {[0, 1, 2, 3, 4].map((star) => (
                <Ionicons
                  key={star}
                  name="star"
                  size={15}
                  color="#FFB800"
                  style={styles.starIcon}
                />
              ))}
            </View>
            <Text style={styles.ratingValue}>{product.rating}</Text>
            <Text style={styles.reviewsText}>({product.reviews} reviews)</Text>
          </View>

          {/* Price */}
          <View style={styles.priceRow}>
            <Text style={styles.price}>${product.price}</Text>
            <Text style={styles.originalPrice}>${product.originalPrice}</Text>
            <View style={styles.discountBadge}>
              <Text style={styles.discountText}>-{discountPercent}%</Text>
            </View>
            <View style={styles.stockWrapper}>
              <Ionicons name="checkmark" size={14} color="#22C55E" />
              <Text style={styles.stockText}>In stock ({product.inStock})</Text>
            </View>
          </View>

          {/* Description */}
          <Text style={styles.description}>{product.description}</Text>

          {/* Color selection */}
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>Color</Text>
            <Text style={styles.sectionValue}>{selectedColorName}</Text>
          </View>
          <View style={styles.colorRow}>
            {product.colorOptions.map((option) => {
              const isActive = option.id === selectedColor;
              return (
                <TouchableOpacity
                  key={option.id}
                  activeOpacity={0.8}
                  onPress={() => setSelectedColor(option.id)}
                  style={[
                    styles.colorRing,
                    isActive && styles.colorRingActive,
                  ]}
                  accessibilityLabel={option.name}
                >
                  <View
                    style={[
                      styles.colorSwatch,
                      { backgroundColor: option.hex },
                    ]}
                  >
                    {isActive && (
                      <Ionicons
                        name="checkmark"
                        size={16}
                        color="#FFFFFF"
                      />
                    )}
                  </View>
                </TouchableOpacity>
              );
            })}
          </View>

          {/* Variant selection */}
          <Text style={styles.sectionTitle}>Variant</Text>
          <View style={styles.variantRow}>
            {product.variantOptions.map((option) => {
              const isActive = option.id === selectedVariant;
              return (
                <TouchableOpacity
                  key={option.id}
                  activeOpacity={0.85}
                  onPress={() => setSelectedVariant(option.id)}
                  style={[
                    styles.variantButton,
                    isActive ? styles.variantButtonActive : styles.variantButtonInactive,
                  ]}
                >
                  <Text
                    style={[
                      styles.variantText,
                      isActive ? styles.variantTextActive : styles.variantTextInactive,
                    ]}
                  >
                    {option.label}
                  </Text>
                </TouchableOpacity>
              );
            })}
          </View>
        </View>
      </ScrollView>

      {/* Bottom action bar */}
      <SafeAreaView edges={['bottom']} style={styles.bottomBarWrapper}>
        <View style={styles.bottomBar}>
          <TouchableOpacity
            style={[styles.actionButton, styles.cartButton]}
            activeOpacity={0.85}
            onPress={handleAddToCart}
          >
            <Text style={styles.cartButtonText}>Add to Cart</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.actionButton, styles.buyButton]}
            activeOpacity={0.85}
            onPress={handleBuyNow}
          >
            <Text style={styles.buyButtonText}>Buy Now</Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: '#FFFFFF',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: H_PADDING,
    paddingTop: 8,
    paddingBottom: 8,
  },
  headerRight: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  iconButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: '#FFFFFF',
    alignItems: 'center',
    justifyContent: 'center',
    marginLeft: 4,
    shadowColor: '#1A1A1A',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06,
    shadowRadius: 6,
    elevation: 2,
  },
  scroll: {
    flex: 1,
  },
  scrollContent: {
    paddingBottom: 24,
  },
  carouselWrapper: {
    marginTop: 8,
  },
  carouselContainer: {
    paddingHorizontal: H_PADDING,
  },
  imageSlide: {
    width: CAROUSEL_WIDTH,
    height: CAROUSEL_HEIGHT,
    borderRadius: 28,
    alignItems: 'center',
    justifyContent: 'center',
    overflow: 'hidden',
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
    marginTop: 14,
  },
  dot: {
    height: 6,
    borderRadius: 3,
    marginHorizontal: 3,
  },
  dotActive: {
    width: 22,
    backgroundColor: colors.primary,
  },
  dotInactive: {
    width: 6,
    backgroundColor: '#D5D8DC',
  },
  infoContainer: {
    paddingHorizontal: H_PADDING,
    paddingTop: 22,
  },
  brand: {
    fontSize: 12,
    fontWeight: '700',
    letterSpacing: 1.6,
    color: colors.primary,
    marginBottom: 6,
  },
  productName: {
    fontSize: 24,
    fontWeight: '800',
    color: colors.dark,
    letterSpacing: -0.4,
    marginBottom: 10,
  },
  ratingRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
  },
  starsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginRight: 8,
  },
  starIcon: {
    marginRight: 2,
  },
  ratingValue: {
    fontSize: 13,
    fontWeight: '700',
    color: colors.dark,
    marginRight: 6,
  },
  reviewsText: {
    fontSize: 13,
    fontWeight: '500',
    color: '#8A8F98',
  },
  priceRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 14,
  },
  price: {
    fontSize: 30,
    fontWeight: '800',
    color: colors.dark,
    letterSpacing: -0.8,
    marginRight: 10,
  },
  originalPrice: {
    fontSize: 15,
    fontWeight: '500',
    color: '#9AA0A6',
    textDecorationLine: 'line-through',
    marginRight: 10,
  },
  discountBadge: {
    backgroundColor: '#FFEDE5',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 8,
    marginRight: 12,
  },
  discountText: {
    fontSize: 12,
    fontWeight: '700',
    color: colors.primary,
  },
  stockWrapper: {
    flexDirection: 'row',
    alignItems: 'center',
    marginLeft: 'auto',
  },
  stockText: {
    fontSize: 13,
    fontWeight: '600',
    color: '#22C55E',
    marginLeft: 2,
  },
  description: {
    fontSize: 15,
    lineHeight: 22,
    fontWeight: '400',
    color: '#6B7280',
    marginBottom: 24,
  },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 12,
  },
  sectionTitle: {
    fontSize: 15,
    fontWeight: '700',
    color: colors.dark,
  },
  sectionValue: {
    fontSize: 13,
    fontWeight: '500',
    color: '#8A8F98',
  },
  colorRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 22,
  },
  colorRing: {
    width: 46,
    height: 46,
    borderRadius: 23,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
    borderWidth: 2,
    borderColor: 'transparent',
  },
  colorRingActive: {
    borderColor: colors.primary,
  },
  colorSwatch: {
    width: 36,
    height: 36,
    borderRadius: 18,
    alignItems: 'center',
    justifyContent: 'center',
  },
  variantRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 12,
  },
  variantButton: {
    paddingHorizontal: 22,
    height: 46,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  variantButtonActive: {
    backgroundColor: colors.dark,
    borderWidth: 1,
    borderColor: colors.dark,
  },
  variantButtonInactive: {
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: colors.border,
  },
  variantText: {
    fontSize: 14,
    fontWeight: '600',
  },
  variantTextActive: {
    color: '#FFFFFF',
  },
  variantTextInactive: {
    color: colors.dark,
  },
  bottomBarWrapper: {
    backgroundColor: '#FFFFFF',
    borderTopWidth: 1,
    borderTopColor: colors.border,
  },
  bottomBar: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: H_PADDING,
    paddingTop: 12,
    paddingBottom: 12,
  },
  actionButton: {
    height: 54,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
  },
  cartButton: {
    flex: 1,
    borderWidth: 1.5,
    borderColor: colors.primary,
    backgroundColor: '#FFFFFF',
    marginRight: 12,
  },
  cartButtonText: {
    fontSize: 16,
    fontWeight: '700',
    color: colors.primary,
  },
  buyButton: {
    flex: 1.25,
    backgroundColor: colors.primary,
    shadowColor: colors.primary,
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.25,
    shadowRadius: 12,
    elevation: 4,
  },
  buyButtonText: {
    fontSize: 16,
    fontWeight: '700',
    color: '#FFFFFF',
  },
});