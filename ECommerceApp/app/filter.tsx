import React, { useRef, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { colors, radius, spacing } from '../src/constants/theme';
import { useProductFilter } from '../src/context/ProductFilterContext';
import { CatalogService } from '../src/services/catalog.service';
import type { Paged } from '../src/services/catalog.service';
import { useAsync } from '../src/hooks/useAsync';
import { useDebounce } from '../src/hooks/useDebounce';
import { PrimaryButton, SecondaryButton } from '../src/components/Button';
import type { Category, Brand, Product } from '../src/types';

type IoniconName = keyof typeof Ionicons.glyphMap;

interface OptionChipProps {
  label: string;
  selected?: boolean;
  onPress: () => void;
  icon?: IoniconName;
}

/** Chip lọc touch target >= 44, style theo theme. */
function OptionChip({ label, selected, onPress, icon }: OptionChipProps) {
  return (
    <Pressable
      onPress={onPress}
      style={({ pressed }) => [
        styles.optionChip,
        selected && styles.optionChipSelected,
        pressed && styles.pressed,
      ]}
      accessibilityRole="button"
      accessibilityState={{ selected }}
      accessibilityLabel={label}
    >
      {icon ? (
        <Ionicons
          name={icon}
          size={14}
          color={selected ? colors.white : colors.star}
          style={styles.optionChipIcon}
        />
      ) : null}
      <Text style={[styles.optionChipText, selected && styles.optionChipTextSelected]}>
        {label}
      </Text>
    </Pressable>
  );
}

const RATING_OPTIONS: { label: string; value: number | null }[] = [
  { label: 'Tất cả', value: null },
  { label: '3+ sao', value: 3 },
  { label: '4+ sao', value: 4 },
  { label: '4.5+ sao', value: 4.5 },
];

export default function FilterScreen() {
  const router = useRouter();
  const { filters, applyFilters } = useProductFilter();

  // Danh mục + thương hiệu lấy từ mock service.
  const categoriesResponse = useAsync<Category[]>(() => CatalogService.getCategories(), []);
  const brandsResponse = useAsync<Brand[]>(() => CatalogService.getBrands(), []);

  // Local state khởi tạo từ context để mở lại filter đúng bộ lọc hiện tại.
  const [draftCategoryIds, setDraftCategoryIds] = useState<string[]>(filters.categoryIds);
  const [draftBrandIds, setDraftBrandIds] = useState<string[]>(filters.brandIds);
  const [draftMinPrice, setDraftMinPrice] = useState(
    filters.minPrice != null ? String(filters.minPrice) : '',
  );
  const [draftMaxPrice, setDraftMaxPrice] = useState(
    filters.maxPrice != null ? String(filters.maxPrice) : '',
  );
  const [draftMinRating, setDraftMinRating] = useState<number | null>(filters.minRating);

  // Tránh bấm đúp nút áp dụng.
  const applyingRef = useRef(false);

  const debouncedMinPrice = useDebounce(draftMinPrice, 300);
  const debouncedMaxPrice = useDebounce(draftMaxPrice, 300);

  // Đếm số sản phẩm theo bộ lọc đang draft.
  const countResponse = useAsync<Paged<Product>>(
    () =>
      CatalogService.getProducts({
        categories: draftCategoryIds,
        brands: draftBrandIds,
        minPrice: debouncedMinPrice ? Number(debouncedMinPrice) : null,
        maxPrice: debouncedMaxPrice ? Number(debouncedMaxPrice) : null,
        minRating: draftMinRating,
        sort: 'popular',
        page: 1,
        limit: 1,
      }),
    [draftCategoryIds, draftBrandIds, debouncedMinPrice, debouncedMaxPrice, draftMinRating],
  );

  const toggleCategory = (id: string) => {
    setDraftCategoryIds((prev) =>
      prev.includes(id) ? prev.filter((cid) => cid !== id) : [...prev, id],
    );
  };

  const toggleBrand = (id: string) => {
    setDraftBrandIds((prev) =>
      prev.includes(id) ? prev.filter((bid) => bid !== id) : [...prev, id],
    );
  };

  const handleReset = () => {
    setDraftMinPrice('');
    setDraftMaxPrice('');
    setDraftCategoryIds([]);
    setDraftBrandIds([]);
    setDraftMinRating(null);
  };

  const handleApply = () => {
    if (applyingRef.current) return;

    const minRaw = debouncedMinPrice.trim();
    const maxRaw = debouncedMaxPrice.trim();

    if (minRaw || maxRaw) {
      const minNum = minRaw ? Number(minRaw) : null;
      const maxNum = maxRaw ? Number(maxRaw) : null;

      if ((minRaw && (minNum === null || Number.isNaN(minNum))) ||
          (maxRaw && (maxNum === null || Number.isNaN(maxNum)))) {
        Alert.alert('Giá không hợp lệ', 'Vui lòng nhập số hợp lệ cho khoảng giá.');
        return;
      }

      if (minNum !== null && maxNum !== null && minNum > maxNum) {
        Alert.alert('Giá không hợp lệ', 'Giá tối thiểu không được lớn hơn giá tối đa.');
        return;
      }
    }

    applyingRef.current = true;

    applyFilters({
      categoryIds: draftCategoryIds,
      brandIds: draftBrandIds,
      minPrice: minRaw ? Number(minRaw) : null,
      maxPrice: maxRaw ? Number(maxRaw) : null,
      minRating: draftMinRating,
    });

    router.back();
  };

  const categories = categoriesResponse.data ?? [];
  const brands = brandsResponse.data ?? [];

  const applyButtonTitle = 'Áp dụng';

  return (
    <View style={styles.backdrop}>
      <Pressable
        style={styles.dimTouchable}
        accessibilityLabel="Đóng bộ lọc"
        onPress={() => router.back()}
      />

      <SafeAreaView style={styles.sheetContainer} edges={['bottom']}>
        <KeyboardAvoidingView
          behavior={Platform.OS === 'ios' ? 'padding' : undefined}
          style={styles.sheetContent}
        >
          {/* Header */}
          <View style={styles.header}>
            <Text style={styles.headerTitle}>Bộ lọc tìm kiếm</Text>
            <Pressable
              style={({ pressed }) => [styles.closeBtn, pressed && styles.pressed]}
              onPress={() => router.back()}
              accessibilityRole="button"
              accessibilityLabel="Đóng bộ lọc"
            >
              <Ionicons name="close" size={20} color={colors.dark} />
            </Pressable>
          </View>

          <ScrollView
            style={styles.scroll}
            contentContainerStyle={styles.scrollContent}
            showsVerticalScrollIndicator={false}
          >
            {/* Khoảng giá */}
            <Text style={styles.sectionTitle}>Khoảng giá ($)</Text>
            <View style={styles.priceRow}>
              <View style={styles.priceInputWrap}>
                <Text style={styles.pricePrefix}>$</Text>
                <TextInput
                  style={styles.priceInput}
                  placeholder="Tối thiểu"
                  placeholderTextColor={colors.placeholder}
                  keyboardType="numeric"
                  value={draftMinPrice}
                  onChangeText={setDraftMinPrice}
                  accessibilityLabel="Giá tối thiểu"
                />
              </View>
              <Text style={styles.priceDash}>—</Text>
              <View style={styles.priceInputWrap}>
                <Text style={styles.pricePrefix}>$</Text>
                <TextInput
                  style={styles.priceInput}
                  placeholder="Tối đa"
                  placeholderTextColor={colors.placeholder}
                  keyboardType="numeric"
                  value={draftMaxPrice}
                  onChangeText={setDraftMaxPrice}
                  accessibilityLabel="Giá tối đa"
                />
              </View>
            </View>

            {/* Danh mục */}
            <Text style={styles.sectionTitle}>Danh mục</Text>
            {categoriesResponse.loading ? (
              <ActivityIndicator color={colors.primary} style={styles.optionsLoading} />
            ) : (
              <View style={styles.chipsContainer}>
                {categories.map((cat) => (
                  <OptionChip
                    key={cat.id}
                    label={cat.name}
                    selected={draftCategoryIds.includes(cat.id)}
                    onPress={() => toggleCategory(cat.id)}
                  />
                ))}
              </View>
            )}

            {/* Thương hiệu */}
            <Text style={styles.sectionTitle}>Thương hiệu</Text>
            {brandsResponse.loading ? (
              <ActivityIndicator color={colors.primary} style={styles.optionsLoading} />
            ) : (
              <View style={styles.chipsContainer}>
                {brands.map((brand) => (
                  <OptionChip
                    key={brand.id}
                    label={brand.name}
                    selected={draftBrandIds.includes(brand.id)}
                    onPress={() => toggleBrand(brand.id)}
                  />
                ))}
              </View>
            )}

            {/* Đánh giá tối thiểu */}
            <Text style={styles.sectionTitle}>Đánh giá tối thiểu</Text>
            <View style={styles.chipsContainer}>
              {RATING_OPTIONS.map((r) => (
                <OptionChip
                  key={r.label}
                  label={r.label}
                  selected={draftMinRating === r.value}
                  onPress={() => setDraftMinRating(r.value)}
                  icon={r.value != null ? 'star' : undefined}
                />
              ))}
            </View>
          </ScrollView>

          {/* Footer nút bấm */}
          <View style={styles.footer}>
            <SecondaryButton
              title="Thiết lập lại"
              onPress={handleReset}
              style={styles.clearBtn}
            />
            <PrimaryButton
              title={applyButtonTitle}
              onPress={handleApply}
              loading={countResponse.loading}
              disabled={countResponse.loading}
              style={styles.applyBtn}
            />
          </View>
        </KeyboardAvoidingView>
      </SafeAreaView>
    </View>
  );
}

const styles = StyleSheet.create({
  backdrop: {
    flex: 1,
    backgroundColor: colors.overlay,
    justifyContent: 'flex-end',
  },
  dimTouchable: {
    flex: 1,
  },
  sheetContainer: {
    backgroundColor: colors.card,
    borderTopLeftRadius: radius.xl,
    borderTopRightRadius: radius.xl,
    maxHeight: '85%',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: -4 },
    shadowOpacity: 0.15,
    shadowRadius: 16,
    elevation: 10,
  },
  sheetContent: {
    flexShrink: 1,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: spacing.xl,
    paddingTop: spacing.md,
    paddingBottom: spacing.md,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: colors.border,
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: '800',
    color: colors.dark,
  },
  closeBtn: {
    width: 44,
    height: 44,
    borderRadius: radius.md,
    backgroundColor: colors.background,
    alignItems: 'center',
    justifyContent: 'center',
  },
  pressed: {
    opacity: 0.8,
  },
  scroll: {
    flexShrink: 1,
  },
  scrollContent: {
    paddingHorizontal: spacing.xl,
    paddingTop: spacing.md,
    paddingBottom: spacing.xl,
  },
  sectionTitle: {
    fontSize: 14,
    fontWeight: '700',
    color: colors.dark,
    marginTop: spacing.xl,
    marginBottom: spacing.sm,
  },
  priceRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
  },
  priceInputWrap: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.background,
    borderRadius: radius.md,
    borderWidth: 1,
    borderColor: colors.border,
    paddingHorizontal: spacing.md,
    height: 48,
  },
  pricePrefix: {
    fontSize: 16,
    fontWeight: '700',
    color: colors.textMuted,
    marginRight: spacing.xs,
  },
  priceInput: {
    flex: 1,
    fontSize: 15,
    color: colors.dark,
    paddingVertical: 0,
  },
  priceDash: {
    fontSize: 18,
    color: colors.grayLight,
  },
  chipsContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.sm,
    marginTop: spacing.md,
  },
  optionsLoading: {
    marginVertical: spacing.md,
  },
  optionChip: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    minHeight: 44,
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.sm,
    borderRadius: radius.pill,
    backgroundColor: colors.background,
    borderWidth: 1,
    borderColor: colors.border,
  },
  optionChipSelected: {
    backgroundColor: colors.dark,
    borderColor: colors.dark,
  },
  optionChipText: {
    fontSize: 13,
    fontWeight: '600',
    color: colors.textSecondary,
  },
  optionChipTextSelected: {
    color: colors.white,
  },
  optionChipIcon: {
    marginRight: spacing.xs,
  },
  footer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
    paddingHorizontal: spacing.xl,
    paddingTop: spacing.md,
    paddingBottom: spacing.xl,
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: colors.border,
    backgroundColor: colors.card,
  },
  clearBtn: {
    flex: 1,
  },
  applyBtn: {
    flex: 2,
  },
});
