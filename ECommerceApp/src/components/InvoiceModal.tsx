import React, { useState } from 'react';
import {
  Modal,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { colors, radius, spacing } from '../constants/theme';
import { Order } from '../types';
import { formatDate, formatDateTime, formatMoney, formatPhone } from '../utils/format';
import { PrimaryButton, SecondaryButton } from './Button';
import { Toast } from './Toast';

interface InvoiceModalProps {
  visible: boolean;
  onClose: () => void;
  order: Order | null;
}

export function InvoiceModal({ visible, onClose, order }: InvoiceModalProps) {
  const [toastVisible, setToastVisible] = useState(false);
  const [toastMessage, setToastMessage] = useState('');

  if (!order) return null;

  const handleDownload = () => {
    setToastMessage(`Đã tải hóa đơn điện tử đơn hàng #${order.id} về máy thành công.`);
    setToastVisible(true);
  };

  const isPaid = order.paymentStatus === 'paid' || order.status === 'delivered';
  const subtotal = order.subtotal ?? order.items.reduce((s, i) => s + i.price * i.quantity, 0);
  const tax = order.tax ?? Math.round(subtotal * 0.08);
  const shippingFee = order.shippingFee ?? 0;
  const discount = order.discount ?? 0;

  return (
    <Modal
      visible={visible}
      animationType="slide"
      presentationStyle="pageSheet"
      onRequestClose={onClose}
    >
      <SafeAreaView style={styles.safe} edges={['top', 'bottom']}>
        {/* Header */}
        <View style={styles.header}>
          <View style={styles.headerTitleRow}>
            <View style={styles.iconBadge}>
              <Ionicons name="receipt-outline" size={20} color={colors.primary} />
            </View>
            <Text style={styles.headerTitle}>Hóa đơn bán hàng</Text>
          </View>
          <Pressable
            onPress={onClose}
            hitSlop={8}
            style={({ pressed }) => [styles.closeBtn, pressed && styles.pressed]}
            accessibilityRole="button"
            accessibilityLabel="Đóng hóa đơn"
          >
            <Ionicons name="close" size={24} color={colors.textSecondary} />
          </Pressable>
        </View>

        <ScrollView
          style={styles.scroll}
          contentContainerStyle={styles.content}
          showsVerticalScrollIndicator={false}
        >
          {/* Card Hóa đơn */}
          <View style={styles.invoicePaper}>
            <View style={styles.storeHeader}>
              <Text style={styles.storeName}>ECOMMERCE MARKET</Text>
              <Text style={styles.storeSub}>Hóa đơn điện tử GTGT (VAT)</Text>
              <Text style={styles.invoiceCode}>Số HĐ: HD-{order.id.replace('ORD-', '')}</Text>
            </View>

            <View style={styles.dividerDashed} />

            {/* Thông tin đơn hàng & trạng thái */}
            <View style={styles.metaRow}>
              <Text style={styles.metaLabel}>Mã đơn hàng:</Text>
              <Text style={styles.metaValue}>#{order.id}</Text>
            </View>
            <View style={styles.metaRow}>
              <Text style={styles.metaLabel}>Thời gian lập:</Text>
              <Text style={styles.metaValue}>{formatDateTime(order.createdAt)}</Text>
            </View>
            <View style={styles.metaRow}>
              <Text style={styles.metaLabel}>Trạng thái thanh toán:</Text>
              <View style={[styles.statusBadge, isPaid ? styles.statusPaid : styles.statusPending]}>
                <Text style={[styles.statusBadgeText, isPaid ? styles.statusPaidText : styles.statusPendingText]}>
                  {isPaid ? 'ĐÃ THANH TOÁN' : 'CHỜ THANH TOÁN (COD)'}
                </Text>
              </View>
            </View>

            <View style={styles.dividerDashed} />

            {/* Thông tin người nhận */}
            <Text style={styles.sectionHeading}>THÔNG TIN NGƯỜI NHẬN</Text>
            <Text style={styles.customerName}>{order.customerName}</Text>
            <Text style={styles.customerDetail}>Điện thoại: {formatPhone(order.phoneNumber)}</Text>
            <Text style={styles.customerDetail}>Địa chỉ: {order.shippingAddress}</Text>
            <Text style={styles.customerDetail}>Phương thức TT: {order.paymentMethodName ?? 'Thanh toán khi nhận hàng'}</Text>
            {order.shippingMethodName ? (
              <Text style={styles.customerDetail}>Hình thức VC: {order.shippingMethodName}</Text>
            ) : null}

            <View style={styles.dividerDashed} />

            {/* Bảng sản phẩm */}
            <Text style={styles.sectionHeading}>CHI TIẾT MẶT HÀNG</Text>
            <View style={styles.tableHeader}>
              <Text style={[styles.colProd, styles.tableHeaderTitle]}>Sản phẩm</Text>
              <Text style={[styles.colQty, styles.tableHeaderTitle]}>SL</Text>
              <Text style={[styles.colPrice, styles.tableHeaderTitle]}>Đơn giá</Text>
              <Text style={[styles.colTotal, styles.tableHeaderTitle]}>Thành tiền</Text>
            </View>

            {order.items.map((item, index) => (
              <View key={`${item.productId}-${index}`} style={styles.tableRow}>
                <View style={styles.colProd}>
                  <Text style={styles.itemTitle} numberOfLines={2}>{item.name}</Text>
                  {item.variantName ? (
                    <Text style={styles.itemVariant}>{item.variantName}</Text>
                  ) : null}
                </View>
                <Text style={[styles.colQty, styles.itemText]}>x{item.quantity}</Text>
                <Text style={[styles.colPrice, styles.itemText]}>{formatMoney(item.price)}</Text>
                <Text style={[styles.colTotal, styles.itemTotalText]}>
                  {formatMoney(item.price * item.quantity)}
                </Text>
              </View>
            ))}

            <View style={styles.dividerDashed} />

            {/* Bảng tổng kết chi phí */}
            <View style={styles.calcRow}>
              <Text style={styles.calcLabel}>Tạm tính hàng hóa</Text>
              <Text style={styles.calcValue}>{formatMoney(subtotal)}</Text>
            </View>

            {discount > 0 ? (
              <View style={styles.calcRow}>
                <Text style={styles.calcLabel}>
                  Chiết khấu voucher {order.voucherCode ? `(${order.voucherCode})` : ''}
                </Text>
                <Text style={[styles.calcValue, styles.discountVal]}>-{formatMoney(discount)}</Text>
              </View>
            ) : null}

            <View style={styles.calcRow}>
              <Text style={styles.calcLabel}>Phí vận chuyển</Text>
              <Text style={styles.calcValue}>
                {shippingFee === 0 ? 'Miễn phí' : formatMoney(shippingFee)}
              </Text>
            </View>

            <View style={styles.calcRow}>
              <Text style={styles.calcLabel}>Thuế GTGT (VAT 8%)</Text>
              <Text style={styles.calcValue}>{formatMoney(tax)}</Text>
            </View>

            <View style={styles.totalRow}>
              <Text style={styles.totalLabel}>TỔNG TIỀN PHẢI TRẢ</Text>
              <Text style={styles.totalValue}>{formatMoney(order.totalAmount)}</Text>
            </View>

            <View style={styles.footerNote}>
              <Text style={styles.footerNoteText}>
                Hóa đơn này có giá trị xác nhận đơn đặt hàng từ E-Commerce Market. Quý khách vui lòng giữ lại hóa đơn để phục vụ chính sách bảo hành và đổi trả.
              </Text>
            </View>
          </View>

          {/* Nút hành động */}
          <View style={styles.actions}>
            <PrimaryButton
              title="Tải / Lưu hóa đơn"
              icon="download-outline"
              onPress={handleDownload}
              style={styles.actionBtn}
            />
            <SecondaryButton
              title="Đóng"
              onPress={onClose}
              style={styles.actionBtn}
            />
          </View>
        </ScrollView>

        <Toast
          message={toastMessage}
          visible={toastVisible}
          onHide={() => setToastVisible(false)}
        />
      </SafeAreaView>
    </Modal>
  );
}

const styles = StyleSheet.create({
  safe: {
    flex: 1,
    backgroundColor: colors.background,
  },
  pressed: {
    opacity: 0.6,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
    backgroundColor: colors.card,
  },
  headerTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  iconBadge: {
    width: 32,
    height: 32,
    borderRadius: radius.sm,
    backgroundColor: colors.primarySoft,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: spacing.sm,
  },
  headerTitle: {
    fontSize: 17,
    fontWeight: '700',
    color: colors.dark,
  },
  closeBtn: {
    padding: spacing.xs,
  },
  scroll: {
    flex: 1,
  },
  content: {
    padding: spacing.lg,
    paddingBottom: spacing.xxl,
  },
  invoicePaper: {
    backgroundColor: colors.white,
    borderRadius: radius.lg,
    padding: spacing.lg,
    borderWidth: 1,
    borderColor: colors.border,
    shadowColor: colors.dark,
    shadowOpacity: 0.04,
    shadowRadius: 10,
    elevation: 2,
  },
  storeHeader: {
    alignItems: 'center',
    marginBottom: spacing.md,
  },
  storeName: {
    fontSize: 20,
    fontWeight: '800',
    color: colors.primary,
    letterSpacing: 0.5,
  },
  storeSub: {
    fontSize: 13,
    color: colors.textSecondary,
    marginTop: 2,
  },
  invoiceCode: {
    fontSize: 12,
    color: colors.textMuted,
    marginTop: 4,
  },
  dividerDashed: {
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
    borderStyle: 'dashed',
    marginVertical: spacing.md,
  },
  metaRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 6,
  },
  metaLabel: {
    fontSize: 13,
    color: colors.textSecondary,
  },
  metaValue: {
    fontSize: 13,
    fontWeight: '600',
    color: colors.dark,
  },
  statusBadge: {
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 4,
  },
  statusBadgeText: {
    fontSize: 11,
    fontWeight: '700',
  },
  statusPaid: {
    backgroundColor: '#E8F5E9',
  },
  statusPaidText: {
    color: '#2E7D32',
  },
  statusPending: {
    backgroundColor: '#FFF3E0',
  },
  statusPendingText: {
    color: '#E65100',
  },
  sectionHeading: {
    fontSize: 12,
    fontWeight: '700',
    color: colors.textMuted,
    letterSpacing: 0.5,
    marginBottom: spacing.xs,
  },
  customerName: {
    fontSize: 15,
    fontWeight: '700',
    color: colors.dark,
    marginBottom: 3,
  },
  customerDetail: {
    fontSize: 13,
    color: colors.textSecondary,
    lineHeight: 18,
    marginTop: 2,
  },
  tableHeader: {
    flexDirection: 'row',
    backgroundColor: '#F8F9FA',
    paddingVertical: spacing.xs,
    paddingHorizontal: spacing.xs,
    borderRadius: 4,
    marginTop: spacing.xs,
  },
  tableCol: {
    fontSize: 12,
  },
  colProd: {
    flex: 3,
  },
  colQty: {
    flex: 1,
    textAlign: 'center',
  },
  colPrice: {
    flex: 2,
    textAlign: 'right',
  },
  colTotal: {
    flex: 2,
    textAlign: 'right',
  },
  tableHeaderTitle: {
    fontWeight: '700',
    color: colors.textSecondary,
  },
  tableRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: spacing.xs,
    borderBottomWidth: 0.5,
    borderBottomColor: '#EEEEEE',
  },
  itemTitle: {
    fontSize: 12.5,
    fontWeight: '600',
    color: colors.dark,
  },
  itemVariant: {
    fontSize: 11,
    color: colors.textMuted,
    marginTop: 1,
  },
  itemText: {
    fontSize: 12,
    color: colors.textSecondary,
  },
  itemTotalText: {
    fontSize: 12,
    fontWeight: '700',
    color: colors.dark,
  },
  calcRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 6,
  },
  calcLabel: {
    fontSize: 13,
    color: colors.textSecondary,
  },
  calcValue: {
    fontSize: 13,
    fontWeight: '600',
    color: colors.dark,
  },
  discountVal: {
    color: colors.primary,
  },
  totalRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: spacing.sm,
    paddingTop: spacing.sm,
    borderTopWidth: 1.5,
    borderTopColor: colors.dark,
  },
  totalLabel: {
    fontSize: 14,
    fontWeight: '800',
    color: colors.dark,
  },
  totalValue: {
    fontSize: 17,
    fontWeight: '800',
    color: colors.primary,
  },
  footerNote: {
    marginTop: spacing.lg,
    paddingTop: spacing.md,
    borderTopWidth: 1,
    borderTopColor: '#EEEEEE',
  },
  footerNoteText: {
    fontSize: 11,
    color: colors.textMuted,
    textAlign: 'center',
    lineHeight: 16,
    fontStyle: 'italic',
  },
  actions: {
    marginTop: spacing.lg,
    gap: spacing.sm,
  },
  actionBtn: {
    marginBottom: spacing.xs,
  },
});
