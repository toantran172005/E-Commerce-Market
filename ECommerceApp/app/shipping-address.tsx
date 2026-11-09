import React, { useEffect, useState } from 'react';
import {
  Alert,
  Modal,
  Pressable,
  StyleSheet,
  Text,
  View,
  FlatList,
  ScrollView,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';

import {
  ScreenHeader,
  LoadingView,
  EmptyState,
  ConfirmSheet,
  Toast,
  PrimaryButton,
  FormField,
} from '../src/components';
import { colors, radius, spacing } from '../src/constants/theme';
import { useAddresses } from '../src/context/AddressesContext';
import { useCheckout } from '../src/context/CheckoutContext';
import { useAuth } from '../src/context/AuthContext';
import { Address, IoniconName } from '../src/types';
import { formatPhone, isValidPhoneVn } from '../src/utils/format';

interface AddressForm {
  label: string;
  fullName: string;
  phone: string;
  province: string;
  district: string;
  ward: string;
  street: string;
  address: string;
  isDefault: boolean;
}

interface AddressFormErrors {
  label?: string;
  fullName?: string;
  phone?: string;
  province?: string;
  district?: string;
  ward?: string;
  street?: string;
  address?: string;
}

interface AddressCardProps {
  address: Address;
  isSelected: boolean;
  onPress: () => void;
  onSetDefault: () => void;
  onEdit: () => void;
  onDelete: () => void;
}

/** Xác định icon cho nhãn địa chỉ: chỉ dùng briefcase-outline cho văn phòng/công ty, còn lại home-outline. */
function getAddressLabelIcon(label: string): IoniconName {
  const normalized = label.toLowerCase();
  if (
    normalized.includes('văn phòng') ||
    normalized.includes('công ty') ||
    normalized.includes('office')
  ) {
    return 'briefcase-outline';
  }
  return 'home-outline';
}

/** Card hiển thị một địa chỉ. */
function AddressCard({
  address,
  isSelected,
  onPress,
  onSetDefault,
  onEdit,
  onDelete,
}: AddressCardProps) {
  return (
    <View style={[styles.card, isSelected && styles.cardSelected]}>
      <Pressable
        onPress={onPress}
        style={styles.cardMainPress}
        accessibilityRole="button"
        accessibilityLabel={`Địa chỉ ${address.label}, ${address.fullName}, ${formatPhone(address.phone)}`}
        accessibilityState={{ selected: isSelected }}
      >
        <View style={styles.cardTop}>
          <View style={styles.typeIcon}>
            <Ionicons
              name={getAddressLabelIcon(address.label)}
              size={19}
              color={colors.primary}
            />
          </View>
          <Text style={styles.typeLabel}>{address.label}</Text>

          {address.isDefault ? (
            <View style={styles.defaultTag}>
              <Text style={styles.defaultTagText}>MẶC ĐỊNH</Text>
            </View>
          ) : null}

          <View style={[styles.radio, isSelected && styles.radioSelected]}>
            {isSelected ? <View style={styles.radioDot} /> : null}
          </View>
        </View>

        <View style={styles.infoRow}>
          <Ionicons name="person-outline" size={15} color={colors.textMuted} style={styles.infoIcon} />
          <Text style={styles.nameText}>{address.fullName}</Text>
        </View>

        <View style={styles.infoRow}>
          <Ionicons name="call-outline" size={15} color={colors.textMuted} style={styles.infoIcon} />
          <Text style={styles.phoneText}>{formatPhone(address.phone)}</Text>
        </View>

        <View style={styles.infoRow}>
          <Ionicons name="location-outline" size={15} color={colors.textMuted} style={styles.infoIcon} />
          <Text style={styles.addressText}>{address.address}</Text>
        </View>
      </Pressable>

      <View style={styles.divider} />

      <View style={styles.cardActions}>
        {!address.isDefault ? (
          <Pressable
            onPress={onSetDefault}
            style={({ pressed }) => [styles.actionBtn, styles.setDefaultBtn, pressed && styles.pressed]}
            hitSlop={8}
            accessibilityRole="button"
            accessibilityLabel="Đặt làm mặc định"
          >
            <Ionicons name="checkmark-circle-outline" size={16} color={colors.primary} />
            <Text style={styles.setDefaultText}>Đặt làm mặc định</Text>
          </Pressable>
        ) : (
          <View style={styles.setDefaultPlaceholder} />
        )}

        <View style={styles.actionsRight}>
          <Pressable
            onPress={onEdit}
            style={({ pressed }) => [styles.actionBtn, pressed && styles.pressed]}
            hitSlop={8}
            accessibilityRole="button"
            accessibilityLabel={`Chỉnh sửa địa chỉ ${address.label}`}
          >
            <Ionicons name="create-outline" size={17} color={colors.textSecondary} />
            <Text style={styles.actionText}>Chỉnh sửa</Text>
          </Pressable>

          <Pressable
            onPress={onDelete}
            style={({ pressed }) => [styles.actionBtn, pressed && styles.pressed]}
            hitSlop={8}
            accessibilityRole="button"
            accessibilityLabel={`Xóa địa chỉ ${address.label}`}
          >
            <Ionicons name="trash-outline" size={17} color={colors.danger} />
            <Text style={[styles.actionText, styles.deleteText]}>Xóa</Text>
          </Pressable>
        </View>
      </View>
    </View>
  );
}

export default function ShippingAddressScreen() {
  const router = useRouter();
  const { user } = useAuth();
  const { addresses, defaultAddress, loading, addAddress, updateAddress, removeAddress, setDefault } =
    useAddresses();
  const { addressId: checkoutAddressId, setAddressId } = useCheckout();

  // Chọn địa chỉ hiện tại từ checkout nếu có, ngược lại dùng mặc định.
  const initialSelectedId = checkoutAddressId || defaultAddress?.id || addresses[0]?.id || '';
  const [selectedId, setSelectedId] = useState(initialSelectedId);

  // Modal thêm / sửa địa chỉ.
  const [modalVisible, setModalVisible] = useState(false);
  const [editingAddress, setEditingAddress] = useState<Address | null>(null);
  const [form, setForm] = useState<AddressForm>({
    label: 'Nhà riêng',
    fullName: user?.fullName ?? '',
    phone: user?.phoneNumber ?? '',
    province: '',
    district: '',
    ward: '',
    street: '',
    address: '',
    isDefault: false,
  });
  const [formErrors, setFormErrors] = useState<AddressFormErrors>({});
  const [submitting, setSubmitting] = useState(false);

  // Xác nhận xoá.
  const [addressToDelete, setAddressToDelete] = useState<Address | null>(null);

  // Toast thông báo.
  const [toastVisible, setToastVisible] = useState(false);
  const [toastMessage, setToastMessage] = useState('');

  // Tự đồng bộ selectedId khi danh sách thay đổi.
  useEffect(() => {
    if (!addresses.some((a) => a.id === selectedId)) {
      setSelectedId(defaultAddress?.id ?? addresses[0]?.id ?? '');
    }
  }, [addresses, selectedId, defaultAddress]);

  const handleSelect = (id: string) => setSelectedId(id);

  const handleConfirm = () => {
    if (!selectedId) {
      Alert.alert('Chưa chọn địa chỉ', 'Vui lòng chọn một địa chỉ nhận hàng.');
      return;
    }
    setAddressId(selectedId);
    setToastMessage('Đã cập nhật địa chỉ nhận hàng thành công!');
    setToastVisible(true);
  };

  const openAddModal = () => {
    setEditingAddress(null);
    setForm({
      label: 'Nhà riêng',
      fullName: user?.fullName ?? '',
      phone: user?.phoneNumber ?? '',
      province: '',
      district: '',
      ward: '',
      street: '',
      address: '',
      isDefault: addresses.length === 0,
    });
    setFormErrors({});
    setModalVisible(true);
  };

  const openEditModal = (address: Address) => {
    setEditingAddress(address);
    setForm({
      label: address.label,
      fullName: address.fullName,
      phone: address.phone,
      province: address.province ?? '',
      district: address.district ?? '',
      ward: address.ward ?? '',
      street: address.street ?? address.address ?? '',
      address: address.address,
      isDefault: address.isDefault,
    });
    setFormErrors({});
    setModalVisible(true);
  };

  const closeModal = () => setModalVisible(false);

  const setQuickLabel = (label: string) => {
    setForm((prev) => ({ ...prev, label }));
    setFormErrors((prev) => ({ ...prev, label: undefined }));
  };

  const validateForm = (): boolean => {
    const errors: AddressFormErrors = {};

    if (!form.label.trim()) errors.label = 'Vui lòng nhập nhãn địa chỉ';
    if (!form.fullName.trim()) errors.fullName = 'Vui lòng nhập họ và tên người nhận';
    if (!isValidPhoneVn(form.phone)) errors.phone = 'Số điện thoại không hợp lệ (10 chữ số)';
    if (!form.province.trim()) errors.province = 'Vui lòng nhập Tỉnh/Thành phố';
    if (!form.district.trim()) errors.district = 'Vui lòng nhập Quận/Huyện';
    if (!form.ward.trim()) errors.ward = 'Vui lòng nhập Phường/Xã';
    if (!form.street.trim()) errors.street = 'Vui lòng nhập địa chỉ chi tiết (số nhà, tên đường)';

    setFormErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleSubmitForm = async () => {
    if (!validateForm()) return;

    setSubmitting(true);
    try {
      const fullAddressText = [
        form.street.trim(),
        form.ward.trim(),
        form.district.trim(),
        form.province.trim(),
      ]
        .filter(Boolean)
        .join(', ');

      const payload = {
        label: form.label.trim(),
        fullName: form.fullName.trim(),
        phone: form.phone.trim(),
        province: form.province.trim(),
        district: form.district.trim(),
        ward: form.ward.trim(),
        street: form.street.trim(),
        address: fullAddressText,
        isDefault: form.isDefault,
      };

      if (editingAddress) {
        await updateAddress(editingAddress.id, payload);
      } else {
        await addAddress(payload);
      }
      setModalVisible(false);
      setToastMessage('Đã lưu địa chỉ thành công!');
      setToastVisible(true);
    } catch (error) {
      Alert.alert('Lỗi', 'Không thể lưu địa chỉ. Vui lòng thử lại.');
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = (address: Address) => {
    setAddressToDelete(address);
  };

  const confirmDelete = async () => {
    if (!addressToDelete) return;
    try {
      await removeAddress(addressToDelete.id);
      setAddressToDelete(null);
    } catch (error) {
      Alert.alert('Lỗi', 'Không thể xoá địa chỉ. Vui lòng thử lại.');
    }
  };

  const handleSetDefault = async (address: Address) => {
    try {
      await setDefault(address.id);
      setToastMessage('Đã đặt địa chỉ mặc định thành công!');
      setToastVisible(true);
    } catch (error) {
      Alert.alert('Lỗi', 'Không thể đặt mặc định. Vui lòng thử lại.');
    }
  };

  const renderAddress = ({ item }: { item: Address }) => (
    <AddressCard
      address={item}
      isSelected={selectedId === item.id}
      onPress={() => handleSelect(item.id)}
      onSetDefault={() => handleSetDefault(item)}
      onEdit={() => openEditModal(item)}
      onDelete={() => handleDelete(item)}
    />
  );

  const listHeader = !loading && addresses.length > 0 ? (
    <Text style={styles.sectionHint}>
      Chọn địa chỉ bạn muốn nhận đơn hàng. Bạn có thể chỉnh sửa hoặc xóa địa chỉ bất cứ lúc nào.
    </Text>
  ) : undefined;

  const listEmpty = loading ? (
    <LoadingView label="Đang tải địa chỉ..." />
  ) : (
    <EmptyState
      icon="location-outline"
      title="Chưa có địa chỉ nào"
      subtitle="Thêm địa chỉ nhận hàng để tiến hành đặt đơn nhanh hơn."
      actionLabel="Thêm địa chỉ mới"
      onAction={openAddModal}
    />
  );

  return (
    <SafeAreaView style={styles.safe} edges={['top', 'bottom']}>
      <ScreenHeader
        title="Địa chỉ nhận hàng"
        right={
          <Pressable
            onPress={openAddModal}
            style={({ pressed }) => [styles.headerAddBtn, pressed && styles.pressed]}
            hitSlop={8}
            accessibilityRole="button"
            accessibilityLabel="Thêm địa chỉ mới"
          >
            <Ionicons name="add" size={22} color={colors.primary} />
            <Text style={styles.headerAddText}>Thêm</Text>
          </Pressable>
        }
      />

      <FlatList
        data={addresses}
        keyExtractor={(item) => item.id}
        renderItem={renderAddress}
        ListHeaderComponent={listHeader}
        ListEmptyComponent={listEmpty}
        ListFooterComponent={
          !loading && addresses.length > 0 ? (
            <Pressable
              onPress={openAddModal}
              style={({ pressed }) => [styles.addNewCard, pressed && styles.pressed]}
              accessibilityRole="button"
              accessibilityLabel="Thêm địa chỉ nhận hàng mới"
            >
              <Ionicons name="add-circle-outline" size={26} color={colors.primary} />
              <Text style={styles.addNewCardText}>Thêm địa chỉ nhận hàng mới</Text>
            </Pressable>
          ) : undefined
        }
        contentContainerStyle={styles.listContent}
        showsVerticalScrollIndicator={false}
      />

      <View style={styles.footer}>
        <PrimaryButton
          title="Xác nhận địa chỉ"
          onPress={handleConfirm}
          disabled={!selectedId}
        />
      </View>

      {/* Modal thêm / sửa địa chỉ */}
      <Modal
        visible={modalVisible}
        animationType="slide"
        presentationStyle="pageSheet"
        onRequestClose={closeModal}
      >
        <SafeAreaView style={styles.modalSafe} edges={['top', 'bottom']}>
          <ScreenHeader
            title={editingAddress ? 'Chỉnh sửa địa chỉ' : 'Thêm địa chỉ mới'}
            onBack={closeModal}
          />
          <ScrollView
            style={styles.modalScroll}
            contentContainerStyle={styles.modalContent}
            keyboardShouldPersistTaps="handled"
            showsVerticalScrollIndicator={false}
          >
            <FormField
              label="Nhãn địa chỉ"
              value={form.label}
              onChangeText={(text) => setForm((prev) => ({ ...prev, label: text }))}
              placeholder="Ví dụ: Nhà riêng, Văn phòng"
              error={formErrors.label}
              icon="pricetag-outline"
            />

            {/* Chip chọn nhanh */}
            <View style={styles.labelChipRow}>
              <Pressable
                onPress={() => setQuickLabel('Nhà riêng')}
                style={[
                  styles.labelChip,
                  form.label === 'Nhà riêng' && styles.labelChipActive,
                ]}
              >
                <Ionicons
                  name="home-outline"
                  size={16}
                  color={form.label === 'Nhà riêng' ? colors.white : colors.primary}
                />
                <Text
                  style={[
                    styles.labelChipText,
                    form.label === 'Nhà riêng' && styles.labelChipTextActive,
                  ]}
                >
                  Nhà riêng
                </Text>
              </Pressable>

              <Pressable
                onPress={() => setQuickLabel('Văn phòng')}
                style={[
                  styles.labelChip,
                  form.label === 'Văn phòng' && styles.labelChipActive,
                ]}
              >
                <Ionicons
                  name="briefcase-outline"
                  size={16}
                  color={form.label === 'Văn phòng' ? colors.white : colors.primary}
                />
                <Text
                  style={[
                    styles.labelChipText,
                    form.label === 'Văn phòng' && styles.labelChipTextActive,
                  ]}
                >
                  Văn phòng
                </Text>
              </Pressable>
            </View>

            <FormField
              label="Họ và tên người nhận"
              value={form.fullName}
              onChangeText={(text) => setForm((prev) => ({ ...prev, fullName: text }))}
              placeholder="Nhập họ tên người nhận"
              error={formErrors.fullName}
              icon="person-outline"
            />
            <FormField
              label="Số điện thoại người nhận"
              value={form.phone}
              onChangeText={(text) => setForm((prev) => ({ ...prev, phone: text }))}
              placeholder="0901234567"
              error={formErrors.phone}
              icon="call-outline"
              keyboardType="phone-pad"
            />
            <FormField
              label="Tỉnh / Thành phố"
              value={form.province}
              onChangeText={(text) => setForm((prev) => ({ ...prev, province: text }))}
              placeholder="Ví dụ: TP. Hồ Chí Minh, Hà Nội"
              error={formErrors.province}
              icon="location-outline"
            />
            <FormField
              label="Quận / Huyện"
              value={form.district}
              onChangeText={(text) => setForm((prev) => ({ ...prev, district: text }))}
              placeholder="Ví dụ: Quận 1, Quận Bình Thạnh"
              error={formErrors.district}
              icon="business-outline"
            />
            <FormField
              label="Phường / Xã"
              value={form.ward}
              onChangeText={(text) => setForm((prev) => ({ ...prev, ward: text }))}
              placeholder="Ví dụ: Phường Bến Nghé, Phường 25"
              error={formErrors.ward}
              icon="map-outline"
            />
            <FormField
              label="Địa chỉ chi tiết"
              value={form.street}
              onChangeText={(text) => setForm((prev) => ({ ...prev, street: text }))}
              placeholder="Số nhà, tên đường, tòa nhà, ngõ/ngách"
              error={formErrors.street}
              icon="navigate-outline"
              multiline
            />

            <View style={{ marginTop: spacing.md, marginBottom: spacing.xl }}>
              <PrimaryButton
                title={editingAddress ? 'Cập nhật địa chỉ' : 'Thêm địa chỉ'}
                onPress={handleSubmitForm}
                loading={submitting}
              />
            </View>
          </ScrollView>
        </SafeAreaView>
      </Modal>

      {/* Xác nhận xoá */}
      <ConfirmSheet
        visible={addressToDelete !== null}
        title="Xóa địa chỉ"
        message={`Bạn có chắc chắn muốn xóa địa chỉ "${addressToDelete?.label}" không?`}
        confirmText="Xóa"
        cancelText="Hủy"
        danger
        onConfirm={confirmDelete}
        onCancel={() => setAddressToDelete(null)}
      />

      {/* Toast thông báo */}
      <Toast
        message={toastMessage}
        visible={toastVisible}
        duration={1200}
        onHide={() => {
          setToastVisible(false);
          // Không tự động router.back() để cho phép chỉnh sửa/xoá liên tục.
          // router.back() vẫn có thể dùng khi cần, nhưng hiện tại không bắt buộc.
        }}
      />
    </SafeAreaView>
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
  headerAddBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: spacing.sm,
    paddingVertical: spacing.xs,
  },
  headerAddText: {
    marginLeft: spacing.xs,
    fontSize: 15,
    fontWeight: '700',
    color: colors.primary,
  },
  listContent: {
    padding: spacing.lg,
    paddingBottom: spacing.xl,
  },
  sectionHint: {
    fontSize: 13,
    lineHeight: 19,
    color: colors.textMuted,
    marginBottom: spacing.md,
  },
  addNewCard: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    minHeight: 64,
    borderWidth: 1.5,
    borderStyle: 'dashed',
    borderColor: colors.primary,
    backgroundColor: colors.card,
    borderRadius: radius.lg,
    marginTop: spacing.sm,
  },
  addNewCardText: {
    marginLeft: spacing.sm,
    fontSize: 15,
    fontWeight: '700',
    color: colors.primary,
  },

  /* Card */
  card: {
    backgroundColor: colors.card,
    borderRadius: radius.lg,
    borderWidth: 1.5,
    borderColor: colors.border,
    padding: spacing.lg,
    marginBottom: spacing.md,
  },
  cardSelected: {
    borderColor: colors.primary,
    backgroundColor: colors.primarySoft,
  },
  cardMainPress: {
    // Không cần style, chỉ để tách vùng chọn địa chỉ.
  },
  cardTop: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: spacing.md,
  },
  typeIcon: {
    width: 34,
    height: 34,
    borderRadius: radius.md,
    backgroundColor: colors.primarySoft,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: spacing.sm,
  },
  typeLabel: {
    fontSize: 14,
    fontWeight: '700',
    color: colors.dark,
  },
  defaultTag: {
    marginLeft: spacing.sm,
    paddingHorizontal: spacing.sm,
    paddingVertical: 3,
    borderRadius: radius.sm,
    backgroundColor: colors.primarySoft,
  },
  defaultTagText: {
    fontSize: 10,
    fontWeight: '800',
    letterSpacing: 0.5,
    color: colors.primary,
  },
  radio: {
    marginLeft: 'auto',
    width: 22,
    height: 22,
    borderRadius: 11,
    borderWidth: 2,
    borderColor: colors.grayLight,
    alignItems: 'center',
    justifyContent: 'center',
  },
  radioSelected: {
    borderColor: colors.primary,
  },
  radioDot: {
    width: 10,
    height: 10,
    borderRadius: 5,
    backgroundColor: colors.primary,
  },

  /* Info rows */
  infoRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginTop: spacing.xs,
  },
  infoIcon: {
    marginTop: 2,
    marginRight: spacing.sm,
  },
  nameText: {
    flex: 1,
    fontSize: 15,
    fontWeight: '700',
    color: colors.dark,
  },
  phoneText: {
    flex: 1,
    fontSize: 13.5,
    color: colors.textSecondary,
  },
  addressText: {
    flex: 1,
    fontSize: 13.5,
    lineHeight: 20,
    color: colors.dark,
  },

  divider: {
    height: 1,
    backgroundColor: colors.border,
    marginTop: spacing.md,
    marginBottom: spacing.sm,
  },

  /* Card actions */
  cardActions: {
    flexDirection: 'row',
    alignItems: 'center',
    minHeight: 44,
  },
  setDefaultBtn: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  setDefaultText: {
    marginLeft: spacing.xs,
    fontSize: 13,
    fontWeight: '600',
    color: colors.primary,
  },
  setDefaultPlaceholder: {
    flex: 1,
  },
  actionsRight: {
    flexDirection: 'row',
    alignItems: 'center',
    marginLeft: 'auto',
  },
  actionBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: spacing.xs,
    paddingHorizontal: spacing.sm,
    marginLeft: spacing.sm,
    minHeight: 36,
  },
  actionText: {
    marginLeft: spacing.xs,
    fontSize: 13,
    fontWeight: '600',
    color: colors.textSecondary,
  },
  deleteText: {
    color: colors.danger,
  },

  /* Footer */
  footer: {
    paddingHorizontal: spacing.lg,
    paddingTop: spacing.md,
    paddingBottom: spacing.md,
    backgroundColor: colors.card,
    borderTopWidth: 1,
    borderTopColor: colors.border,
  },

  /* Modal */
  modalSafe: {
    flex: 1,
    backgroundColor: colors.background,
  },
  modalScroll: {
    flex: 1,
  },
  modalContent: {
    padding: spacing.lg,
  },

  /* Chip chọn nhãn */
  labelChipRow: {
    flexDirection: 'row',
    marginTop: spacing.sm,
    marginBottom: spacing.sm,
  },
  labelChip: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1.5,
    borderColor: colors.border,
    backgroundColor: colors.card,
    borderRadius: radius.pill,
    paddingVertical: spacing.sm,
    paddingHorizontal: spacing.md,
    marginRight: spacing.sm,
  },
  labelChipActive: {
    backgroundColor: colors.primary,
    borderColor: colors.primary,
  },
  labelChipText: {
    marginLeft: spacing.xs,
    fontSize: 13,
    fontWeight: '600',
    color: colors.primary,
  },
  labelChipTextActive: {
    color: colors.white,
  },
});
