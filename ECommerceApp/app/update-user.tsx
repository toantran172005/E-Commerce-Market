import React, { useEffect, useMemo, useState } from 'react';
import {
  Alert,
  Image,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import * as ImagePicker from 'expo-image-picker';

import { colors, radius, spacing } from '../src/constants/theme';
import { useAuth } from '../src/context/AuthContext';
import { isValidEmail, isValidPhoneVn } from '../src/utils/format';
import {
  FormField,
  LoadingView,
  PrimaryButton,
  SecondaryButton,
  ScreenHeader,
} from '../src/components';
import type { UserProfile } from '../src/types';

type ProfileField = 'fullName' | 'email' | 'phone' | 'address';

export default function UpdateUserScreen() {
  const router = useRouter();
  const { user, isLoading, updateProfile } = useAuth();

  const [fullName, setFullName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [address, setAddress] = useState('');
  const [avatarUri, setAvatarUri] = useState<string | null>(null);
  const [avatarChanged, setAvatarChanged] = useState(false);
  const [saving, setSaving] = useState(false);
  const [errors, setErrors] = useState<Partial<Record<ProfileField, string>>>({});

  // Đồng bộ dữ liệu từ AuthContext khi user thay đổi
  useEffect(() => {
    if (user) {
      setFullName(user.fullName ?? '');
      setEmail(user.email ?? '');
      setPhone(user.phoneNumber ?? '');
      setAddress(user.address ?? '');
      setAvatarUri(user.avatarUrl ?? null);
      setAvatarChanged(false);
      setErrors({});
    }
  }, [user]);

  const initials = useMemo(() => {
    const parts = fullName.trim().split(/\s+/).filter(Boolean);
    if (parts.length === 0) return 'U';
    if (parts.length === 1) return parts[0].charAt(0).toUpperCase();
    return (parts[0].charAt(0) + parts[parts.length - 1].charAt(0)).toUpperCase();
  }, [fullName]);

  const hasChanges = useMemo(() => {
    if (!user) return false;
    return (
      fullName !== (user.fullName ?? '') ||
      email !== user.email ||
      phone !== (user.phoneNumber ?? '') ||
      address !== (user.address ?? '') ||
      avatarChanged
    );
  }, [fullName, email, phone, address, avatarChanged, user]);

  const updateField = (key: ProfileField, value: string) => {
    if (key === 'fullName') setFullName(value);
    if (key === 'email') setEmail(value);
    if (key === 'phone') setPhone(value);
    if (key === 'address') setAddress(value);
    // Xoá lỗi của field vừa sửa
    setErrors((prev) => ({ ...prev, [key]: undefined }));
  };

  const handleCancel = () => {
    if (!hasChanges) {
      router.back();
      return;
    }
    Alert.alert(
      'Bỏ thay đổi?',
      'Bạn có chắc muốn rời đi mà không lưu thay đổi?',
      [
        { text: 'Tiếp tục sửa', style: 'cancel' },
        { text: 'Hủy thay đổi', style: 'destructive', onPress: () => router.back() },
      ],
    );
  };

  const handleLaunchCamera = async () => {
    try {
      const permission = await ImagePicker.requestCameraPermissionsAsync();
      if (!permission.granted) {
        Alert.alert('Quyền truy cập', 'Vui lòng cấp quyền truy cập máy ảnh để chụp ảnh đại diện.');
        return;
      }
      const result = await ImagePicker.launchCameraAsync({
        mediaTypes: ['images'],
        allowsEditing: true,
        aspect: [1, 1],
        quality: 0.8,
      });
      if (!result.canceled && result.assets && result.assets.length > 0) {
        const asset = result.assets[0];
        if (asset.fileSize && asset.fileSize > 5 * 1024 * 1024) {
          Alert.alert('Ảnh quá lớn', 'Kích thước ảnh đại diện không được vượt quá 5MB.');
          return;
        }
        setAvatarUri(asset.uri);
        setAvatarChanged(true);
      }
    } catch {
      Alert.alert('Lỗi', 'Không thể mở máy ảnh. Vui lòng thử lại.');
    }
  };

  const handlePickFromLibrary = async () => {
    try {
      const permission = await ImagePicker.requestMediaLibraryPermissionsAsync();
      if (!permission.granted) {
        Alert.alert('Quyền truy cập', 'Vui lòng cấp quyền truy cập thư viện ảnh để chọn ảnh đại diện.');
        return;
      }
      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ['images'],
        allowsEditing: true,
        aspect: [1, 1],
        quality: 0.8,
      });
      if (!result.canceled && result.assets && result.assets.length > 0) {
        const asset = result.assets[0];
        if (asset.fileSize && asset.fileSize > 5 * 1024 * 1024) {
          Alert.alert('Ảnh quá lớn', 'Kích thước ảnh đại diện không được vượt quá 5MB.');
          return;
        }
        setAvatarUri(asset.uri);
        setAvatarChanged(true);
      }
    } catch {
      Alert.alert('Lỗi', 'Không thể mở thư viện ảnh. Vui lòng thử lại.');
    }
  };

  const handleChangeAvatar = () => {
    Alert.alert('Đổi ảnh đại diện', 'Chọn hình thức cập nhật ảnh (tối đa 5MB)', [
      {
        text: 'Chụp ảnh',
        onPress: handleLaunchCamera,
      },
      {
        text: 'Chọn từ thư viện',
        onPress: handlePickFromLibrary,
      },
      {
        text: 'Xóa ảnh đại diện',
        style: 'destructive',
        onPress: () => {
          setAvatarUri(null);
          setAvatarChanged(true);
        },
      },
      { text: 'Hủy', style: 'cancel' },
    ]);
  };

  const validate = (): boolean => {
    const nextErrors: Partial<Record<ProfileField, string>> = {};
    if (fullName.trim().length < 2) {
      nextErrors.fullName = 'Vui lòng nhập họ và tên.';
    }
    if (!isValidEmail(email.trim())) {
      nextErrors.email = 'Email không hợp lệ.';
    }
    if (!isValidPhoneVn(phone)) {
      nextErrors.phone = 'Số điện thoại không đúng định dạng Việt Nam.';
    }
    if (address.trim().length < 5) {
      nextErrors.address = 'Vui lòng nhập địa chỉ.';
    }
    setErrors(nextErrors);
    return Object.keys(nextErrors).length === 0;
  };

  const handleSave = async () => {
    if (saving || !user) return;
    if (!validate()) {
      Alert.alert('Lỗi', 'Vui lòng kiểm tra lại thông tin.');
      return;
    }

    setSaving(true);
    try {
      const patch: Partial<UserProfile> = {
        fullName: fullName.trim(),
        email: email.trim(),
        phoneNumber: phone.trim(),
        address: address.trim(),
      };
      // Nếu người dùng thay đổi avatar, gửi avatarUrl mới (hoặc undefined để xoá)
      if (avatarChanged) {
        patch.avatarUrl = avatarUri ?? undefined;
      }
      await updateProfile(patch);
      Alert.alert('Thành công', 'Hồ sơ đã được cập nhật.', [
        { text: 'OK', onPress: () => router.back() },
      ]);
    } catch {
      Alert.alert('Lỗi', 'Không thể lưu thông tin, vui lòng thử lại.');
    } finally {
      setSaving(false);
    }
  };

  if (isLoading || !user) {
    return <LoadingView label="Đang tải hồ sơ..." />;
  }

  return (
    <SafeAreaView style={styles.safeArea} edges={['top', 'bottom']}>
      <KeyboardAvoidingView
        style={styles.flex}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        keyboardVerticalOffset={Platform.OS === 'ios' ? 8 : 0}
      >
        <ScreenHeader title="Cập nhật thông tin" onBack={handleCancel} />

        <ScrollView
          style={styles.flex}
          contentContainerStyle={styles.scrollContent}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
        >
          <View style={styles.avatarSection}>
            <TouchableOpacity
              style={styles.avatarWrapper}
              onPress={handleChangeAvatar}
              activeOpacity={0.85}
              accessibilityRole="button"
              accessibilityLabel="Đổi ảnh đại diện"
            >
              {avatarUri ? (
                <Image source={{ uri: avatarUri }} style={styles.avatarImage} />
              ) : (
                <View style={styles.avatarPlaceholder}>
                  <Text style={styles.avatarInitials}>{initials}</Text>
                </View>
              )}
              <View style={styles.cameraBadge}>
                <Ionicons name="camera" size={16} color={colors.white} />
              </View>
            </TouchableOpacity>
            <TouchableOpacity onPress={handleChangeAvatar} activeOpacity={0.7}>
              <Text style={styles.changePhotoText}>Đổi ảnh đại diện</Text>
            </TouchableOpacity>
          </View>

          <View style={styles.formCard}>
            <FormField
              label="Họ và tên"
              icon="person-outline"
              value={fullName}
              placeholder="Nhập họ và tên"
              onChangeText={(text) => updateField('fullName', text)}
              error={errors.fullName}
              autoCapitalize="words"
            />
            <FormField
              label="Email"
              icon="mail-outline"
              value={email}
              placeholder="Nhập email"
              onChangeText={(text) => updateField('email', text)}
              error={errors.email}
              keyboardType="email-address"
              autoCapitalize="none"
            />
            <FormField
              label="Số điện thoại"
              icon="call-outline"
              value={phone}
              placeholder="Nhập số điện thoại"
              onChangeText={(text) => updateField('phone', text)}
              error={errors.phone}
              keyboardType="phone-pad"
              autoCapitalize="none"
            />
            <FormField
              label="Địa chỉ"
              icon="location-outline"
              value={address}
              placeholder="Nhập địa chỉ"
              onChangeText={(text) => updateField('address', text)}
              error={errors.address}
              autoCapitalize="sentences"
              multiline
            />
          </View>

          <View style={styles.hintRow}>
            <Ionicons name="shield-checkmark-outline" size={15} color={colors.textMuted} />
            <Text style={styles.hintText}>
              Thông tin cá nhân của bạn được bảo mật.
            </Text>
          </View>
        </ScrollView>

        <View style={styles.footer}>
          <SecondaryButton
            title="Hủy"
            onPress={handleCancel}
            disabled={saving}
            style={styles.cancelButton}
          />
          <PrimaryButton
            title={saving ? 'Đang lưu...' : 'Lưu thay đổi'}
            onPress={handleSave}
            loading={saving}
            style={styles.saveButton}
          />
        </View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: colors.background,
  },
  flex: {
    flex: 1,
  },
  scrollContent: {
    paddingHorizontal: spacing.lg,
    paddingTop: spacing.sm,
    paddingBottom: spacing.xxl,
  },
  avatarSection: {
    alignItems: 'center',
    paddingVertical: spacing.md,
  },
  avatarWrapper: {
    width: 104,
    height: 104,
    borderRadius: 52,
    marginBottom: spacing.sm,
  },
  avatarImage: {
    width: 104,
    height: 104,
    borderRadius: 52,
    backgroundColor: colors.border,
  },
  avatarPlaceholder: {
    width: 104,
    height: 104,
    borderRadius: 52,
    backgroundColor: colors.primarySoft,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 2,
    borderColor: colors.white,
  },
  avatarInitials: {
    fontSize: 34,
    fontWeight: '700',
    color: colors.primary,
    letterSpacing: 1,
  },
  cameraBadge: {
    position: 'absolute',
    right: 0,
    bottom: 4,
    width: 34,
    height: 34,
    borderRadius: 17,
    backgroundColor: colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 3,
    borderColor: colors.white,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.18,
    shadowRadius: 4,
    elevation: 4,
  },
  changePhotoText: {
    fontSize: 13,
    fontWeight: '600',
    color: colors.primary,
  },
  formCard: {
    backgroundColor: colors.card,
    borderRadius: radius.xl,
    paddingHorizontal: spacing.md,
    paddingTop: spacing.sm,
    paddingBottom: spacing.lg,
    borderWidth: 1,
    borderColor: colors.border,
    shadowColor: colors.dark,
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.04,
    shadowRadius: 14,
    elevation: 2,
  },
  hintRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: spacing.lg,
    paddingHorizontal: spacing.sm,
  },
  hintText: {
    fontSize: 12,
    color: colors.textMuted,
    marginLeft: spacing.xs,
    flexShrink: 1,
  },
  footer: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: spacing.lg,
    paddingTop: spacing.md,
    paddingBottom: spacing.md,
    backgroundColor: colors.background,
    borderTopWidth: 1,
    borderTopColor: colors.border,
  },
  cancelButton: {
    flex: 1,
    marginRight: spacing.md,
  },
  saveButton: {
    flex: 1.6,
  },
});
