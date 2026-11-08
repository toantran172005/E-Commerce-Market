import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { Colors } from '../src/constants/theme';

type ShippingType = 'standard' | 'express';
type PaymentType = 'card' | 'momo' | 'cod';

export default function CheckoutScreen() {
  const router = useRouter();

  const [shipping, setShipping] = useState<ShippingType>('standard');
  const [payment, setPayment] = useState<PaymentType>('card');

  const SUBTOTAL = 249.0;
  const TAX = 19.92;
  const shippingFee = shipping === 'express' ? 12.0 : 0;
  const total = SUBTOTAL + TAX + shippingFee;

  const money = (value: number) =>
    `$${value.toLocaleString('en-US', {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    })}`;

  const handleConfirmPayment = () => {
    router.push('/checkout-success');
  };

  return (
    <SafeAreaView style={styles.safeArea} edges={['top', 'bottom']}>
      {/* ============ HEADER ============ */}
      <View style={styles.header}>
        <TouchableOpacity
          style={styles.backButton}
          activeOpacity={0.7}
          onPress={() => router.back()}
        >
          <Ionicons name="chevron-back" size={22} color={Colors.dark} />
        </TouchableOpacity>

        <View style={styles.headerText}>
          <Text style={styles.headerTitle}>Thanh toán</Text>
          <Text style={styles.headerSubtitle}>Thanh toán & Giao hàng</Text>
        </View>
      </View>

      <ScrollView
        style={styles.scroll}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {/* ============ KHỐI 1: ĐỊA CHỈ GIAO HÀNG ============ */}
        <View style={styles.card}>
          <View style={styles.cardHeaderRow}>
            <View style={styles.cardHeaderLeft}>
              <View style={styles.iconBadge}>
                <Ionicons name="location" size={17} color={Colors.primary} />
              </View>
              <Text style={styles.cardTitle}>Địa chỉ giao hàng</Text>
            </View>

            <TouchableOpacity
              style={styles.changeButton}
              activeOpacity={0.7}
              onPress={() => router.push('/shipping-address')}
            >
              <Ionicons name="pencil" size={13} color={Colors.primary} />
              <Text style={styles.changeText}>Thay đổi</Text>
            </TouchableOpacity>
          </View>

          <View style={styles.nameRow}>
            <Text style={styles.name}>Trần Minh Alex</Text>
            <View style={styles.tag}>
              <Text style={styles.tagText}>NHÀ RIÊNG</Text>
            </View>
          </View>

          <Text style={styles.address}>
            248 Đường Nguyễn Văn Cừ, Phường 4, Quận 5, TP. Hồ Chí Minh
          </Text>

          <View style={styles.phoneRow}>
            <Ionicons name="call-outline" size={13} color="#8A8F98" />
            <Text style={styles.phone}>+84 901 284 920</Text>
          </View>
        </View>

        {/* ============ KHỐI 2: PHƯƠNG THỨC GIAO HÀNG ============ */}
        <View style={styles.card}>
          <View style={styles.cardHeaderLeft}>
            <View style={styles.iconBadge}>
              <Ionicons name="cube" size={17} color={Colors.primary} />
            </View>
            <Text style={styles.cardTitle}>Phương thức giao hàng</Text>
          </View>

          <TouchableOpacity
            style={[styles.option, shipping === 'standard' && styles.optionActive]}
            activeOpacity={0.8}
            onPress={() => setShipping('standard')}
          >
            <View style={[styles.radio, shipping === 'standard' && styles.radioActive]}>
              {shipping === 'standard' && <View style={styles.radioDot} />}
            </View>

            <View style={styles.optionBody}>
              <Text style={styles.optionTitle}>Tiêu chuẩn (2-4 ngày)</Text>
              <Text style={styles.optionDesc}>Giao hàng tiết kiệm toàn quốc</Text>
            </View>

            <Text style={styles.freeText}>MIỄN PHÍ</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.option, shipping === 'express' && styles.optionActive]}
            activeOpacity={0.8}
            onPress={() => setShipping('express')}
          >
            <View style={[styles.radio, shipping === 'express' && styles.radioActive]}>
              {shipping === 'express' && <View style={styles.radioDot} />}
            </View>

            <View style={styles.optionBody}>
              <Text style={styles.optionTitle}>Hỏa tốc (1-2 ngày)</Text>
              <Text style={styles.optionDesc}>Ưu tiên xử lý & giao nhanh</Text>
            </View>

            <Text style={styles.feeText}>$12.00</Text>
          </TouchableOpacity>
        </View>

        {/* ============ KHỐI 3: PHƯƠNG THỨC THANH TOÁN ============ */}
        <View style={styles.card}>
          <View style={styles.cardHeaderLeft}>
            <View style={styles.iconBadge}>
              <Ionicons name="card" size={17} color={Colors.primary} />
            </View>
            <Text style={styles.cardTitle}>Phương thức thanh toán</Text>
          </View>

          <TouchableOpacity
            style={[styles.option, payment === 'card' && styles.optionActive]}
            activeOpacity={0.8}
            onPress={() => setPayment('card')}
          >
            <View style={[styles.radio, payment === 'card' && styles.radioActive]}>
              {payment === 'card' && <View style={styles.radioDot} />}
            </View>

            <View style={styles.payIconBadge}>
              <Ionicons name="card-outline" size={16} color={Colors.primary} />
            </View>

            <View style={styles.optionBody}>
              <Text style={styles.optionTitle}>Thẻ Tín dụng / Ghi nợ</Text>
              <Text style={styles.optionDesc}>Visa, Mastercard</Text>
            </View>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.option, payment === 'momo' && styles.optionActive]}
            activeOpacity={0.8}
            onPress={() => setPayment('momo')}
          >
            <View style={[styles.radio, payment === 'momo' && styles.radioActive]}>
              {payment === 'momo' && <View style={styles.radioDot} />}
            </View>

            <View style={styles.payIconBadge}>
              <Ionicons name="wallet-outline" size={16} color={Colors.primary} />
            </View>

            <View style={styles.optionBody}>
              <Text style={styles.optionTitle}>Ví điện tử MoMo</Text>
              <Text style={styles.optionDesc}>Thanh toán nhanh & an toàn</Text>
            </View>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.option, payment === 'cod' && styles.optionActive]}
            activeOpacity={0.8}
            onPress={() => setPayment('cod')}
          >
            <View style={[styles.radio, payment === 'cod' && styles.radioActive]}>
              {payment === 'cod' && <View style={styles.radioDot} />}
            </View>

            <View style={styles.payIconBadge}>
              <Ionicons name="cash-outline" size={16} color={Colors.primary} />
            </View>

            <View style={styles.optionBody}>
              <Text style={styles.optionTitle}>Thanh toán khi nhận hàng</Text>
              <Text style={styles.optionDesc}>COD - Trả tiền mặt khi giao</Text>
            </View>
          </TouchableOpacity>
        </View>

        {/* ============ KHỐI 4: TÓM TẮT THANH TOÁN ============ */}
        <View style={styles.card}>
          <View style={styles.cardHeaderLeft}>
            <View style={styles.iconBadge}>
              <Ionicons name="receipt" size={17} color={Colors.primary} />
            </View>
            <Text style={styles.cardTitle}>Tóm tắt thanh toán</Text>
          </View>

          <View style={styles.summaryRow}>
            <Text style={styles.summaryLabel}>Tạm tính</Text>
            <Text style={styles.summaryValue}>{money(SUBTOTAL)}</Text>
          </View>

          <View style={styles.summaryRow}>
            <Text style={styles.summaryLabel}>Phí vận chuyển</Text>
            <Text style={[styles.summaryValue, shippingFee === 0 && styles.freeValue]}>
              {shippingFee === 0 ? 'Miễn phí' : money(shippingFee)}
            </Text>
          </View>

          <View style={styles.summaryRow}>
            <Text style={styles.summaryLabel}>Thuế (8%)</Text>
            <Text style={styles.summaryValue}>{money(TAX)}</Text>
          </View>

          <View style={styles.divider} />

          <View style={styles.summaryRow}>
            <Text style={styles.totalLabel}>Tổng cộng</Text>
            <Text style={styles.totalValue}>{money(total)}</Text>
          </View>
        </View>
      </ScrollView>

      {/* ============ THANH THANH TOÁN ============ */}
      <View style={styles.bottomBar}>
        <TouchableOpacity
          style={styles.payButton}
          activeOpacity={0.85}
          onPress={handleConfirmPayment}
        >
          <Text style={styles.payButtonText} numberOfLines={1}>
            Xác nhận & Thanh toán · {money(total)}
          </Text>
          <Ionicons name="chevron-forward" size={18} color={Colors.white} />
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: Colors.background,
  },

  /* ---------- Header ---------- */
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingTop: 8,
    paddingBottom: 16,
    backgroundColor: Colors.background,
  },
  backButton: {
    width: 42,
    height: 42,
    borderRadius: 21,
    backgroundColor: Colors.white,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: Colors.border,
    marginRight: 14,
  },
  headerText: {
    flex: 1,
  },
  headerTitle: {
    fontSize: 22,
    fontWeight: '800',
    color: Colors.dark,
    letterSpacing: -0.3,
  },
  headerSubtitle: {
    marginTop: 2,
    fontSize: 13,
    fontWeight: '500',
    color: '#8A8F98',
  },

  /* ---------- Scroll ---------- */
  scroll: {
    flex: 1,
  },
  scrollContent: {
    paddingHorizontal: 20,
    paddingBottom: 20,
  },

  /* ---------- Card ---------- */
  card: {
    backgroundColor: Colors.white,
    borderRadius: 18,
    padding: 16,
    marginBottom: 14,
    borderWidth: 1,
    borderColor: Colors.border,
    shadowColor: '#101828',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.04,
    shadowRadius: 10,
    elevation: 2,
  },
  cardHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 12,
  },
  cardHeaderLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 2,
  },
  iconBadge: {
    width: 32,
    height: 32,
    borderRadius: 10,
    backgroundColor: '#FFF1EC',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 10,
  },
  cardTitle: {
    fontSize: 15,
    fontWeight: '700',
    color: Colors.dark,
  },

  /* ---------- Địa chỉ ---------- */
  changeButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 6,
    paddingHorizontal: 10,
    borderRadius: 12,
    backgroundColor: '#FFF1EC',
  },
  changeText: {
    marginLeft: 4,
    fontSize: 12.5,
    fontWeight: '700',
    color: Colors.primary,
  },
  nameRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 12,
    marginBottom: 6,
  },
  name: {
    fontSize: 15,
    fontWeight: '700',
    color: Colors.dark,
  },
  tag: {
    marginLeft: 8,
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 6,
    backgroundColor: '#EEF1F5',
  },
  tagText: {
    fontSize: 10,
    fontWeight: '800',
    letterSpacing: 0.5,
    color: '#6B7280',
  },
  address: {
    fontSize: 13.5,
    lineHeight: 20,
    color: '#5B6270',
  },
  phoneRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 8,
  },
  phone: {
    marginLeft: 6,
    fontSize: 13.5,
    fontWeight: '600',
    color: '#5B6270',
  },

  /* ---------- Option (giao hàng / thanh toán) ---------- */
  option: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 12,
    marginTop: 10,
    borderRadius: 14,
    borderWidth: 1.5,
    borderColor: Colors.border,
    backgroundColor: '#FBFCFD',
  },
  optionActive: {
    borderColor: Colors.primary,
    backgroundColor: '#FFF7F4',
  },
  radio: {
    width: 20,
    height: 20,
    borderRadius: 10,
    borderWidth: 1.5,
    borderColor: '#C9CED6',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  radioActive: {
    borderColor: Colors.primary,
  },
  radioDot: {
    width: 10,
    height: 10,
    borderRadius: 5,
    backgroundColor: Colors.primary,
  },
  payIconBadge: {
    width: 30,
    height: 30,
    borderRadius: 9,
    backgroundColor: Colors.white,
    borderWidth: 1,
    borderColor: Colors.border,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 10,
  },
  optionBody: {
    flex: 1,
    paddingRight: 6,
  },
  optionTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: Colors.dark,
  },
  optionDesc: {
    marginTop: 2,
    fontSize: 12,
    color: '#8A8F98',
  },
  freeText: {
    fontSize: 12.5,
    fontWeight: '800',
    color: '#12B76A',
  },
  feeText: {
    fontSize: 13,
    fontWeight: '700',
    color: Colors.dark,
  },

  /* ---------- Tóm tắt ---------- */
  summaryRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 6,
  },
  summaryLabel: {
    fontSize: 14,
    color: '#5B6270',
  },
  summaryValue: {
    fontSize: 14,
    fontWeight: '600',
    color: Colors.dark,
  },
  freeValue: {
    fontWeight: '700',
    color: '#12B76A',
  },
  divider: {
    height: 1,
    backgroundColor: Colors.border,
    marginVertical: 10,
  },
  totalLabel: {
    fontSize: 16,
    fontWeight: '800',
    color: Colors.dark,
  },
  totalValue: {
    fontSize: 18,
    fontWeight: '800',
    color: Colors.primary,
  },

  /* ---------- Bottom bar ---------- */
  bottomBar: {
    paddingHorizontal: 20,
    paddingTop: 12,
    paddingBottom: 10,
    backgroundColor: Colors.white,
    borderTopWidth: 1,
    borderTopColor: Colors.border,
  },
  payButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: Colors.primary,
    borderRadius: 16,
    paddingVertical: 16,
    paddingHorizontal: 16,
    shadowColor: Colors.primary,
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.28,
    shadowRadius: 12,
    elevation: 6,
  },
  payButtonText: {
    flexShrink: 1,
    color: Colors.white,
    fontSize: 15.5,
    fontWeight: '800',
    marginRight: 6,
  },
});