import React, { useEffect, useRef, useState } from "react";
import {
  Alert,
  Animated,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import { colors as themeColors } from "../src/constants/theme";

const colors = {
  primary: themeColors?.primary ?? "#FF5722",
  dark: themeColors?.dark ?? "#1A1A1A",
  background: themeColors?.background ?? "#F8F9FB",
  border: themeColors?.border ?? "#ECEEF1",
  white: themeColors?.white ?? "#FFFFFF",
};

type AddressItem = {
  id: string;
  label: string;
  icon: keyof typeof Ionicons.glyphMap;
  iconColor: string;
  iconBg: string;
  isDefault: boolean;
  fullName: string;
  phone: string;
  address: string;
};

const INITIAL_ADDRESSES: AddressItem[] = [
  {
    id: "home",
    label: "Nhà riêng",
    icon: "home",
    iconColor: colors.primary,
    iconBg: "#FFEDE6",
    isDefault: true,
    fullName: "Trần Minh Alex",
    phone: "+84 901 284 920",
    address: "248 Đường Nguyễn Văn Cừ, Phường 4, Quận 5, TP. Hồ Chí Minh",
  },
  {
    id: "office",
    label: "Văn phòng",
    icon: "business",
    iconColor: "#8A8F9B",
    iconBg: "#F1F3F6",
    isDefault: false,
    fullName: "Trần Minh Alex",
    phone: "+84 901 284 920",
    address:
      "Tòa nhà Bitexco, Tầng 12, Số 2 Hải Triều, Phường Bến Nghé, Quận 1, TP. Hồ Chí Minh",
  },
];

export default function ShippingAddressScreen() {
  const router = useRouter();

  const [addresses, setAddresses] = useState<AddressItem[]>(INITIAL_ADDRESSES);
  const [selectedId, setSelectedId] = useState<string>(
    INITIAL_ADDRESSES.find((item) => item.isDefault)?.id ??
      INITIAL_ADDRESSES[0]?.id ??
      ""
  );

  const toastOpacity = useRef(new Animated.Value(0)).current;
  const [toastVisible, setToastVisible] = useState(false);
  const backTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    return () => {
      if (backTimer.current) clearTimeout(backTimer.current);
    };
  }, []);

  const handleSetDefault = (id: string) => {
    setAddresses((prev) =>
      prev.map((item) => ({ ...item, isDefault: item.id === id }))
    );
  };

  const handleEdit = (item: AddressItem) => {
    Alert.alert(
      "Chỉnh sửa địa chỉ",
      `Tính năng chỉnh sửa "${item.label}" sẽ sớm được cập nhật.`,
      [{ text: "Đã hiểu", style: "default" }]
    );
  };

  const handleDelete = (item: AddressItem) => {
    Alert.alert(
      "Xóa địa chỉ",
      `Bạn có chắc chắn muốn xóa địa chỉ "${item.label}" không?`,
      [
        { text: "Hủy", style: "cancel" },
        {
          text: "Xóa",
          style: "destructive",
          onPress: () => {
            const remaining = addresses.filter((a) => a.id !== item.id);
            if (item.isDefault && remaining.length > 0) {
              remaining[0] = { ...remaining[0], isDefault: true };
            }
            setAddresses(remaining);
            if (selectedId === item.id) {
              setSelectedId(remaining[0]?.id ?? "");
            }
          },
        },
      ]
    );
  };

  const handleAddNew = () => {
    Alert.alert(
      "Thêm địa chỉ mới",
      "Màn hình thêm địa chỉ sẽ sớm được cập nhật.",
      [{ text: "Đã hiểu", style: "default" }]
    );
  };

  const handleConfirm = () => {
    if (!selectedId) {
      Alert.alert("Chưa chọn địa chỉ", "Vui lòng chọn một địa chỉ nhận hàng.");
      return;
    }

    setToastVisible(true);
    Animated.timing(toastOpacity, {
      toValue: 1,
      duration: 200,
      useNativeDriver: true,
    }).start();

    backTimer.current = setTimeout(() => {
      Animated.timing(toastOpacity, {
        toValue: 0,
        duration: 200,
        useNativeDriver: true,
      }).start(() => {
        router.back();
      });
    }, 1200);
  };

  return (
    <SafeAreaView style={styles.safe} edges={["top", "bottom"]}>
      {/* Header */}
      <View style={styles.header}>
        <Pressable
          style={({ pressed }) => [styles.backBtn, pressed && styles.pressed]}
          onPress={() => router.back()}
          hitSlop={8}
        >
          <Ionicons name="arrow-back" size={22} color={colors.dark} />
        </Pressable>
        <Text style={styles.headerTitle}>Địa chỉ nhận hàng</Text>
        <View style={styles.headerSpacer} />
      </View>

      <ScrollView
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        <Text style={styles.sectionHint}>
          Chọn địa chỉ bạn muốn nhận đơn hàng. Bạn có thể chỉnh sửa hoặc xóa địa
          chỉ bất cứ lúc nào.
        </Text>

        {addresses.length === 0 ? (
          <View style={styles.emptyBox}>
            <Ionicons name="location-outline" size={44} color="#C7CCD6" />
            <Text style={styles.emptyTitle}>Chưa có địa chỉ nào</Text>
            <Text style={styles.emptyText}>
              Thêm địa chỉ nhận hàng để tiến hành đặt đơn nhanh hơn.
            </Text>
          </View>
        ) : (
          addresses.map((item) => {
            const isSelected = selectedId === item.id;
            return (
              <Pressable
                key={item.id}
                style={[styles.card, isSelected && styles.cardSelected]}
                onPress={() => setSelectedId(item.id)}
                android_ripple={{ color: "#F1F3F6" }}
              >
                <View style={styles.cardTop}>
                  <View
                    style={[styles.typeIcon, { backgroundColor: item.iconBg }]}
                  >
                    <Ionicons
                      name={item.icon}
                      size={19}
                      color={item.iconColor}
                    />
                  </View>
                  <Text style={styles.typeLabel}>{item.label}</Text>

                  {item.isDefault ? (
                    <View style={styles.defaultTag}>
                      <Text style={styles.defaultTagText}>MẶC ĐỊNH</Text>
                    </View>
                  ) : null}

                  <View
                    style={[styles.radio, isSelected && styles.radioSelected]}
                  >
                    {isSelected ? <View style={styles.radioDot} /> : null}
                  </View>
                </View>

                <View style={styles.infoRow}>
                  <Ionicons
                    name="person-outline"
                    size={15}
                    color="#9AA0AB"
                    style={styles.infoIcon}
                  />
                  <Text style={styles.nameText}>{item.fullName}</Text>
                </View>

                <View style={styles.infoRow}>
                  <Ionicons
                    name="call-outline"
                    size={15}
                    color="#9AA0AB"
                    style={styles.infoIcon}
                  />
                  <Text style={styles.phoneText}>{item.phone}</Text>
                </View>

                <View style={styles.infoRow}>
                  <Ionicons
                    name="location-outline"
                    size={15}
                    color="#9AA0AB"
                    style={styles.infoIcon}
                  />
                  <Text style={styles.addressText}>{item.address}</Text>
                </View>

                <View style={styles.divider} />

                <View style={styles.cardActions}>
                  {!item.isDefault ? (
                    <Pressable
                      style={({ pressed }) => [
                        styles.setDefaultBtn,
                        pressed && styles.pressed,
                      ]}
                      onPress={() => handleSetDefault(item.id)}
                      hitSlop={6}
                    >
                      <Ionicons
                        name="checkmark-circle-outline"
                        size={16}
                        color={colors.primary}
                      />
                      <Text style={styles.setDefaultText}>
                        Đặt làm mặc định
                      </Text>
                    </Pressable>
                  ) : (
                    <View style={styles.setDefaultPlaceholder} />
                  )}

                  <View style={styles.actionsRight}>
                    <Pressable
                      style={({ pressed }) => [
                        styles.actionBtn,
                        pressed && styles.pressed,
                      ]}
                      onPress={() => handleEdit(item)}
                      hitSlop={6}
                    >
                      <Ionicons
                        name="create-outline"
                        size={17}
                        color="#6B7280"
                      />
                      <Text style={styles.actionText}>Chỉnh sửa</Text>
                    </Pressable>

                    <Pressable
                      style={({ pressed }) => [
                        styles.actionBtn,
                        pressed && styles.pressed,
                      ]}
                      onPress={() => handleDelete(item)}
                      hitSlop={6}
                    >
                      <Ionicons name="trash-outline" size={17} color="#E5484D" />
                      <Text style={[styles.actionText, styles.deleteText]}>
                        Xóa
                      </Text>
                    </Pressable>
                  </View>
                </View>
              </Pressable>
            );
          })
        )}

        <Pressable
          style={({ pressed }) => [styles.addBtn, pressed && styles.pressed]}
          onPress={handleAddNew}
        >
          <Ionicons name="add-circle-outline" size={20} color={colors.primary} />
          <Text style={styles.addText}>Thêm địa chỉ mới</Text>
        </Pressable>
      </ScrollView>

      {/* Footer */}
      <View style={styles.footer}>
        <Pressable
          style={({ pressed }) => [
            styles.confirmBtn,
            pressed && styles.confirmBtnPressed,
          ]}
          onPress={handleConfirm}
        >
          <Ionicons
            name="checkmark-circle"
            size={20}
            color={colors.white}
            style={styles.confirmIcon}
          />
          <Text style={styles.confirmText}>Xác nhận địa chỉ</Text>
        </Pressable>
      </View>

      {/* Toast */}
      {toastVisible ? (
        <Animated.View style={[styles.toast, { opacity: toastOpacity }]}>
          <Ionicons name="checkmark-circle" size={20} color="#4ADE80" />
          <Text style={styles.toastText}>
            Đã cập nhật địa chỉ nhận hàng thành công!
          </Text>
        </Animated.View>
      ) : null}
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

  /* Header */
  header: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 12,
    paddingVertical: 8,
    backgroundColor: colors.white,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  backBtn: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: colors.background,
  },
  headerTitle: {
    flex: 1,
    textAlign: "center",
    fontSize: 17,
    fontWeight: "700",
    color: colors.dark,
  },
  headerSpacer: {
    width: 40,
  },

  /* Scroll content */
  scrollContent: {
    padding: 16,
    paddingBottom: 28,
  },
  sectionHint: {
    fontSize: 13,
    lineHeight: 19,
    color: "#8A8F9B",
    marginBottom: 14,
  },

  /* Card */
  card: {
    backgroundColor: colors.white,
    borderRadius: 16,
    borderWidth: 1.5,
    borderColor: colors.border,
    padding: 16,
    marginBottom: 14,
    overflow: "hidden",
  },
  cardSelected: {
    borderColor: colors.primary,
    backgroundColor: "#FFF9F6",
  },
  cardTop: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 12,
  },
  typeIcon: {
    width: 34,
    height: 34,
    borderRadius: 10,
    alignItems: "center",
    justifyContent: "center",
    marginRight: 10,
  },
  typeLabel: {
    fontSize: 14,
    fontWeight: "700",
    color: colors.dark,
  },
  defaultTag: {
    marginLeft: 8,
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 6,
    backgroundColor: "#FFEDE6",
  },
  defaultTagText: {
    fontSize: 10,
    fontWeight: "800",
    letterSpacing: 0.5,
    color: colors.primary,
  },
  radio: {
    marginLeft: "auto",
    width: 22,
    height: 22,
    borderRadius: 11,
    borderWidth: 2,
    borderColor: "#D6DAE1",
    alignItems: "center",
    justifyContent: "center",
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
    flexDirection: "row",
    alignItems: "flex-start",
    marginTop: 6,
  },
  infoIcon: {
    marginTop: 2,
    marginRight: 8,
  },
  nameText: {
    flex: 1,
    fontSize: 15,
    fontWeight: "700",
    color: colors.dark,
  },
  phoneText: {
    flex: 1,
    fontSize: 13.5,
    color: "#6B7280",
  },
  addressText: {
    flex: 1,
    fontSize: 13.5,
    lineHeight: 20,
    color: "#4B5563",
  },

  divider: {
    height: 1,
    backgroundColor: colors.border,
    marginTop: 14,
    marginBottom: 10,
  },

  /* Card actions */
  cardActions: {
    flexDirection: "row",
    alignItems: "center",
  },
  setDefaultBtn: {
    flexDirection: "row",
    alignItems: "center",
  },
  setDefaultText: {
    marginLeft: 5,
    fontSize: 13,
    fontWeight: "600",
    color: colors.primary,
  },
  setDefaultPlaceholder: {
    flex: 1,
  },
  actionsRight: {
    flexDirection: "row",
    alignItems: "center",
    marginLeft: "auto",
  },
  actionBtn: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 4,
    paddingHorizontal: 6,
    marginLeft: 6,
  },
  actionText: {
    marginLeft: 4,
    fontSize: 13,
    fontWeight: "600",
    color: "#6B7280",
  },
  deleteText: {
    color: "#E5484D",
  },

  /* Add new */
  addBtn: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 16,
    borderRadius: 16,
    borderWidth: 1.5,
    borderStyle: "dashed",
    borderColor: colors.primary,
    backgroundColor: colors.white,
    marginTop: 2,
  },
  addText: {
    marginLeft: 8,
    fontSize: 15,
    fontWeight: "700",
    color: colors.primary,
  },

  /* Empty state */
  emptyBox: {
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 40,
    paddingHorizontal: 24,
    borderRadius: 16,
    borderWidth: 1.5,
    borderStyle: "dashed",
    borderColor: colors.border,
    backgroundColor: colors.white,
    marginBottom: 14,
  },
  emptyTitle: {
    marginTop: 12,
    fontSize: 15,
    fontWeight: "700",
    color: colors.dark,
  },
  emptyText: {
    marginTop: 6,
    fontSize: 13,
    lineHeight: 19,
    textAlign: "center",
    color: "#8A8F9B",
  },

  /* Footer */
  footer: {
    paddingHorizontal: 16,
    paddingTop: 12,
    paddingBottom: 12,
    backgroundColor: colors.white,
    borderTopWidth: 1,
    borderTopColor: colors.border,
  },
  confirmBtn: {
    height: 54,
    borderRadius: 16,
    backgroundColor: colors.primary,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    shadowColor: colors.primary,
    shadowOpacity: 0.32,
    shadowRadius: 12,
    shadowOffset: { width: 0, height: 6 },
    elevation: 5,
  },
  confirmBtnPressed: {
    opacity: 0.85,
  },
  confirmIcon: {
    marginRight: 8,
  },
  confirmText: {
    fontSize: 16,
    fontWeight: "700",
    color: colors.white,
  },

  /* Toast */
  toast: {
    position: "absolute",
    left: 24,
    right: 24,
    bottom: 100,
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 14,
    backgroundColor: colors.dark,
    shadowColor: "#000000",
    shadowOpacity: 0.2,
    shadowRadius: 12,
    shadowOffset: { width: 0, height: 6 },
    elevation: 8,
  },
  toastText: {
    flex: 1,
    marginLeft: 8,
    fontSize: 13.5,
    fontWeight: "600",
    color: colors.white,
  },
});