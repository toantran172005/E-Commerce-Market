import React, { useState, useMemo } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  TextInput,
  KeyboardAvoidingView,
  Platform,
  Alert,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { colors } from '../src/constants/theme';

const CATEGORIES = [
  { id: 'Audio', name: 'Âm thanh' },
  { id: 'Phones', name: 'Điện thoại' },
  { id: 'Laptops', name: 'Laptop' },
  { id: 'Accessories', name: 'Phụ kiện' },
];

const BRANDS = ['AuraSound', 'Pulse', 'Stratus', 'Tempo', 'Vortex'];

const RATINGS = [
  { label: 'Tất cả', stars: 0 },
  { label: '3+ sao', stars: 3 },
  { label: '4+ sao', stars: 4 },
  { label: '4.5+ sao', stars: 4.5 },
];

export default function FilterScreen() {
  const router = useRouter();

  const [minPrice, setMinPrice] = useState('');
  const [maxPrice, setMaxPrice] = useState('');
  const [selectedCategories, setSelectedCategories] = useState<string[]>(['Audio']);
  const [selectedBrands, setSelectedBrands] = useState<string[]>(['AuraSound']);
  const [selectedRating, setSelectedRating] = useState(RATINGS[0]);

  const toggleCategory = (id: string) => {
    setSelectedCategories((prev) =>
      prev.includes(id) ? prev.filter((c) => c !== id) : [...prev, id]
    );
  };

  const toggleBrand = (b: string) => {
    setSelectedBrands((prev) =>
      prev.includes(b) ? prev.filter((item) => item !== b) : [...prev, b]
    );
  };

  const handleReset = () => {
    setMinPrice('');
    setMaxPrice('');
    setSelectedCategories([]);
    setSelectedBrands([]);
    setSelectedRating(RATINGS[0]);
  };

  const handleApply = () => {
    Alert.alert(
      'Áp dụng bộ lọc thành công',
      `Đã lọc: ${selectedCategories.join(', ') || 'Tất cả danh mục'}\nThương hiệu: ${selectedBrands.join(', ') || 'Tất cả'}\nKhoảng giá: $${minPrice || '0'} - $${maxPrice || '∞'}`
    );
    router.back();
  };

  const resultCount = useMemo(() => {
    let count = 5;
    if (selectedCategories.length > 0) count = selectedCategories.length * 2;
    if (minPrice || maxPrice) count = Math.max(1, count - 1);
    return count;
  }, [selectedCategories, selectedBrands, selectedRating, minPrice, maxPrice]);

  return (
    <View style={styles.backdrop}>
      <TouchableOpacity
        style={styles.dimTouchable}
        activeOpacity={1}
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
            <TouchableOpacity
              style={styles.closeBtn}
              activeOpacity={0.7}
              onPress={() => router.back()}
            >
              <Ionicons name="close" size={20} color={colors.dark} />
            </TouchableOpacity>
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
                <Text style={styles.priceSymbol}>$</Text>
                <TextInput
                  style={styles.priceInput}
                  placeholder="Tối thiểu"
                  placeholderTextColor="#9AA0A6"
                  keyboardType="numeric"
                  value={minPrice}
                  onChangeText={setMinPrice}
                />
              </View>
              <Text style={styles.priceDash}>—</Text>
              <View style={styles.priceInputWrap}>
                <Text style={styles.priceSymbol}>$</Text>
                <TextInput
                  style={styles.priceInput}
                  placeholder="Tối đa"
                  placeholderTextColor="#9AA0A6"
                  keyboardType="numeric"
                  value={maxPrice}
                  onChangeText={setMaxPrice}
                />
              </View>
            </View>

            {/* Danh mục */}
            <Text style={styles.sectionTitle}>Danh mục</Text>
            <View style={styles.chipsContainer}>
              {CATEGORIES.map((cat) => {
                const active = selectedCategories.includes(cat.id);
                return (
                  <TouchableOpacity
                    key={cat.id}
                    style={[styles.chip, active && styles.chipActive]}
                    activeOpacity={0.8}
                    onPress={() => toggleCategory(cat.id)}
                  >
                    <Text style={[styles.chipText, active && styles.chipTextActive]}>
                      {cat.name}
                    </Text>
                  </TouchableOpacity>
                );
              })}
            </View>

            {/* Thương hiệu */}
            <Text style={styles.sectionTitle}>Thương hiệu</Text>
            <View style={styles.chipsContainer}>
              {BRANDS.map((brand) => {
                const active = selectedBrands.includes(brand);
                return (
                  <TouchableOpacity
                    key={brand}
                    style={[styles.chip, active && styles.chipActive]}
                    activeOpacity={0.8}
                    onPress={() => toggleBrand(brand)}
                  >
                    <Text style={[styles.chipText, active && styles.chipTextActive]}>
                      {brand}
                    </Text>
                  </TouchableOpacity>
                );
              })}
            </View>

            {/* Đánh giá */}
            <Text style={styles.sectionTitle}>Đánh giá tối thiểu</Text>
            <View style={styles.chipsContainer}>
              {RATINGS.map((r) => {
                const active = selectedRating.stars === r.stars;
                return (
                  <TouchableOpacity
                    key={r.label}
                    style={[styles.chip, active && styles.chipActiveRating]}
                    activeOpacity={0.8}
                    onPress={() => setSelectedRating(r)}
                  >
                    <Ionicons
                      name="star"
                      size={14}
                      color={active ? colors.white : '#FFB800'}
                      style={{ marginRight: 4 }}
                    />
                    <Text style={[styles.chipText, active && styles.chipTextActive]}>
                      {r.label}
                    </Text>
                  </TouchableOpacity>
                );
              })}
            </View>
          </ScrollView>

          {/* Footer nút bấm */}
          <View style={styles.footer}>
            <TouchableOpacity
              style={styles.clearBtn}
              activeOpacity={0.8}
              onPress={handleReset}
            >
              <Text style={styles.clearBtnText}>Thiết lập lại</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.applyBtn}
              activeOpacity={0.85}
              onPress={handleApply}
            >
              <Text style={styles.applyBtnText}>
                Áp dụng bộ lọc ({resultCount})
              </Text>
            </TouchableOpacity>
          </View>
        </KeyboardAvoidingView>
      </SafeAreaView>
    </View>
  );
}

const styles = StyleSheet.create({
  backdrop: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.45)',
    justifyContent: 'flex-end',
  },
  dimTouchable: {
    flex: 1,
  },
  sheetContainer: {
    backgroundColor: '#FFFFFF',
    borderTopLeftRadius: 28,
    borderTopRightRadius: 28,
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
    paddingHorizontal: 22,
    paddingTop: 18,
    paddingBottom: 14,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: colors.border,
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: '800',
    color: colors.dark,
  },
  closeBtn: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: '#F3F4F6',
    alignItems: 'center',
    justifyContent: 'center',
  },
  scroll: {
    flexShrink: 1,
  },
  scrollContent: {
    paddingHorizontal: 22,
    paddingTop: 14,
    paddingBottom: 24,
  },
  sectionTitle: {
    fontSize: 14,
    fontWeight: '700',
    color: colors.dark,
    marginTop: 18,
    marginBottom: 10,
  },
  priceRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  priceInputWrap: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F8F9FB',
    borderRadius: 14,
    borderWidth: 1,
    borderColor: colors.border,
    paddingHorizontal: 12,
    height: 48,
  },
  priceSymbol: {
    fontSize: 16,
    fontWeight: '700',
    color: '#8E9299',
    marginRight: 6,
  },
  priceInput: {
    flex: 1,
    fontSize: 15,
    color: colors.dark,
    paddingVertical: 0,
  },
  priceDash: {
    fontSize: 18,
    color: '#C4C9D0',
  },
  chipsContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
  },
  chip: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 20,
    backgroundColor: '#F8F9FB',
    borderWidth: 1,
    borderColor: colors.border,
  },
  chipActive: {
    backgroundColor: colors.dark,
    borderColor: colors.dark,
  },
  chipActiveRating: {
    backgroundColor: colors.primary,
    borderColor: colors.primary,
  },
  chipText: {
    fontSize: 13,
    fontWeight: '600',
    color: '#4B5563',
  },
  chipTextActive: {
    color: '#FFFFFF',
  },
  footer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    paddingHorizontal: 22,
    paddingTop: 14,
    paddingBottom: 20,
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: colors.border,
    backgroundColor: '#FFFFFF',
  },
  clearBtn: {
    flex: 1,
    height: 50,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: colors.border,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#FFFFFF',
  },
  clearBtnText: {
    fontSize: 14,
    fontWeight: '700',
    color: colors.dark,
  },
  applyBtn: {
    flex: 2,
    height: 50,
    borderRadius: 16,
    backgroundColor: colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: colors.primary,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 4,
  },
  applyBtnText: {
    fontSize: 14,
    fontWeight: '800',
    color: colors.white,
  },
});
