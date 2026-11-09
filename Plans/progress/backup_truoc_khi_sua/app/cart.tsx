import React, { useMemo, useState } from 'react';
import {
  KeyboardAvoidingView,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { Colors } from '../src/constants/theme';

/* ------------------------------------------------------------------ */
/*  Theme fallbacks                                                    */
/* ------------------------------------------------------------------ */

const palette = {
  primary: Colors?.primary ?? '#FF5722',
  primarySoft: '#FFB39A',
  dark: Colors?.dark ?? '#1A1A1A',
  background: Colors?.background ?? '#F8F9FB',
  border: Colors?.border ?? '#ECEEF1',
  gray: '#8A8F98',
  grayLight: '#A0A4AB',
  white: '#FFFFFF',
  placeholderBg: '#EFEFF2',
  chipBg: '#F4F5F7',
};

/* ------------------------------------------------------------------ */
/*  Types & mock data                                                  */
/* ------------------------------------------------------------------ */

type CartItem = {
  id: string;
  brand: string;
  name: string;
  variant: string;
  price: number;
  originalPrice: number;
  quantity: number;
  selected: boolean;
};

const INITIAL_CART: CartItem[] = [
  {
    id: 'aura-1',
    brand: 'AuraSound',
    name: 'AuraBeats Pro Wireless',
    variant: 'Carbon Black · Standard',
    price: 249,
    originalPrice: 299,
    quantity: 1,
    selected: true,
  },
];

const SHIPPING_FEE = 5;

/* ------------------------------------------------------------------ */
/*  Helpers                                                            */
/* ------------------------------------------------------------------ */

const formatMoney = (value: number) => `$${value.toFixed(2)}`;

/* ------------------------------------------------------------------ */
/*  Screen                                                             */
/* ------------------------------------------------------------------ */

export default function CartScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();

  const [items, setItems] = useState<CartItem[]>(INITIAL_CART);
  const [promoCode, setPromoCode] = useState('');
  const [appliedPromo, setAppliedPromo] = useState<string | null>(null);

  const itemCount = items.length;

  const subtotal = useMemo(
    () =>
      items
        .filter((item) => item.selected)
        .reduce((sum, item) => sum + item.price * item.quantity, 0),
    [items]
  );

  const total = subtotal + SHIPPING_FEE;

  const toggleSelect = (id: string) => {
    setItems((prev) =>
      prev.map((item) =>
        item.id === id ? { ...item, selected: !item.selected } : item
      )
    );
  };

  const changeQuantity = (id: string, delta: number) => {
    setItems((prev) =>
      prev.map((item) =>
        item.id === id
          ? { ...item, quantity: Math.max(1, Math.min(10, item.quantity + delta)) }
          : item
      )
    );
  };

  const removeItem = (id: string) => {
    setItems((prev) => prev.filter((item) => item.id !== id));
  };

  const handleApplyPromo = () => {
    const code = promoCode.trim().toUpperCase();
    if (!code) {
      setAppliedPromo(null);
      return;
    }
    setAppliedPromo(code);
  };

  const handleCheckout = () => {
    router.push("/checkout");
  };

  return (
    <SafeAreaView style={styles.safeArea} edges={['top']}>
      <View style={styles.header}>
        <Pressable
          onPress={() => router.back()}
          style={({ pressed }) => [styles.backButton, pressed && styles.pressed]}
          hitSlop={8}
        >
          <Ionicons name="arrow-back" size={20} color={palette.dark} />
        </Pressable>

        <View style={styles.headerTitleWrapper}>
          <Text style={styles.headerTitle}>My Cart</Text>
          <Text style={styles.headerSubtitle}>
            {itemCount} item{itemCount === 1 ? '' : 's'}
          </Text>
        </View>
      </View>

      <KeyboardAvoidingView
        style={styles.flex}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        keyboardVerticalOffset={Platform.OS === 'ios' ? 8 : 0}
      >
        <ScrollView
          style={styles.flex}
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled"
        >
          {/* ---------------- Cart items ---------------- */}
          {items.length === 0 ? (
            <View style={styles.emptyCard}>
              <View style={styles.emptyIconCircle}>
                <Ionicons name="cart-outline" size={26} color={palette.grayLight} />
              </View>
              <Text style={styles.emptyTitle}>Your cart is empty</Text>
              <Text style={styles.emptySubtitle}>
                Looks like you haven&apos;t added anything yet.
              </Text>
            </View>
          ) : (
            items.map((item) => (
              <View key={item.id} style={styles.itemCard}>
                {/* checkbox */}
                <Pressable
                  onPress={() => toggleSelect(item.id)}
                  hitSlop={8}
                  style={[
                    styles.checkbox,
                    item.selected && {
                      backgroundColor: palette.primary,
                      borderColor: palette.primary,
                    },
                  ]}
                >
                  {item.selected && (
                    <Ionicons name="checkmark" size={15} color={palette.white} />
                  )}
                </Pressable>

                {/* product image placeholder */}
                <View style={styles.productImage}>
                  <Ionicons name="headset" size={40} color="#6E737C" />
                </View>

                {/* details */}
                <View style={styles.itemDetails}>
                  <Text style={styles.brand}>{item.brand}</Text>
                  <Text style={styles.itemName} numberOfLines={2}>
                    {item.name}
                  </Text>
                  <Text style={styles.variant}>{item.variant}</Text>

                  <View style={styles.priceRow}>
                    <View style={styles.priceBlock}>
                      <Text style={styles.price}>{`$${item.price}`}</Text>
                      <Text style={styles.originalPrice}>{`$${item.originalPrice}`}</Text>
                    </View>

                    <View style={styles.itemActions}>
                      <Pressable
                        onPress={() => removeItem(item.id)}
                        style={({ pressed }) => [
                          styles.trashButton,
                          pressed && styles.pressed,
                        ]}
                        hitSlop={6}
                      >
                        <Ionicons
                          name="trash-outline"
                          size={16}
                          color={palette.gray}
                        />
                      </Pressable>

                      <View style={styles.stepper}>
                        <Pressable
                          onPress={() => changeQuantity(item.id, -1)}
                          style={({ pressed }) => [
                            styles.stepperButton,
                            pressed && styles.pressed,
                          ]}
                          hitSlop={4}
                        >
                          <Ionicons name="remove" size={16} color={palette.dark} />
                        </Pressable>

                        <Text style={styles.stepperValue}>{item.quantity}</Text>

                        <Pressable
                          onPress={() => changeQuantity(item.id, 1)}
                          style={({ pressed }) => [
                            styles.stepperButton,
                            pressed && styles.pressed,
                          ]}
                          hitSlop={4}
                        >
                          <Ionicons name="add" size={16} color={palette.dark} />
                        </Pressable>
                      </View>
                    </View>
                  </View>
                </View>
              </View>
            ))
          )}

          {/* ---------------- Promo code ---------------- */}
          <View style={styles.promoRow}>
            <View style={styles.promoInputWrapper}>
              <Ionicons name="pricetag-outline" size={17} color={palette.grayLight} />
              <TextInput
                value={promoCode}
                onChangeText={setPromoCode}
                onSubmitEditing={handleApplyPromo}
                placeholder="ENTER PROMO CODE"
                placeholderTextColor={palette.grayLight}
                autoCapitalize="characters"
                autoCorrect={false}
                returnKeyType="done"
                style={styles.promoInput}
              />
            </View>

            <Pressable
              onPress={handleApplyPromo}
              style={({ pressed }) => [styles.applyButton, pressed && styles.pressed]}
            >
              <Text style={styles.applyButtonText}>Apply</Text>
            </Pressable>
          </View>

          <Text style={styles.promoHint}>
            Try NOVA10, FLASH20, or WELCOME15
          </Text>

          {appliedPromo && (
            <View style={styles.appliedRow}>
              <Ionicons name="checkmark-circle" size={14} color={palette.primary} />
              <Text style={styles.appliedText}>
                {appliedPromo} applied to your order
              </Text>
            </View>
          )}

          {/* ---------------- Summary ---------------- */}
          <View style={styles.summaryCard}>
            <View style={styles.summaryRow}>
              <Text style={styles.summaryLabel}>Subtotal</Text>
              <Text style={styles.summaryValue}>{formatMoney(subtotal)}</Text>
            </View>

            <View style={styles.summaryRow}>
              <Text style={styles.summaryLabel}>Shipping</Text>
              <Text style={styles.summaryValue}>{formatMoney(SHIPPING_FEE)}</Text>
            </View>

            <View style={styles.divider} />

            <View style={styles.summaryRow}>
              <Text style={styles.totalLabel}>Total</Text>
              <Text style={styles.totalValue}>{formatMoney(total)}</Text>
            </View>
          </View>
        </ScrollView>

        {/* ---------------- Bottom button ---------------- */}
        <View
          style={[
            styles.footer,
            { paddingBottom: Math.max(insets.bottom, 12) + 8 },
          ]}
        >
          <Pressable
            onPress={handleCheckout}
            disabled={items.length === 0}
            style={({ pressed }) => [
              styles.checkoutButton,
              items.length === 0 && styles.checkoutButtonDisabled,
              pressed && styles.pressed,
            ]}
          >
            <Text style={styles.checkoutText}>
              {`Checkout • ${formatMoney(total)}`}
            </Text>
            <Ionicons name="chevron-forward" size={16} color={palette.white} />
          </Pressable>
        </View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

/* ------------------------------------------------------------------ */
/*  Styles                                                             */
/* ------------------------------------------------------------------ */

const styles = StyleSheet.create({
  flex: {
    flex: 1,
  },
  safeArea: {
    flex: 1,
    backgroundColor: palette.background,
  },
  pressed: {
    opacity: 0.65,
  },

  /* header */
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingTop: 10,
    paddingBottom: 18,
    backgroundColor: palette.background,
  },
  backButton: {
    width: 42,
    height: 42,
    borderRadius: 21,
    backgroundColor: palette.white,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#1A1A1A',
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.08,
    shadowRadius: 8,
    elevation: 3,
  },
  headerTitleWrapper: {
    marginLeft: 14,
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: '800',
    color: palette.dark,
    letterSpacing: -0.3,
  },
  headerSubtitle: {
    marginTop: 3,
    fontSize: 12,
    fontWeight: '500',
    color: palette.gray,
  },

  /* scroll content */
  scrollContent: {
    paddingBottom: 24,
  },

  /* cart item card */
  itemCard: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginHorizontal: 20,
    padding: 14,
    backgroundColor: palette.white,
    borderRadius: 20,
    marginBottom: 12,
    shadowColor: '#1A1A1A',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.05,
    shadowRadius: 12,
    elevation: 2,
  },
  checkbox: {
    width: 23,
    height: 23,
    borderRadius: 7,
    borderWidth: 1.6,
    borderColor: '#D5D8DE',
    backgroundColor: palette.white,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 2,
  },
  productImage: {
    width: 84,
    height: 76,
    borderRadius: 14,
    backgroundColor: palette.placeholderBg,
    alignItems: 'center',
    justifyContent: 'center',
    marginLeft: 10,
  },
  itemDetails: {
    flex: 1,
    marginLeft: 12,
  },
  brand: {
    fontSize: 11,
    fontWeight: '600',
    color: palette.grayLight,
    letterSpacing: 0.2,
  },
  itemName: {
    marginTop: 3,
    fontSize: 15,
    fontWeight: '800',
    color: palette.dark,
    letterSpacing: -0.2,
  },
  variant: {
    marginTop: 5,
    fontSize: 11.5,
    fontWeight: '500',
    color: palette.gray,
  },
  priceRow: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    justifyContent: 'space-between',
    marginTop: 8,
  },
  priceBlock: {
    justifyContent: 'flex-end',
  },
  price: {
    fontSize: 17,
    fontWeight: '800',
    color: palette.dark,
    letterSpacing: -0.3,
  },
  originalPrice: {
    marginTop: 1,
    fontSize: 11,
    fontWeight: '500',
    color: palette.grayLight,
    textDecorationLine: 'line-through',
  },
  itemActions: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  trashButton: {
    width: 34,
    height: 34,
    borderRadius: 11,
    borderWidth: 1,
    borderColor: palette.border,
    backgroundColor: palette.white,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 8,
  },
  stepper: {
    flexDirection: 'row',
    alignItems: 'center',
    height: 34,
    borderRadius: 11,
    backgroundColor: palette.chipBg,
    paddingHorizontal: 2,
  },
  stepperButton: {
    width: 30,
    height: 30,
    alignItems: 'center',
    justifyContent: 'center',
  },
  stepperValue: {
    minWidth: 18,
    textAlign: 'center',
    fontSize: 14,
    fontWeight: '700',
    color: palette.dark,
  },

  /* empty state */
  emptyCard: {
    marginHorizontal: 20,
    paddingVertical: 34,
    paddingHorizontal: 20,
    backgroundColor: palette.white,
    borderRadius: 20,
    alignItems: 'center',
    shadowColor: '#1A1A1A',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.05,
    shadowRadius: 12,
    elevation: 2,
  },
  emptyIconCircle: {
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: palette.chipBg,
    alignItems: 'center',
    justifyContent: 'center',
  },
  emptyTitle: {
    marginTop: 14,
    fontSize: 15,
    fontWeight: '800',
    color: palette.dark,
  },
  emptySubtitle: {
    marginTop: 6,
    fontSize: 12,
    fontWeight: '500',
    color: palette.gray,
    textAlign: 'center',
  },

  /* promo */
  promoRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginHorizontal: 20,
    marginTop: 20,
  },
  promoInputWrapper: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    height: 52,
    paddingHorizontal: 15,
    backgroundColor: palette.white,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: palette.border,
    shadowColor: '#1A1A1A',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.03,
    shadowRadius: 6,
    elevation: 1,
  },
  promoInput: {
    flex: 1,
    marginLeft: 9,
    paddingVertical: 0,
    fontSize: 12,
    fontWeight: '700',
    letterSpacing: 1.2,
    color: palette.dark,
  },
  applyButton: {
    height: 52,
    paddingHorizontal: 26,
    marginLeft: 10,
    borderRadius: 16,
    backgroundColor: palette.dark,
    alignItems: 'center',
    justifyContent: 'center',
  },
  applyButtonText: {
    fontSize: 14,
    fontWeight: '700',
    color: palette.white,
  },
  promoHint: {
    marginTop: 10,
    marginLeft: 22,
    fontSize: 12,
    fontWeight: '500',
    color: palette.grayLight,
  },
  appliedRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 8,
    marginLeft: 22,
  },
  appliedText: {
    marginLeft: 6,
    fontSize: 12,
    fontWeight: '600',
    color: palette.primary,
  },

  /* summary */
  summaryCard: {
    marginHorizontal: 20,
    marginTop: 20,
    paddingHorizontal: 20,
    paddingVertical: 18,
    backgroundColor: palette.white,
    borderRadius: 20,
    shadowColor: '#1A1A1A',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.05,
    shadowRadius: 12,
    elevation: 2,
  },
  summaryRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 7,
  },
  summaryLabel: {
    fontSize: 14,
    fontWeight: '500',
    color: palette.gray,
  },
  summaryValue: {
    fontSize: 14.5,
    fontWeight: '700',
    color: palette.dark,
  },
  divider: {
    height: 1,
    backgroundColor: palette.border,
    marginVertical: 10,
  },
  totalLabel: {
    fontSize: 16,
    fontWeight: '800',
    color: palette.dark,
    letterSpacing: -0.2,
  },
  totalValue: {
    fontSize: 20,
    fontWeight: '800',
    color: palette.dark,
    letterSpacing: -0.4,
  },

  /* footer */
  footer: {
    paddingHorizontal: 20,
    paddingTop: 12,
    backgroundColor: palette.background,
    borderTopWidth: 1,
    borderTopColor: palette.border,
  },
  checkoutButton: {
    height: 56,
    borderRadius: 18,
    backgroundColor: palette.primary,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: palette.primary,
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.28,
    shadowRadius: 12,
    elevation: 5,
  },
  checkoutButtonDisabled: {
    backgroundColor: palette.primarySoft,
    shadowOpacity: 0,
    elevation: 0,
  },
  checkoutText: {
    fontSize: 15.5,
    fontWeight: '800',
    color: palette.white,
    letterSpacing: -0.2,
    marginRight: 8,
  },
});