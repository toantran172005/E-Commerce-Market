import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Image,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { COLORS } from '../../src/constants/theme';

/* ------------------------------------------------------------------ */
/* Local color tokens (falling back to the design palette)            */
/* ------------------------------------------------------------------ */
const PRIMARY = COLORS.primary;
const DARK = COLORS.dark;
const BACKGROUND = COLORS.background;
const BORDER = COLORS.border;

const CARD = '#FFFFFF';
const PRIMARY_SOFT = '#FFF1EB';
const TEXT_SECONDARY = '#8A9099';
const TEXT_MUTED = '#B0B5BE';
const SUCCESS = '#17B26A';
const CHIP_BG = '#F2F4F7';

/* ------------------------------------------------------------------ */
/* Types & mock data                                                  */
/* ------------------------------------------------------------------ */
type TimelineStep = {
  key: string;
  label: string;
  icon: keyof typeof Ionicons.glyphMap;
  date: string;
  time: string;
  completed: boolean;
};

type OrderItem = {
  id: string;
  name: string;
  variant: string;
  qty: number;
  price: number;
  image: string;
};

const STEPS: TimelineStep[] = [
  {
    key: 'ordered',
    label: 'Ordered',
    icon: 'cube',
    date: 'Oct 27',
    time: '09:41 AM',
    completed: true,
  },
  {
    key: 'packing',
    label: 'Packing',
    icon: 'archive',
    date: 'Oct 27',
    time: '02:15 PM',
    completed: false,
  },
  {
    key: 'shipping',
    label: 'Shipping',
    icon: 'car',
    date: 'Oct 28',
    time: '08:00 AM',
    completed: false,
  },
  {
    key: 'delivered',
    label: 'Delivered',
    icon: 'checkmark-sharp',
    date: 'Oct 30',
    time: '06:30 PM',
    completed: false,
  },
];

const ITEMS: OrderItem[] = [
  {
    id: '1',
    name: 'Nike Air Max 270 Flyknit',
    variant: 'Black / Size 42',
    qty: 1,
    price: 149,
    image:
      'https://images.unsplash.com/photo-1542291026-7eec264c27ff?auto=format&fit=crop&w=240&q=80',
  },
  {
    id: '2',
    name: 'Leather Everyday Backpack',
    variant: 'Brown / Medium',
    qty: 1,
    price: 100,
    image:
      'https://images.unsplash.com/photo-1553062407-98eeb64c6a62?auto=format&fit=crop&w=240&q=80',
  },
];

const SUBTOTAL = ITEMS.reduce((sum, item) => sum + item.price * item.qty, 0);
const DELIVERY_FEE: number = 0;
const TOTAL = SUBTOTAL + DELIVERY_FEE;
const ITEMS_COUNT = ITEMS.reduce((sum, item) => sum + item.qty, 0);

/* ------------------------------------------------------------------ */
/* Screen                                                             */
/* ------------------------------------------------------------------ */
export default function OrderDetailScreen() {
  const router = useRouter();
  const { id } = useLocalSearchParams<{ id?: string }>();

  const orderNumber = id ? String(id).toUpperCase().replace('#', '') : 'ORD-98421';

  return (
    <SafeAreaView style={styles.container} edges={['top', 'left', 'right']}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity
          style={styles.backButton}
          activeOpacity={0.8}
          onPress={() => router.back()}
        >
          <Ionicons name="arrow-back" size={20} color={DARK} />
        </TouchableOpacity>
        <View style={styles.headerTextWrap}>
          <Text style={styles.headerTitle}>{`Order #${orderNumber}`}</Text>
          <Text style={styles.headerSubtitle}>
            {`Oct 27, 2026 • ${ITEMS_COUNT} ${ITEMS_COUNT > 1 ? 'items' : 'item'}`}
          </Text>
        </View>
      </View>

      <ScrollView
        style={styles.scroll}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {/* Status + Timeline card */}
        <View style={styles.statusCard}>
          <View style={styles.statusTopRow}>
            <View style={styles.statusIconBox}>
              <Ionicons name="cube-outline" size={22} color={PRIMARY} />
            </View>
            <View style={styles.statusMain}>
              <View style={styles.statusTitleRow}>
                <Text style={styles.statusOrderNumber}>{`#${orderNumber}`}</Text>
                <Text style={styles.statusPrice}>{`$${TOTAL.toFixed(2)}`}</Text>
              </View>
              <View style={styles.statusMetaRow}>
                <Text style={styles.statusMeta}>
                  {`Oct 27, 2026 • ${ITEMS_COUNT} ${
                    ITEMS_COUNT > 1 ? 'items' : 'item'
                  }`}
                </Text>
                <View style={styles.statusBadge}>
                  <Text style={styles.statusBadgeText}>Processing</Text>
                </View>
              </View>
            </View>
          </View>

          {/* Timeline */}
          <View style={styles.timeline}>
            {STEPS.map((step, index) => {
              const prevStep = index > 0 ? STEPS[index - 1] : null;
              return (
                <View key={step.key} style={styles.stepWrapper}>
                  <View style={styles.stepRow}>
                    <View
                      style={[
                        styles.connector,
                        index === 0 && styles.connectorHidden,
                        prevStep && prevStep.completed && styles.connectorDone,
                      ]}
                    />
                    <View
                      style={[
                        styles.stepCircle,
                        step.completed && styles.stepCircleActive,
                      ]}
                    >
                      <Ionicons
                        name={step.icon}
                        size={18}
                        color={step.completed ? '#FFFFFF' : '#C4C7CE'}
                      />
                    </View>
                    <View
                      style={[
                        styles.connector,
                        index === STEPS.length - 1 && styles.connectorHidden,
                      ]}
                    />
                  </View>
                  <Text
                    style={[
                      styles.stepLabel,
                      step.completed && styles.stepLabelActive,
                    ]}
                    numberOfLines={1}
                  >
                    {step.label}
                  </Text>
                  <Text style={styles.stepDate} numberOfLines={1}>
                    {step.date}
                  </Text>
                  <Text style={styles.stepTime} numberOfLines={1}>
                    {step.time}
                  </Text>
                </View>
              );
            })}
          </View>
        </View>

        {/* Order items */}
        <View style={styles.sectionHeader}>
          <Text style={styles.sectionTitle}>{`Order Items (${ITEMS_COUNT})`}</Text>
          <Text style={styles.sectionLink}>Invoice</Text>
        </View>

        <View style={styles.itemsCard}>
          {ITEMS.map((item, index) => (
            <View
              key={item.id}
              style={[
                styles.productRow,
                index !== ITEMS.length - 1 && styles.productRowDivider,
              ]}
            >
              <Image source={{ uri: item.image }} style={styles.productImage} />
              <View style={styles.productInfo}>
                <Text style={styles.productName} numberOfLines={2}>
                  {item.name}
                </Text>
                <Text style={styles.productVariant}>{item.variant}</Text>
                <View style={styles.productQtyRow}>
                  <View style={styles.qtyChip}>
                    <Text style={styles.qtyChipText}>{`x${item.qty}`}</Text>
                  </View>
                  <Text style={styles.productUnitPrice}>
                    {`$${item.price.toFixed(2)} each`}
                  </Text>
                </View>
              </View>
              <Text style={styles.productPrice}>
                {`$${(item.price * item.qty).toFixed(2)}`}
              </Text>
            </View>
          ))}
        </View>

        {/* Delivery address */}
        <Text style={styles.sectionTitleStandalone}>Delivery Details</Text>

        <View style={styles.infoCard}>
          <View style={styles.infoIconWrap}>
            <Ionicons name="location-outline" size={20} color={PRIMARY} />
          </View>
          <View style={styles.infoBody}>
            <Text style={styles.infoLabel}>DELIVERY ADDRESS</Text>
            <Text style={styles.infoTitle}>Alex Morgan</Text>
            <Text style={styles.infoText}>
              221B Baker Street, Marylebone{'\n'}
              London, NW1 6XE, United Kingdom
            </Text>
            <Text style={styles.infoText}>+44 20 7946 0958</Text>
          </View>
          <TouchableOpacity activeOpacity={0.7} onPress={() => {}}>
            <Text style={styles.changeText}>Change</Text>
          </TouchableOpacity>
        </View>

        <View style={styles.infoCard}>
          <View style={styles.infoIconWrap}>
            <Ionicons name="card-outline" size={20} color={PRIMARY} />
          </View>
          <View style={styles.infoBody}>
            <Text style={styles.infoLabel}>PAYMENT METHOD</Text>
            <Text style={styles.infoTitle}>Visa •••• 4523</Text>
            <Text style={styles.infoText}>Expires 08 / 29 • Alex Morgan</Text>
          </View>
          <TouchableOpacity activeOpacity={0.7} onPress={() => {}}>
            <Text style={styles.changeText}>Change</Text>
          </TouchableOpacity>
        </View>

        {/* Payment summary */}
        <Text style={styles.sectionTitleStandalone}>Payment Summary</Text>

        <View style={styles.summaryCard}>
          <View style={styles.summaryRow}>
            <Text style={styles.summaryLabel}>Subtotal</Text>
            <Text style={styles.summaryValue}>{`$${SUBTOTAL.toFixed(2)}`}</Text>
          </View>
          <View style={styles.summaryRow}>
            <Text style={styles.summaryLabel}>Delivery Fee</Text>
            <Text style={styles.freeText}>
              {DELIVERY_FEE === 0 ? 'Free' : `$${DELIVERY_FEE.toFixed(2)}`}
            </Text>
          </View>
          <View style={styles.summaryRow}>
            <Text style={styles.summaryLabel}>Tax</Text>
            <Text style={styles.summaryValue}>Included</Text>
          </View>
          <View style={styles.summaryDivider} />
          <View style={styles.summaryRow}>
            <Text style={styles.totalLabel}>Total</Text>
            <Text style={styles.totalValue}>{`$${TOTAL.toFixed(2)}`}</Text>
          </View>
        </View>

        <View style={styles.noteWrap}>
          <Ionicons name="information-circle-outline" size={15} color={TEXT_MUTED} />
          <Text style={styles.noteText}>
            You can cancel this order until Oct 28, 2026 • 09:00 AM
          </Text>
        </View>
      </ScrollView>

      {/* Bottom actions */}
      <View style={styles.bottomBar}>
        <TouchableOpacity
          style={styles.cancelButton}
          activeOpacity={0.85}
          onPress={() => {}}
        >
          <Text style={styles.cancelText}>Cancel Order</Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={styles.trackButton}
          activeOpacity={0.9}
          onPress={() => {}}
        >
          <Ionicons name="navigate" size={17} color="#FFFFFF" />
          <Text style={styles.trackText}>Track Order</Text>
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
}

/* ------------------------------------------------------------------ */
/* Styles                                                             */
/* ------------------------------------------------------------------ */
const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: BACKGROUND,
  },

  /* Header */
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingTop: 10,
    paddingBottom: 14,
  },
  backButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: CARD,
    borderWidth: 1,
    borderColor: BORDER,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: DARK,
    shadowOpacity: 0.06,
    shadowRadius: 8,
    shadowOffset: { width: 0, height: 2 },
    elevation: 2,
  },
  headerTextWrap: {
    flex: 1,
    marginLeft: 14,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: DARK,
    letterSpacing: -0.3,
  },
  headerSubtitle: {
    marginTop: 3,
    fontSize: 12,
    fontWeight: '500',
    color: TEXT_SECONDARY,
  },

  /* Scroll */
  scroll: {
    flex: 1,
  },
  scrollContent: {
    paddingHorizontal: 20,
    paddingBottom: 24,
  },

  /* Status card */
  statusCard: {
    backgroundColor: CARD,
    borderRadius: 18,
    borderWidth: 1,
    borderColor: BORDER,
    padding: 16,
    shadowColor: DARK,
    shadowOpacity: 0.05,
    shadowRadius: 14,
    shadowOffset: { width: 0, height: 6 },
    elevation: 3,
  },
  statusTopRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
  },
  statusIconBox: {
    width: 44,
    height: 44,
    borderRadius: 14,
    backgroundColor: PRIMARY_SOFT,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  statusMain: {
    flex: 1,
  },
  statusTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  statusOrderNumber: {
    fontSize: 15,
    fontWeight: '700',
    color: DARK,
    letterSpacing: 0.2,
  },
  statusPrice: {
    fontSize: 15,
    fontWeight: '700',
    color: DARK,
  },
  statusMetaRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginTop: 7,
  },
  statusMeta: {
    fontSize: 12,
    fontWeight: '500',
    color: TEXT_SECONDARY,
  },
  statusBadge: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 8,
    backgroundColor: CHIP_BG,
  },
  statusBadgeText: {
    fontSize: 11,
    fontWeight: '600',
    color: '#6B7280',
  },

  /* Timeline */
  timeline: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginTop: 20,
  },
  stepWrapper: {
    flex: 1,
    alignItems: 'center',
  },
  stepRow: {
    flexDirection: 'row',
    alignItems: 'center',
    width: '100%',
  },
  connector: {
    flex: 1,
    height: 1.5,
    backgroundColor: '#E6E9EE',
    marginHorizontal: 3,
  },
  connectorDone: {
    backgroundColor: '#FFC9B5',
  },
  connectorHidden: {
    backgroundColor: 'transparent',
  },
  stepCircle: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#F2F4F7',
    alignItems: 'center',
    justifyContent: 'center',
  },
  stepCircleActive: {
    backgroundColor: PRIMARY,
    shadowColor: PRIMARY,
    shadowOpacity: 0.35,
    shadowRadius: 8,
    shadowOffset: { width: 0, height: 4 },
    elevation: 4,
  },
  stepLabel: {
    marginTop: 9,
    fontSize: 11,
    fontWeight: '600',
    color: '#9AA0A9',
  },
  stepLabelActive: {
    color: PRIMARY,
    fontWeight: '700',
  },
  stepDate: {
    marginTop: 3,
    fontSize: 9.5,
    fontWeight: '500',
    color: TEXT_MUTED,
  },
  stepTime: {
    marginTop: 1,
    fontSize: 9,
    fontWeight: '500',
    color: '#C4C8CF',
  },

  /* Section titles */
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginTop: 24,
    marginBottom: 10,
  },
  sectionTitle: {
    fontSize: 15,
    fontWeight: '700',
    color: DARK,
    letterSpacing: -0.2,
  },
  sectionLink: {
    fontSize: 12,
    fontWeight: '700',
    color: PRIMARY,
  },
  sectionTitleStandalone: {
    fontSize: 15,
    fontWeight: '700',
    color: DARK,
    letterSpacing: -0.2,
    marginTop: 24,
    marginBottom: 10,
  },

  /* Items */
  itemsCard: {
    backgroundColor: CARD,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: BORDER,
    paddingHorizontal: 12,
  },
  productRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
  },
  productRowDivider: {
    borderBottomWidth: 1,
    borderBottomColor: BORDER,
  },
  productImage: {
    width: 64,
    height: 64,
    borderRadius: 12,
    backgroundColor: CHIP_BG,
  },
  productInfo: {
    flex: 1,
    marginLeft: 12,
    marginRight: 8,
  },
  productName: {
    fontSize: 14,
    fontWeight: '600',
    color: DARK,
    lineHeight: 18,
  },
  productVariant: {
    marginTop: 3,
    fontSize: 12,
    fontWeight: '500',
    color: TEXT_SECONDARY,
  },
  productQtyRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 7,
  },
  qtyChip: {
    paddingHorizontal: 7,
    paddingVertical: 2,
    borderRadius: 6,
    backgroundColor: CHIP_BG,
    marginRight: 8,
  },
  qtyChipText: {
    fontSize: 10.5,
    fontWeight: '700',
    color: '#6B7280',
  },
  productUnitPrice: {
    fontSize: 11.5,
    fontWeight: '500',
    color: TEXT_MUTED,
  },
  productPrice: {
    fontSize: 14,
    fontWeight: '700',
    color: DARK,
  },

  /* Info cards */
  infoCard: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    backgroundColor: CARD,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: BORDER,
    padding: 14,
    marginBottom: 12,
  },
  infoIconWrap: {
    width: 38,
    height: 38,
    borderRadius: 12,
    backgroundColor: PRIMARY_SOFT,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  infoBody: {
    flex: 1,
  },
  infoLabel: {
    fontSize: 10,
    fontWeight: '700',
    color: TEXT_MUTED,
    letterSpacing: 0.8,
  },
  infoTitle: {
    marginTop: 5,
    fontSize: 14,
    fontWeight: '700',
    color: DARK,
  },
  infoText: {
    marginTop: 3,
    fontSize: 12.5,
    fontWeight: '500',
    color: TEXT_SECONDARY,
    lineHeight: 18,
  },
  changeText: {
    fontSize: 12,
    fontWeight: '700',
    color: PRIMARY,
    marginLeft: 8,
    marginTop: 2,
  },

  /* Summary */
  summaryCard: {
    backgroundColor: CARD,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: BORDER,
    padding: 16,
  },
  summaryRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 6,
  },
  summaryLabel: {
    fontSize: 13,
    fontWeight: '500',
    color: TEXT_SECONDARY,
  },
  summaryValue: {
    fontSize: 13,
    fontWeight: '600',
    color: DARK,
  },
  freeText: {
    fontSize: 13,
    fontWeight: '700',
    color: SUCCESS,
  },
  summaryDivider: {
    height: 1,
    backgroundColor: BORDER,
    marginVertical: 8,
  },
  totalLabel: {
    fontSize: 15,
    fontWeight: '700',
    color: DARK,
  },
  totalValue: {
    fontSize: 19,
    fontWeight: '800',
    color: DARK,
    letterSpacing: -0.3,
  },

  /* Note */
  noteWrap: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 16,
  },
  noteText: {
    marginLeft: 6,
    fontSize: 11.5,
    fontWeight: '500',
    color: TEXT_MUTED,
  },

  /* Bottom bar */
  bottomBar: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingTop: 12,
    paddingBottom: 12,
    backgroundColor: CARD,
    borderTopWidth: 1,
    borderTopColor: BORDER,
  },
  cancelButton: {
    flex: 1,
    height: 52,
    borderRadius: 16,
    borderWidth: 1.5,
    borderColor: '#E2E5EA',
    backgroundColor: CARD,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  cancelText: {
    fontSize: 14,
    fontWeight: '700',
    color: DARK,
  },
  trackButton: {
    flex: 1.35,
    height: 52,
    borderRadius: 16,
    backgroundColor: PRIMARY,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: PRIMARY,
    shadowOpacity: 0.3,
    shadowRadius: 10,
    shadowOffset: { width: 0, height: 6 },
    elevation: 4,
  },
  trackText: {
    marginLeft: 8,
    fontSize: 14,
    fontWeight: '700',
    color: '#FFFFFF',
    letterSpacing: 0.2,
  },
});