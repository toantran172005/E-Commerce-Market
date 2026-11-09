import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TextInput,
  TouchableOpacity,
  ScrollView,
  Image,
  Dimensions,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { colors } from '../../src/constants/theme';

const { width } = Dimensions.get('window');
const H_PADDING = 20;
const CARD_GAP = 14;
const CARD_WIDTH = (width - H_PADDING * 2 - CARD_GAP) / 2;

type Category = {
  id: string;
  name: string;
  icon: keyof typeof Ionicons.glyphMap;
};

type Product = {
  id: string;
  name: string;
  price: number;
  originalPrice: number;
  discount: number;
  rating: number;
  reviews: number;
  category: string;
  image: string;
};

const CATEGORIES: Category[] = [
  { id: 'audio', name: 'Âm thanh', icon: 'headset-outline' },
  { id: 'phones', name: 'Điện thoại', icon: 'phone-portrait-outline' },
  { id: 'laptops', name: 'Laptop', icon: 'laptop-outline' },
  { id: 'accessories', name: 'Phụ kiện', icon: 'watch-outline' },
];

const FILTER_CHIPS = ['Tất cả', 'Audio', 'Phones', 'Laptops', 'Accessories'];

const PRODUCTS: Product[] = [
  {
    id: '1',
    name: 'AuraSound Pro',
    price: 249,
    originalPrice: 299,
    discount: 17,
    rating: 4.8,
    reviews: 320,
    category: 'Audio',
    image:
      'https://images.unsplash.com/photo-1505740420928-5e560c06d30e?auto=format&fit=crop&w=600&q=80',
  },
  {
    id: '2',
    name: 'Pulse Buds Pro',
    price: 129,
    originalPrice: 159,
    discount: 18,
    rating: 4.6,
    reviews: 214,
    category: 'Phones',
    image:
      'https://images.unsplash.com/photo-1511707171634-5f897ff02aa9?auto=format&fit=crop&w=600&q=80',
  },
  {
    id: '3',
    name: 'NovaBook Air 13',
    price: 1099,
    originalPrice: 1299,
    discount: 15,
    rating: 4.9,
    reviews: 87,
    category: 'Laptops',
    image:
      'https://images.unsplash.com/photo-1517336714731-489689fd1ca8?auto=format&fit=crop&w=600&q=80',
  },
  {
    id: '4',
    name: 'Vision Watch S5',
    price: 199,
    originalPrice: 249,
    discount: 20,
    rating: 4.7,
    reviews: 156,
    category: 'Accessories',
    image:
      'https://images.unsplash.com/photo-1523275335684-37898b6baf30?auto=format&fit=crop&w=600&q=80',
  },
  {
    id: '5',
    name: 'Vortex Gaming 7.1',
    price: 149,
    originalPrice: 199,
    discount: 25,
    rating: 4.6,
    reviews: 320,
    category: 'Audio',
    image:
      'https://images.unsplash.com/photo-1546435770-a3e426bf472b?auto=format&fit=crop&w=600&q=80',
  },
];

export default function HomeScreen() {
  const router = useRouter();
  const [activeCategory, setActiveCategory] = useState<string>('Tất cả');
  const [isGrid, setIsGrid] = useState<boolean>(true);
  const [favorites, setFavorites] = useState<Record<string, boolean>>({});

  const toggleFavorite = (id: string) =>
    setFavorites((prev) => ({ ...prev, [id]: !prev[id] }));

  const filteredProducts =
    activeCategory === 'Tất cả'
      ? PRODUCTS
      : PRODUCTS.filter((p) => p.category === activeCategory);

  const goToProduct = (id: string) =>
    router.push({ pathname: '/product/[id]', params: { id } });

  return (
    <SafeAreaView style={styles.safeArea} edges={['top']}>
      <ScrollView
        style={styles.scroll}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {/* Header */}
        <View style={styles.header}>
          <View>
            <Text style={styles.greeting}>Chào buổi sáng</Text>
            <Text style={styles.title}>Hey, Alex</Text>
          </View>
          <View style={styles.headerActions}>
            <TouchableOpacity style={styles.bellButton} activeOpacity={0.8}>
              <Ionicons name="notifications-outline" size={22} color={colors.dark} />
              <View style={styles.badgeDot} />
            </TouchableOpacity>
            <TouchableOpacity
              style={styles.cartButton}
              activeOpacity={0.85}
              onPress={() => router.push('/cart')}
            >
              <Ionicons name="cart-outline" size={20} color="#FFFFFF" />
              <View style={styles.cartBadge}>
                <Text style={styles.cartBadgeText}>1</Text>
              </View>
            </TouchableOpacity>
          </View>
        </View>

        {/* Search + Filter */}
        <View style={styles.searchRow}>
          <View style={styles.searchBox}>
            <Ionicons name="search-outline" size={20} color="#9AA0A6" />
            <TextInput
              style={styles.searchInput}
              placeholder="Tìm kiếm tai nghe, điện thoại, laptop..."
              placeholderTextColor="#9AA0A6"
              returnKeyType="search"
            />
          </View>
          <TouchableOpacity
            style={styles.filterButton}
            activeOpacity={0.85}
            onPress={() => router.push('/filter')}
          >
            <Ionicons name="options-outline" size={22} color="#FFFFFF" />
          </TouchableOpacity>
        </View>

        {/* Categories */}
        <View style={styles.sectionHeader}>
          <Text style={styles.sectionTitle}>Danh mục sản phẩm</Text>
          <Text style={styles.sectionMeta}>5 sản phẩm</Text>
        </View>
        <View style={styles.categoriesRow}>
          {CATEGORIES.map((cat) => (
            <TouchableOpacity
              key={cat.id}
              style={styles.categoryItem}
              activeOpacity={0.8}
              onPress={() => setActiveCategory(cat.name)}
            >
              <View style={styles.categoryIconBox}>
                <Ionicons name={cat.icon} size={22} color={colors.primary} />
              </View>
              <Text style={styles.categoryLabel} numberOfLines={1}>
                {cat.name}
              </Text>
            </TouchableOpacity>
          ))}
        </View>

        {/* All Products header */}
        <View style={styles.productsHeader}>
          <Text style={styles.sectionTitle}>Tất cả sản phẩm</Text>
          <TouchableOpacity
            style={styles.viewToggle}
            activeOpacity={0.8}
            onPress={() => setIsGrid((prev) => !prev)}
          >
            <Ionicons
              name={isGrid ? 'list-outline' : 'grid-outline'}
              size={18}
              color={colors.dark}
            />
          </TouchableOpacity>
        </View>

        {/* Filter chips */}
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.chipsRow}
          style={styles.chipsScroll}
        >
          {FILTER_CHIPS.map((chip) => {
            const active = activeCategory === chip;
            return (
              <TouchableOpacity
                key={chip}
                style={[styles.chip, active && styles.chipActive]}
                activeOpacity={0.85}
                onPress={() => setActiveCategory(chip)}
              >
                <Text style={[styles.chipText, active && styles.chipTextActive]}>
                  {chip}
                </Text>
              </TouchableOpacity>
            );
          })}
        </ScrollView>

        {/* Products */}
        {isGrid ? (
          <View style={styles.grid}>
            {filteredProducts.map((item, index) => (
              <TouchableOpacity
                key={item.id}
                style={[
                  styles.card,
                  { width: CARD_WIDTH },
                  index % 2 === 0 ? { marginRight: CARD_GAP } : null,
                ]}
                activeOpacity={0.9}
                onPress={() => goToProduct(item.id)}
              >
                <View style={styles.cardImageWrap}>
                  <Image source={{ uri: item.image }} style={styles.cardImage} />
                  <View style={styles.discountBadge}>
                    <Text style={styles.discountText}>-{item.discount}%</Text>
                  </View>
                  <TouchableOpacity
                    style={styles.heartButton}
                    activeOpacity={0.8}
                    onPress={() => toggleFavorite(item.id)}
                  >
                    <Ionicons
                      name={favorites[item.id] ? 'heart' : 'heart-outline'}
                      size={16}
                      color={favorites[item.id] ? colors.primary : '#9AA0A6'}
                    />
                  </TouchableOpacity>
                </View>
                <Text style={styles.cardName} numberOfLines={1}>
                  {item.name}
                </Text>
                <View style={styles.priceRow}>
                  <Text style={styles.price}>${item.price}</Text>
                  <Text style={styles.oldPrice}>${item.originalPrice}</Text>
                </View>
                <View style={styles.ratingRow}>
                  <Ionicons name="star" size={12} color="#FFB800" />
                  <Text style={styles.ratingText}>{item.rating}</Text>
                  <Text style={styles.reviewsText}>({item.reviews})</Text>
                </View>
              </TouchableOpacity>
            ))}
          </View>
        ) : (
          <View style={styles.listWrapper}>
            {filteredProducts.map((item) => (
              <TouchableOpacity
                key={item.id}
                style={styles.listCard}
                activeOpacity={0.9}
                onPress={() => goToProduct(item.id)}
              >
                <View style={styles.listImageWrap}>
                  <Image source={{ uri: item.image }} style={styles.listImage} />
                  <View style={styles.discountBadge}>
                    <Text style={styles.discountText}>-{item.discount}%</Text>
                  </View>
                </View>
                <View style={styles.listInfo}>
                  <Text style={styles.cardName} numberOfLines={1}>
                    {item.name}
                  </Text>
                  <View style={styles.priceRow}>
                    <Text style={styles.price}>${item.price}</Text>
                    <Text style={styles.oldPrice}>${item.originalPrice}</Text>
                  </View>
                  <View style={styles.ratingRow}>
                    <Ionicons name="star" size={12} color="#FFB800" />
                    <Text style={styles.ratingText}>{item.rating}</Text>
                    <Text style={styles.reviewsText}>({item.reviews})</Text>
                  </View>
                </View>
                <TouchableOpacity
                  style={styles.listHeartButton}
                  activeOpacity={0.8}
                  onPress={() => toggleFavorite(item.id)}
                >
                  <Ionicons
                    name={favorites[item.id] ? 'heart' : 'heart-outline'}
                    size={18}
                    color={favorites[item.id] ? colors.primary : '#9AA0A6'}
                  />
                </TouchableOpacity>
              </TouchableOpacity>
            ))}
          </View>
        )}

        {filteredProducts.length === 0 && (
          <View style={styles.emptyState}>
            <Ionicons name="leaf-outline" size={40} color="#C7CCD4" />
            <Text style={styles.emptyText}>No products in this category</Text>
          </View>
        )}

        <View style={styles.bottomSpacer} />
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: colors.background,
  },
  scroll: {
    flex: 1,
  },
  scrollContent: {
    paddingHorizontal: H_PADDING,
    paddingTop: 8,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 18,
  },
  greeting: {
    fontSize: 13,
    color: '#8E8E93',
    fontWeight: '500',
    marginBottom: 4,
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
    backgroundColor: '#FFFFFF',
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
    backgroundColor: '#FF3B30',
    borderWidth: 2,
    borderColor: '#FFFFFF',
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
    color: '#FFFFFF',
  },
  cartButton: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
    marginLeft: 10,
    shadowColor: colors.primary,
    shadowOpacity: 0.35,
    shadowRadius: 10,
    shadowOffset: { width: 0, height: 5 },
    elevation: 5,
  },
  searchRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 20,
  },
  searchBox: {
    flex: 1,
    height: 52,
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    borderWidth: 1,
    borderColor: colors.border,
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
  },
  searchInput: {
    flex: 1,
    marginLeft: 10,
    fontSize: 14,
    color: colors.dark,
    paddingVertical: 0,
  },
  filterButton: {
    width: 52,
    height: 52,
    borderRadius: 16,
    backgroundColor: colors.dark,
    alignItems: 'center',
    justifyContent: 'center',
    marginLeft: 12,
  },
  banner: {
    backgroundColor: colors.primary,
    borderRadius: 24,
    padding: 20,
    marginBottom: 26,
    overflow: 'hidden',
  },
  bannerBadge: {
    alignSelf: 'flex-start',
    backgroundColor: 'rgba(255,255,255,0.22)',
    paddingHorizontal: 12,
    paddingVertical: 5,
    borderRadius: 20,
    marginBottom: 12,
  },
  bannerBadgeText: {
    color: '#FFFFFF',
    fontSize: 10,
    fontWeight: '800',
    letterSpacing: 0.8,
  },
  bannerTitle: {
    color: '#FFFFFF',
    fontSize: 22,
    fontWeight: '800',
    lineHeight: 28,
    marginBottom: 16,
    letterSpacing: -0.3,
  },
  bannerButton: {
    alignSelf: 'flex-start',
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    paddingLeft: 16,
    paddingRight: 10,
    paddingVertical: 9,
    borderRadius: 20,
  },
  bannerButtonText: {
    color: colors.primary,
    fontSize: 13,
    fontWeight: '700',
    marginRight: 4,
  },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 14,
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
    color: '#8E8E93',
  },
  categoriesRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 28,
  },
  categoryItem: {
    alignItems: 'center',
    width: (width - H_PADDING * 2 - 24) / 4,
  },
  categoryIconBox: {
    width: 62,
    height: 62,
    borderRadius: 20,
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: colors.border,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 8,
  },
  categoryLabel: {
    fontSize: 12,
    fontWeight: '600',
    color: colors.dark,
  },
  productsHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 14,
  },
  viewToggle: {
    width: 40,
    height: 40,
    borderRadius: 12,
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: colors.border,
    alignItems: 'center',
    justifyContent: 'center',
  },
  chipsScroll: {
    marginHorizontal: -H_PADDING,
    marginBottom: 18,
  },
  chipsRow: {
    paddingHorizontal: H_PADDING,
  },
  chip: {
    paddingHorizontal: 18,
    paddingVertical: 10,
    borderRadius: 22,
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: colors.border,
    marginRight: 10,
  },
  chipActive: {
    backgroundColor: colors.dark,
    borderColor: colors.dark,
  },
  chipText: {
    fontSize: 13,
    fontWeight: '600',
    color: '#6B7280',
  },
  chipTextActive: {
    color: '#FFFFFF',
  },
  grid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
  },
  card: {
    backgroundColor: '#FFFFFF',
    borderRadius: 20,
    borderWidth: 1,
    borderColor: colors.border,
    padding: 10,
    marginBottom: CARD_GAP,
  },
  cardImageWrap: {
    height: 124,
    borderRadius: 16,
    backgroundColor: '#F3F4F6',
    overflow: 'hidden',
    marginBottom: 10,
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
    borderRadius: 10,
  },
  discountText: {
    color: '#FFFFFF',
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
    backgroundColor: '#FFFFFF',
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
    marginBottom: 6,
  },
  priceRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 6,
  },
  price: {
    fontSize: 15,
    fontWeight: '800',
    color: colors.dark,
    marginRight: 8,
  },
  oldPrice: {
    fontSize: 12,
    fontWeight: '500',
    color: '#A0A4AB',
    textDecorationLine: 'line-through',
  },
  ratingRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  ratingText: {
    fontSize: 12,
    fontWeight: '700',
    color: colors.dark,
    marginLeft: 4,
  },
  reviewsText: {
    fontSize: 11,
    fontWeight: '500',
    color: '#9AA0A6',
    marginLeft: 3,
  },
  listWrapper: {
    marginBottom: 4,
  },
  listCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    borderRadius: 20,
    borderWidth: 1,
    borderColor: colors.border,
    padding: 10,
    marginBottom: 12,
  },
  listImageWrap: {
    width: 92,
    height: 92,
    borderRadius: 16,
    backgroundColor: '#F3F4F6',
    overflow: 'hidden',
    marginRight: 14,
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
    backgroundColor: '#F8F9FB',
    alignItems: 'center',
    justifyContent: 'center',
    marginLeft: 8,
  },
  emptyState: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 40,
  },
  emptyText: {
    marginTop: 10,
    fontSize: 13,
    fontWeight: '600',
    color: '#9AA0A6',
  },
  bottomSpacer: {
    height: 120,
  },
});