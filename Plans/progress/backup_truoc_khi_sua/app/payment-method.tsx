import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  Platform,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { colors } from '../src/constants/theme';

type IoniconName = React.ComponentProps<typeof Ionicons>['name'];

type PaymentOption = {
  id: string;
  title: string;
  subtitle: string;
  icon: IoniconName;
};

const PAYMENT_OPTIONS: PaymentOption[] = [
  {
    id: 'card',
    title: 'Credit / Debit Card',
    subtitle: 'Visa, Mastercard, JCB',
    icon: 'card-outline',
  },
  {
    id: 'wallet',
    title: 'Apple Pay / Google Pay',
    subtitle: 'Fast checkout with one tap',
    icon: 'wallet-outline',
  },
  {
    id: 'cod',
    title: 'Cash on Delivery',
    subtitle: 'Pay with cash when you receive',
    icon: 'cash-outline',
  },
];

export default function PaymentMethodScreen() {
  const router = useRouter();
  const [selected, setSelected] = useState<string>('card');

  return (
    <SafeAreaView style={styles.safeArea} edges={['top', 'bottom']}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity
          activeOpacity={0.7}
          style={styles.headerButton}
          onPress={() => router.back()}
        >
          <Ionicons name="chevron-back" size={22} color={colors.dark} />
        </TouchableOpacity>

        <Text style={styles.headerTitle}>Payment Method</Text>

        <View style={styles.headerButtonPlaceholder} />
      </View>

      <ScrollView
        style={styles.scroll}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {/* Card mockup */}
        <View style={styles.cardMockup}>
          <View style={styles.cardDecorationOne} />
          <View style={styles.cardDecorationTwo} />

          <View style={styles.cardTopRow}>
            <View style={styles.chip}>
              <View style={styles.chipLine} />
              <View style={styles.chipLine} />
            </View>

            <View style={styles.cardBrandRow}>
              <Text style={styles.cardBrandText}>Mastercard</Text>
              <View style={styles.mastercardLogo}>
                <View style={[styles.logoCircle, styles.logoCircleRed]} />
                <View style={[styles.logoCircle, styles.logoCircleYellow]} />
              </View>
            </View>
          </View>

          <Text style={styles.cardNumber}>**** **** **** 4242</Text>

          <View style={styles.cardBottomRow}>
            <View>
              <Text style={styles.cardLabel}>CARD HOLDER</Text>
              <Text style={styles.cardValue}>ALEX CARTER</Text>
            </View>
            <View style={styles.cardExpiryBlock}>
              <Text style={styles.cardLabel}>EXPIRES</Text>
              <Text style={styles.cardValue}>09 / 28</Text>
            </View>
          </View>

          <View style={styles.defaultBadge}>
            <Ionicons name="checkmark" size={12} color={colors.primary} />
            <Text style={styles.defaultBadgeText}>DEFAULT</Text>
          </View>
        </View>

        {/* Section title */}
        <Text style={styles.sectionTitle}>PAYMENT OPTIONS</Text>

        {/* Options */}
        <View style={styles.optionsWrapper}>
          {PAYMENT_OPTIONS.map((option, index) => {
            const isActive = selected === option.id;
            return (
              <TouchableOpacity
                key={option.id}
                activeOpacity={0.8}
                onPress={() => setSelected(option.id)}
                style={[
                  styles.optionRow,
                  isActive && styles.optionRowActive,
                  index !== PAYMENT_OPTIONS.length - 1 && styles.optionRowSpacing,
                ]}
              >
                <View
                  style={[
                    styles.optionIconBox,
                    isActive && styles.optionIconBoxActive,
                  ]}
                >
                  <Ionicons
                    name={option.icon}
                    size={20}
                    color={isActive ? colors.primary : '#8A8F99'}
                  />
                </View>

                <View style={styles.optionTextBlock}>
                  <Text
                    style={[
                      styles.optionTitle,
                      isActive && styles.optionTitleActive,
                    ]}
                  >
                    {option.title}
                  </Text>
                  <Text style={styles.optionSubtitle}>{option.subtitle}</Text>
                </View>

                <View
                  style={[
                    styles.radioOuter,
                    isActive && styles.radioOuterActive,
                  ]}
                >
                  {isActive ? <View style={styles.radioInner} /> : null}
                </View>
              </TouchableOpacity>
            );
          })}
        </View>

        {/* Saved cards / wallets */}
        <Text style={styles.sectionTitle}>SAVED METHODS</Text>

        <View style={styles.savedCard}>
          <View style={styles.savedCardLeft}>
            <View style={styles.savedCardIcon}>
              <Ionicons name="card" size={18} color={colors.primary} />
            </View>
            <View>
              <Text style={styles.savedCardTitle}>Visa ending in 4242</Text>
              <Text style={styles.savedCardSubtitle}>Expires 09/28</Text>
            </View>
          </View>
          <TouchableOpacity activeOpacity={0.7} style={styles.deleteButton}>
            <Ionicons name="trash-outline" size={16} color={colors.primary} />
          </TouchableOpacity>
        </View>

        <View style={styles.savedCard}>
          <View style={styles.savedCardLeft}>
            <View style={styles.savedCardIcon}>
              <Ionicons name="wallet" size={18} color={colors.primary} />
            </View>
            <View>
              <Text style={styles.savedCardTitle}>MoMo Wallet</Text>
              <Text style={styles.savedCardSubtitle}>alex.carter@novatech</Text>
            </View>
          </View>
          <TouchableOpacity activeOpacity={0.7} style={styles.deleteButton}>
            <Ionicons name="trash-outline" size={16} color={colors.primary} />
          </TouchableOpacity>
        </View>

        {/* Add new card */}
        <TouchableOpacity activeOpacity={0.8} style={styles.addNewCard}>
          <Ionicons name="add" size={18} color={colors.primary} />
          <Text style={styles.addNewCardText}>Add New Card</Text>
        </TouchableOpacity>
      </ScrollView>

      {/* Footer */}
      <View style={styles.footer}>
        <TouchableOpacity
          activeOpacity={0.85}
          style={styles.confirmButton}
          onPress={() => router.back()}
        >
          <Text style={styles.confirmButtonText}>Confirm Payment Method</Text>
          <Ionicons name="arrow-forward" size={18} color="#FFFFFF" />
        </TouchableOpacity>
      </View>
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
    paddingHorizontal: 16,
    paddingVertical: 12,
  },
  headerButton: {
    width: 42,
    height: 42,
    borderRadius: 21,
    backgroundColor: '#FFFFFF',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: colors.border,
  },
  headerButtonPlaceholder: {
    width: 42,
    height: 42,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: colors.dark,
    letterSpacing: -0.2,
  },
  scroll: {
    flex: 1,
  },
  scrollContent: {
    paddingHorizontal: 16,
    paddingBottom: 28,
  },
  cardMockup: {
    backgroundColor: colors.dark,
    borderRadius: 22,
    paddingHorizontal: 20,
    paddingVertical: 22,
    marginTop: 8,
    overflow: 'hidden',
    ...Platform.select({
      ios: {
        shadowColor: '#1A1A1A',
        shadowOffset: { width: 0, height: 10 },
        shadowOpacity: 0.22,
        shadowRadius: 18,
      },
      android: {
        elevation: 6,
      },
    }),
  },
  cardDecorationOne: {
    position: 'absolute',
    top: -70,
    right: -50,
    width: 180,
    height: 180,
    borderRadius: 90,
    backgroundColor: 'rgba(255, 87, 34, 0.16)',
  },
  cardDecorationTwo: {
    position: 'absolute',
    bottom: -80,
    left: -40,
    width: 160,
    height: 160,
    borderRadius: 80,
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
  },
  cardTopRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  chip: {
    width: 42,
    height: 32,
    borderRadius: 7,
    backgroundColor: '#E7C97A',
    justifyContent: 'center',
    paddingHorizontal: 8,
    gap: 5,
  },
  chipLine: {
    height: 2,
    borderRadius: 1,
    backgroundColor: 'rgba(26, 26, 26, 0.35)',
  },
  cardBrandRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  cardBrandText: {
    color: 'rgba(255, 255, 255, 0.72)',
    fontSize: 12,
    fontWeight: '600',
    marginRight: 8,
    letterSpacing: 0.3,
  },
  mastercardLogo: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  logoCircle: {
    width: 22,
    height: 22,
    borderRadius: 11,
  },
  logoCircleRed: {
    backgroundColor: '#EB001B',
  },
  logoCircleYellow: {
    backgroundColor: '#F79E1B',
    marginLeft: -9,
    opacity: 0.92,
  },
  cardNumber: {
    color: '#FFFFFF',
    fontSize: 20,
    fontWeight: '700',
    letterSpacing: 2.4,
    marginTop: 26,
  },
  cardBottomRow: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    justifyContent: 'space-between',
    marginTop: 22,
  },
  cardExpiryBlock: {
    alignItems: 'flex-end',
  },
  cardLabel: {
    color: 'rgba(255, 255, 255, 0.45)',
    fontSize: 9,
    fontWeight: '700',
    letterSpacing: 1,
    marginBottom: 5,
  },
  cardValue: {
    color: '#FFFFFF',
    fontSize: 13,
    fontWeight: '700',
    letterSpacing: 0.6,
  },
  defaultBadge: {
    position: 'absolute',
    top: 66,
    right: 20,
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255, 87, 34, 0.16)',
    paddingHorizontal: 9,
    paddingVertical: 5,
    borderRadius: 20,
  },
  defaultBadgeText: {
    color: colors.primary,
    fontSize: 9,
    fontWeight: '800',
    letterSpacing: 0.8,
    marginLeft: 4,
  },
  sectionTitle: {
    fontSize: 12,
    fontWeight: '700',
    letterSpacing: 1,
    color: '#8A8F99',
    marginTop: 26,
    marginBottom: 12,
    marginLeft: 4,
  },
  optionsWrapper: {
    marginTop: -2,
  },
  optionRow: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    borderWidth: 1,
    borderColor: colors.border,
    paddingHorizontal: 14,
    paddingVertical: 14,
  },
  optionRowActive: {
    borderColor: colors.primary,
    backgroundColor: '#FFF4EF',
  },
  optionRowSpacing: {
    marginBottom: 10,
  },
  optionIconBox: {
    width: 42,
    height: 42,
    borderRadius: 12,
    backgroundColor: '#F2F3F5',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  optionIconBoxActive: {
    backgroundColor: 'rgba(255, 87, 34, 0.12)',
  },
  optionTextBlock: {
    flex: 1,
  },
  optionTitle: {
    fontSize: 15,
    fontWeight: '600',
    color: colors.dark,
    marginBottom: 3,
  },
  optionTitleActive: {
    color: colors.primary,
    fontWeight: '700',
  },
  optionSubtitle: {
    fontSize: 12,
    color: '#8A8F99',
  },
  radioOuter: {
    width: 22,
    height: 22,
    borderRadius: 11,
    borderWidth: 2,
    borderColor: '#D7DAE0',
    alignItems: 'center',
    justifyContent: 'center',
    marginLeft: 8,
  },
  radioOuterActive: {
    borderColor: colors.primary,
  },
  radioInner: {
    width: 10,
    height: 10,
    borderRadius: 5,
    backgroundColor: colors.primary,
  },
  savedCard: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    borderWidth: 1,
    borderColor: colors.border,
    paddingHorizontal: 14,
    paddingVertical: 14,
    marginBottom: 10,
  },
  savedCardLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  savedCardIcon: {
    width: 40,
    height: 40,
    borderRadius: 12,
    backgroundColor: 'rgba(255, 87, 34, 0.1)',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  savedCardTitle: {
    fontSize: 14,
    fontWeight: '700',
    color: colors.dark,
    marginBottom: 3,
  },
  savedCardSubtitle: {
    fontSize: 12,
    color: '#8A8F99',
  },
  deleteButton: {
    width: 34,
    height: 34,
    borderRadius: 10,
    backgroundColor: 'rgba(255, 87, 34, 0.1)',
    alignItems: 'center',
    justifyContent: 'center',
    marginLeft: 10,
  },
  addNewCard: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    height: 54,
    borderRadius: 16,
    borderWidth: 1.5,
    borderStyle: 'dashed',
    borderColor: 'rgba(255, 87, 34, 0.5)',
    backgroundColor: '#FFFFFF',
    marginTop: 8,
  },
  addNewCardText: {
    fontSize: 15,
    fontWeight: '700',
    color: colors.primary,
    marginLeft: 6,
  },
  footer: {
    paddingHorizontal: 16,
    paddingTop: 12,
    paddingBottom: 12,
    backgroundColor: colors.background,
    borderTopWidth: 1,
    borderTopColor: colors.border,
  },
  confirmButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    height: 56,
    borderRadius: 16,
    backgroundColor: colors.primary,
    ...Platform.select({
      ios: {
        shadowColor: colors.primary,
        shadowOffset: { width: 0, height: 8 },
        shadowOpacity: 0.32,
        shadowRadius: 14,
      },
      android: {
        elevation: 5,
      },
    }),
  },
  confirmButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '700',
    letterSpacing: 0.2,
    marginRight: 8,
  },
});