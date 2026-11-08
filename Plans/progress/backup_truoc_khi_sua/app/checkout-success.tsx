import React, { useCallback } from 'react';
import {
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
  ViewStyle,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { colors } from '../src/constants/theme';

type IoniconName = React.ComponentProps<typeof Ionicons>['name'];

type ConfettiDot = {
  color: string;
  size: number;
  style: ViewStyle;
};

type SummaryRow = {
  key: string;
  icon: IoniconName;
  label: string;
  value: string;
};

type StepItem = {
  key: string;
  label: string;
  icon: IoniconName;
  active?: boolean;
};

const CONFETTI: ConfettiDot[] = [
  { color: '#F97316', size: 10, style: { top: 16, left: 96 } },
  { color: '#F97316', size: 10, style: { top: 42, right: 26 } },
  { color: '#EC4899', size: 10, style: { top: 88, left: 8 } },
  { color: '#FB923C', size: 10, style: { top: 124, right: 8 } },
  { color: '#3B82F6', size: 10, style: { bottom: 46, left: 26 } },
  { color: '#22C55E', size: 11, style: { bottom: 40, right: 38 } },
  { color: '#FACC15', size: 9, style: { bottom: 8, left: 92 } },
  { color: '#EF4444', size: 8, style: { top: 62, right: 60 } },
];

const SUMMARY_ROWS: SummaryRow[] = [
  {
    key: 'delivery',
    icon: 'calendar-outline',
    label: 'Estimated Delivery',
    value: 'Oct 27, 2026',
  },
  {
    key: 'items',
    icon: 'cube-outline',
    label: 'Items',
    value: '1 item',
  },
  {
    key: 'total',
    icon: 'card-outline',
    label: 'Total Paid',
    value: '$249.00',
  },
];

const STEPS: StepItem[] = [
  { key: 'ordered', label: 'Ordered', icon: 'checkmark', active: true },
  { key: 'packing', label: 'Packing', icon: 'cube-outline' },
  { key: 'shipping', label: 'Shipping', icon: 'car-outline' },
  { key: 'delivery', label: 'Delivery', icon: 'home-outline' },
];

const ORDER_ID = 'ORD-21530';

export default function CheckoutSuccessScreen() {
  const router = useRouter();

  const handleViewOrderDetails = useCallback(() => {
    router.push({
      pathname: '/order/[id]',
      params: { id: ORDER_ID },
    });
  }, [router]);

  const handleContinueShopping = useCallback(() => {
    router.replace('/(tabs)/home');
  }, [router]);

  return (
    <SafeAreaView style={styles.safeArea} edges={['top', 'bottom']}>
      <ScrollView
        style={styles.scroll}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {/* Success badge */}
        <View style={styles.badgeArea}>
          {CONFETTI.map((dot, index) => (
            <View
              key={`confetti-${index}`}
              style={[
                styles.confettiDot,
                {
                  width: dot.size,
                  height: dot.size,
                  borderRadius: dot.size / 2,
                  backgroundColor: dot.color,
                },
                dot.style,
              ]}
            />
          ))}

          <View style={styles.haloOuter}>
            <View style={styles.haloInner}>
              <View style={styles.checkCircle}>
                <Ionicons name="checkmark" size={52} color={colors.white} />
              </View>
            </View>
          </View>
        </View>

        {/* Title */}
        <Text style={styles.title}>Order Placed Successfully!</Text>
        <Text style={styles.subtitle}>
          Thank you for your purchase. A confirmation has been sent to your
          email.
        </Text>

        {/* Summary card */}
        <View style={styles.card}>
          <View style={styles.orderNumberRow}>
            <Text style={styles.orderNumberLabel}>Order Number</Text>
            <Text style={styles.orderNumberValue}>#{ORDER_ID}</Text>
          </View>

          <View style={styles.divider} />

          {SUMMARY_ROWS.map((row) => (
            <View key={row.key} style={styles.summaryRow}>
              <View style={styles.summaryIconBox}>
                <Ionicons name={row.icon} size={18} color={colors.primary} />
              </View>
              <View style={styles.summaryTextWrap}>
                <Text style={styles.summaryLabel}>{row.label}</Text>
                <Text style={styles.summaryValue}>{row.value}</Text>
              </View>
            </View>
          ))}
        </View>

        {/* Stepper */}
        <View style={styles.stepper}>
          {STEPS.map((step, index) => {
            const isLast = index === STEPS.length - 1;
            return (
              <View key={step.key} style={styles.stepItem}>
                {!isLast && <View style={styles.stepLine} />}
                <View
                  style={[
                    styles.stepCircle,
                    step.active ? styles.stepCircleActive : styles.stepCircleIdle,
                  ]}
                >
                  <Ionicons
                    name={step.icon}
                    size={step.active ? 20 : 18}
                    color={step.active ? colors.white : '#B0B5BE'}
                  />
                </View>
                <Text
                  style={[
                    styles.stepLabel,
                    step.active ? styles.stepLabelActive : styles.stepLabelIdle,
                  ]}
                  numberOfLines={1}
                >
                  {step.label}
                </Text>
              </View>
            );
          })}
        </View>

        {/* Primary action */}
        <Pressable
          onPress={handleViewOrderDetails}
          android_ripple={{ color: 'rgba(255,255,255,0.24)' }}
          style={({ pressed }) => [
            styles.primaryButton,
            pressed && styles.primaryButtonPressed,
          ]}
        >
          <Text style={styles.primaryButtonText}>View Order Details</Text>
          <Ionicons
            name="chevron-forward"
            size={18}
            color={colors.white}
            style={styles.primaryButtonIcon}
          />
        </Pressable>

        {/* Secondary action */}
        <Pressable
          onPress={handleContinueShopping}
          android_ripple={{ color: 'rgba(255,87,34,0.10)' }}
          style={({ pressed }) => [
            styles.secondaryButton,
            pressed && styles.secondaryButtonPressed,
          ]}
        >
          <Ionicons
            name="home-outline"
            size={18}
            color={colors.dark}
            style={styles.secondaryButtonIcon}
          />
          <Text style={styles.secondaryButtonText}>Continue Shopping</Text>
        </Pressable>
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
    backgroundColor: colors.background,
  },
  scrollContent: {
    paddingHorizontal: 20,
    paddingTop: 8,
    paddingBottom: 32,
  },

  /* Success badge */
  badgeArea: {
    width: 200,
    height: 200,
    alignSelf: 'center',
    alignItems: 'center',
    justifyContent: 'center',
  },
  confettiDot: {
    position: 'absolute',
  },
  haloOuter: {
    width: 140,
    height: 140,
    borderRadius: 70,
    backgroundColor: 'rgba(34,197,94,0.14)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  haloInner: {
    width: 118,
    height: 118,
    borderRadius: 59,
    backgroundColor: 'rgba(34,197,94,0.20)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  checkCircle: {
    width: 96,
    height: 96,
    borderRadius: 48,
    backgroundColor: '#16A34A',
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#16A34A',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.28,
    shadowRadius: 12,
    elevation: 6,
  },

  /* Texts */
  title: {
    marginTop: 4,
    fontSize: 26,
    lineHeight: 33,
    fontWeight: '800',
    color: colors.dark,
    textAlign: 'center',
    letterSpacing: -0.4,
  },
  subtitle: {
    marginTop: 10,
    fontSize: 15,
    lineHeight: 22,
    color: '#6B7280',
    textAlign: 'center',
    paddingHorizontal: 12,
  },

  /* Card */
  card: {
    marginTop: 24,
    backgroundColor: colors.white,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: colors.border,
    paddingHorizontal: 16,
    paddingVertical: 16,
    shadowColor: '#0F172A',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.04,
    shadowRadius: 14,
    elevation: 2,
  },
  orderNumberRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingBottom: 14,
  },
  orderNumberLabel: {
    fontSize: 15,
    color: '#6B7280',
    fontWeight: '500',
  },
  orderNumberValue: {
    fontSize: 15,
    fontWeight: '800',
    color: colors.dark,
    letterSpacing: 0.2,
  },
  divider: {
    height: 1,
    backgroundColor: colors.border,
    marginBottom: 4,
  },
  summaryRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 10,
  },
  summaryIconBox: {
    width: 36,
    height: 36,
    borderRadius: 10,
    backgroundColor: '#FFF1EA',
    alignItems: 'center',
    justifyContent: 'center',
  },
  summaryTextWrap: {
    marginLeft: 12,
    flex: 1,
  },
  summaryLabel: {
    fontSize: 13,
    color: '#8A9099',
    fontWeight: '500',
    marginBottom: 3,
  },
  summaryValue: {
    fontSize: 15,
    fontWeight: '700',
    color: colors.dark,
  },

  /* Stepper */
  stepper: {
    marginTop: 22,
    flexDirection: 'row',
    alignItems: 'flex-start',
    paddingHorizontal: 4,
  },
  stepItem: {
    flex: 1,
    alignItems: 'center',
  },
  stepLine: {
    position: 'absolute',
    top: 21,
    left: '50%',
    width: '100%',
    height: 2,
    backgroundColor: colors.border,
    zIndex: 0,
  },
  stepCircle: {
    width: 44,
    height: 44,
    borderRadius: 22,
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 1,
  },
  stepCircleActive: {
    backgroundColor: colors.primary,
    shadowColor: colors.primary,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.28,
    shadowRadius: 8,
    elevation: 4,
  },
  stepCircleIdle: {
    backgroundColor: colors.background,
    borderWidth: 1.5,
    borderColor: colors.border,
  },
  stepLabel: {
    marginTop: 8,
    fontSize: 12,
    textAlign: 'center',
  },
  stepLabelActive: {
    color: colors.dark,
    fontWeight: '700',
  },
  stepLabelIdle: {
    color: '#8A9099',
    fontWeight: '500',
  },

  /* Buttons */
  primaryButton: {
    marginTop: 28,
    height: 56,
    borderRadius: 16,
    backgroundColor: colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
    flexDirection: 'row',
    shadowColor: colors.primary,
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.24,
    shadowRadius: 14,
    elevation: 5,
  },
  primaryButtonPressed: {
    opacity: 0.9,
    transform: [{ scale: 0.985 }],
  },
  primaryButtonText: {
    fontSize: 16,
    fontWeight: '700',
    color: colors.white,
    letterSpacing: 0.2,
  },
  primaryButtonIcon: {
    marginLeft: 8,
  },
  secondaryButton: {
    marginTop: 12,
    height: 54,
    borderRadius: 16,
    backgroundColor: colors.white,
    borderWidth: 1,
    borderColor: colors.border,
    alignItems: 'center',
    justifyContent: 'center',
    flexDirection: 'row',
  },
  secondaryButtonPressed: {
    backgroundColor: '#FFF6F1',
    opacity: 0.95,
  },
  secondaryButtonIcon: {
    marginRight: 8,
  },
  secondaryButtonText: {
    fontSize: 15,
    fontWeight: '600',
    color: colors.dark,
  },
});