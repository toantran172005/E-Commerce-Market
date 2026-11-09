import React, { useCallback, useState } from 'react';
import {
  FlatList,
  Image,
  Pressable,
  StyleSheet,
  Text,
  View,
  Dimensions,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { colors } from '../../src/constants/theme';

const { width: SCREEN_WIDTH } = Dimensions.get('window');
const HORIZONTAL_PADDING = 18;
const GRID_GAP = 12;
// Chiều rộng chính xác cố định cho 1 cột trong lưới 2 cột
const CARD_WIDTH = (SCREEN_WIDTH - HORIZONTAL_PADDING * 2 - GRID_GAP) / 2;

type FavouriteItem = {
  id: string;
  brand: string;
  name: string;
  price: number;
  oldPrice: number;
  discount: string;
  rating: number;
  reviews: number;
  image: string;
};

const MOCK_FAVOURITES: FavouriteItem[] = [
  {
    id: '1',
    brand: 'AuraSound',
    name: 'AuraBeats Pro Wireless',
    price: 249,
    oldPrice: 299,
    discount: '-17%',
    rating: 5,
    reviews: 1284,
    image:
      'https://images.unsplash.com/photo-1505740420928-5e560c06d30e?auto=format&fit=crop&w=600&q=80',
  },
  {
    id: '2',
    brand: 'NovaTech',
    name: 'Nova Watch Series 5',
    price: 189,
    oldPrice: 219,
    discount: '-14%',
    rating: 5,
    reviews: 892,
    image:
      'https://images.unsplash.com/photo-1523275335684-37898b6baf30?auto=format&fit=crop&w=600&q=80',
  },
  {
    id: '3',
    brand: 'UrbanX',
    name: 'UrbanX Runner Sneakers',
    price: 129,
    oldPrice: 149,
    discount: '-13%',
    rating: 5,
    reviews: 341,
    image:
      'https://images.unsplash.com/photo-1542291026-7eec264c27ff?auto=format&fit=crop&w=600&q=80',
  },
];

export default function FavouriteScreen() {
  const router = useRouter();
  const [favourites, setFavourites] = useState<FavouriteItem[]>(MOCK_FAVOURITES);
  const [cartCount, setCartCount] = useState<number>(1);

  const removeFavourite = useCallback((id: string) => {
    setFavourites((prev) => prev.filter((item) => item.id !== id));
  }, []);

  const addToCart = useCallback(() => {
    setCartCount((prev) => prev + 1);
  }, []);

  const goToHome = useCallback(() => {
    router.push('/(tabs)/home');
  }, [router]);

  const countLabel = `${favourites.length} sản phẩm đã lưu`;

  const renderStars = (rating: number) =>
    Array.from({ length: 5 }).map((_, index) => (
      <Ionicons
        key={`star-${index}`}
        name={index < rating ? 'star' : 'star-outline'}
        size={11}
        color={index < rating ? colors.primary : colors.border}
        style={styles.star}
      />
    ));

  const renderItem = ({ item }: { item: FavouriteItem }) => (
    <Pressable
      style={styles.card}
      onPress={() => router.push({ pathname: '/product/[id]', params: { id: item.id } })}
    >
      <View style={styles.imageWrapper}>
        <Image
          source={{ uri: item.image }}
          style={styles.image}
          resizeMode="contain"
        />

        {item.discount ? (
          <View style={styles.saleBadge}>
            <Text style={styles.saleBadgeText}>{item.discount}</Text>
          </View>
        ) : null}

        <Pressable
          style={styles.heartButton}
          hitSlop={8}
          onPress={() => removeFavourite(item.id)}
        >
          <Ionicons name="heart" size={16} color={colors.primary} />
        </Pressable>
      </View>

      <Text style={styles.brandText}>{item.brand}</Text>
      <Text style={styles.nameText} numberOfLines={2}>
        {item.name}
      </Text>

      <View style={styles.ratingRow}>
        <View style={styles.starsWrapper}>{renderStars(item.rating)}</View>
        <Text style={styles.reviewsText}>({item.reviews})</Text>
      </View>

      <View style={styles.bottomRow}>
        <View style={styles.priceColumn}>
          <Text style={styles.priceText}>${item.price}</Text>
          {item.oldPrice ? (
            <Text style={styles.oldPriceText}>${item.oldPrice}</Text>
          ) : null}
        </View>

        <Pressable
          style={styles.addButton}
          hitSlop={6}
          onPress={addToCart}
        >
          <Ionicons name="add" size={20} color="#FFFFFF" />
        </Pressable>
      </View>
    </Pressable>
  );

  return (
    <SafeAreaView style={styles.safeArea} edges={['top', 'left', 'right']}>
      <View style={styles.header}>
        <View style={styles.headerTextBlock}>
          <Text style={styles.headerTitle}>Yêu thích</Text>
          <Text style={styles.headerSubtitle}>{countLabel}</Text>
        </View>

        <Pressable style={styles.cartButton} onPress={() => router.push('/cart')}>
          <Ionicons name="cart-outline" size={20} color="#FFFFFF" />
          {cartCount > 0 ? (
            <View style={styles.cartBadge}>
              <Text style={styles.cartBadgeText}>
                {cartCount > 9 ? '9+' : cartCount}
              </Text>
            </View>
          ) : null}
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
          <View style={styles.emptyState}>
            <View style={styles.emptyIconCircle}>
              <Ionicons name="heart-outline" size={38} color={colors.primary} />
            </View>
            <Text style={styles.emptyTitle}>Chưa có sản phẩm yêu thích</Text>
            <Text style={styles.emptySubtitle}>
              Bấm vào biểu tượng trái tim ở bất kỳ sản phẩm nào để lưu lại tại đây.
            </Text>
            <Pressable style={styles.exploreButton} onPress={goToHome}>
              <Text style={styles.exploreButtonText}>Khám phá sản phẩm</Text>
            </Pressable>
          </View>
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
    paddingTop: 12,
    paddingBottom: 14,
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
    color: '#9AA0A6',
  },
  cartButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
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
    color: '#FFFFFF',
  },
  listContent: {
    paddingHorizontal: HORIZONTAL_PADDING,
    paddingBottom: 32,
  },
  emptyListContent: {
    flexGrow: 1,
    justifyContent: 'center',
  },
  columnWrapper: {
    gap: GRID_GAP,
    marginBottom: 12,
    justifyContent: 'flex-start',
  },
  card: {
    // ĐẶT CỐ ĐỊNH KÍCH THƯỚC ĐỂ KHÔNG BAO GIỜ BỊ DÃN HẾT HÀNG KHI LÀ SỐ LẺ
    width: CARD_WIDTH,
    maxWidth: CARD_WIDTH,
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    borderWidth: 1,
    borderColor: colors.border,
    padding: 8,
    shadowColor: '#1A1A1A',
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.05,
    shadowRadius: 10,
    elevation: 2,
  },
  imageWrapper: {
    height: 116,
    borderRadius: 12,
    backgroundColor: '#F3F4F6',
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
    top: 8,
    left: 8,
    backgroundColor: colors.primary,
    borderRadius: 7,
    paddingHorizontal: 7,
    paddingVertical: 3,
  },
  saleBadgeText: {
    fontSize: 10,
    fontWeight: '700',
    color: '#FFFFFF',
  },
  heartButton: {
    position: 'absolute',
    top: 6,
    right: 6,
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: '#FFFFFF',
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  brandText: {
    marginTop: 8,
    fontSize: 11,
    fontWeight: '600',
    color: '#9AA0A6',
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
  starsWrapper: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  star: {
    marginRight: 1,
  },
  reviewsText: {
    marginLeft: 4,
    fontSize: 10,
    color: '#9AA0A6',
    fontWeight: '500',
  },
  bottomRow: {
    marginTop: 8,
    flexDirection: 'row',
    alignItems: 'flex-end',
    justifyContent: 'space-between',
  },
  priceColumn: {
    flexDirection: 'row',
    alignItems: 'baseline',
    gap: 6,
  },
  priceText: {
    fontSize: 16,
    fontWeight: '800',
    color: colors.dark,
  },
  oldPriceText: {
    fontSize: 11,
    fontWeight: '500',
    color: '#B0B5BC',
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
  emptyState: {
    alignItems: 'center',
    paddingHorizontal: 24,
    paddingVertical: 48,
  },
  emptyIconCircle: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: '#FFF2EB',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 16,
  },
  emptyTitle: {
    fontSize: 18,
    fontWeight: '800',
    color: colors.dark,
    marginBottom: 6,
  },
  emptySubtitle: {
    fontSize: 13,
    color: '#8E9299',
    textAlign: 'center',
    lineHeight: 19,
    marginBottom: 20,
  },
  exploreButton: {
    backgroundColor: colors.primary,
    paddingHorizontal: 22,
    paddingVertical: 12,
    borderRadius: 14,
  },
  exploreButtonText: {
    color: '#FFFFFF',
    fontWeight: '700',
    fontSize: 14,
  },
});
