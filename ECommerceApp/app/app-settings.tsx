import React, { useEffect, useMemo, useState } from 'react';
import {
  Alert,
  KeyboardAvoidingView,
  Modal,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Switch,
  Text,
  TextInput,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { colors, radius, spacing } from '../src/constants/theme';
import { useSettings } from '../src/context/SettingsContext';
import { PrimaryButton, SecondaryButton } from '../src/components/Button';
import { LoadingView } from '../src/components/LoadingView';
import { AppSettings } from '../src/types';

type IoniconName = keyof typeof Ionicons.glyphMap;

interface SettingRowProps {
  icon: IoniconName;
  iconColor?: string;
  iconBackground?: string;
  title: string;
  subtitle?: string;
  titleColor?: string;
  right?: React.ReactNode;
  onPress?: () => void;
  isLast?: boolean;
}

function SettingRow({
  icon,
  iconColor = colors.primary,
  iconBackground = colors.primarySoft,
  title,
  subtitle,
  titleColor = colors.dark,
  right,
  onPress,
  isLast,
}: SettingRowProps) {
  const content = (
    <>
      <View style={[styles.iconBox, { backgroundColor: iconBackground }]}>
        <Ionicons name={icon} size={20} color={iconColor} />
      </View>
      <View style={styles.rowTextWrap}>
        <Text style={[styles.rowTitle, { color: titleColor }]}>{title}</Text>
        {subtitle ? <Text style={styles.rowSubtitle}>{subtitle}</Text> : null}
      </View>
      {right ?? null}
    </>
  );

  if (onPress) {
    return (
      <Pressable
        onPress={onPress}
        style={({ pressed }) => [
          styles.row,
          !isLast && styles.rowDivider,
          pressed && { opacity: 0.7 },
        ]}
        accessibilityRole="button"
        accessibilityLabel={title}
      >
        {content}
      </Pressable>
    );
  }

  return <View style={[styles.row, !isLast && styles.rowDivider]}>{content}</View>;
}

function SectionLabel({ children }: { children: string }) {
  return <Text style={styles.sectionLabel}>{children}</Text>;
}

interface SheetModalProps {
  visible: boolean;
  title: string;
  onClose: () => void;
  children: React.ReactNode;
}

function SheetModal({ visible, title, onClose, children }: SheetModalProps) {
  return (
    <Modal
      visible={visible}
      transparent
      animationType="slide"
      onRequestClose={onClose}
      statusBarTranslucent
    >
      <KeyboardAvoidingView
        style={styles.modalRoot}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      >
        <Pressable style={StyleSheet.absoluteFill} onPress={onClose} accessibilityLabel="Đóng" />
        <View style={styles.sheet}>
          <View style={styles.sheetHandle} />
          <View style={styles.sheetHeader}>
            <Text style={styles.sheetTitle}>{title}</Text>
            <Pressable
              style={({ pressed }) => [
                styles.sheetClose,
                pressed && { opacity: 0.7 },
              ]}
              onPress={onClose}
              accessibilityRole="button"
              accessibilityLabel="Đóng"
            >
              <Ionicons name="close" size={18} color={colors.dark} />
            </Pressable>
          </View>
          {children}
        </View>
      </KeyboardAvoidingView>
    </Modal>
  );
}

export default function AppSettingsScreen() {
  const router = useRouter();
  const { settings, loading, saveSettings } = useSettings();

  const [draft, setDraft] = useState<AppSettings>(settings);
  const [passwordModalVisible, setPasswordModalVisible] = useState(false);

  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [passwordError, setPasswordError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isPasswordSubmitting, setIsPasswordSubmitting] = useState(false);

  useEffect(() => {
    setDraft(settings);
  }, [settings]);

  const hasChanges = useMemo(
    () => JSON.stringify(draft) !== JSON.stringify(settings),
    [draft, settings],
  );

  const handleBack = () => {
    if (hasChanges) {
      Alert.alert('Hủy thay đổi?', 'Các thay đổi chưa được lưu.', [
        { text: 'Tiếp tục chỉnh sửa', style: 'cancel' },
        { text: 'Hủy thay đổi', style: 'destructive', onPress: () => router.back() },
      ]);
    } else {
      router.back();
    }
  };

  const handleClose = () => handleBack();

  const handleSave = async () => {
    setIsSubmitting(true);
    try {
      await saveSettings(draft);
      Alert.alert('Đã lưu cài đặt', 'Các tuỳ chỉnh của bạn đã được cập nhật.', [
        { text: 'OK', onPress: () => router.back() },
      ]);
    } catch (error) {
      Alert.alert('Lỗi', 'Không thể lưu cài đặt. Vui lòng thử lại.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleToggle = (key: keyof AppSettings, value: boolean) => {
    setDraft((prev) => ({ ...prev, [key]: value }));
  };

  const handleBiometricToggle = (value: boolean) => {
    setDraft((prev) => ({ ...prev, biometricEnabled: value }));
    if (value) {
      Alert.alert(
        'Đã bật đăng nhập sinh trắc học',
        'Bạn có thể đăng nhập bằng FaceID / vân tay trên thiết bị này.',
      );
    }
  };

  const handlePrivacyPolicy = () => {
    Alert.alert(
      'Chính sách bảo mật',
      'Chúng tôi chỉ lưu trữ thông tin cần thiết để xử lý đơn hàng. Dữ liệu của bạn không bao giờ được bán cho bên thứ ba và bạn có thể yêu cầu xoá bất cứ lúc nào.',
      [{ text: 'Đã hiểu' }],
    );
  };

  const closePasswordModal = () => {
    setPasswordModalVisible(false);
    setCurrentPassword('');
    setNewPassword('');
    setConfirmPassword('');
    setPasswordError(null);
    setShowPassword(false);
  };

  const handlePasswordSubmit = async () => {
    if (!currentPassword || !newPassword || !confirmPassword) {
      setPasswordError('Vui lòng nhập đầy đủ các trường.');
      return;
    }
    if (newPassword.length < 6) {
      setPasswordError('Mật khẩu mới phải có ít nhất 6 ký tự.');
      return;
    }
    if (newPassword !== confirmPassword) {
      setPasswordError('Mật khẩu xác nhận không khớp.');
      return;
    }
    setIsPasswordSubmitting(true);
    setPasswordError(null);
    try {
      await new Promise((resolve) => setTimeout(resolve, 600));
      Alert.alert('Đổi mật khẩu thành công', 'Mật khẩu của bạn đã được cập nhật.');
      closePasswordModal();
    } catch {
      Alert.alert('Lỗi', 'Không thể đổi mật khẩu. Vui lòng thử lại.');
    } finally {
      setIsPasswordSubmitting(false);
    }
  };

  if (loading) {
    return <LoadingView label="Đang tải cài đặt..." />;
  }

  return (
    <SafeAreaView style={styles.safe} edges={['top', 'bottom']}>
      <View style={styles.header}>
        <Pressable
          onPress={handleBack}
          style={({ pressed }) => [styles.headerButton, pressed && { opacity: 0.7 }]}
          accessibilityRole="button"
          accessibilityLabel="Quay lại"
        >
          <Ionicons name="chevron-back" size={22} color={colors.dark} />
        </Pressable>
        <Text style={styles.headerTitle}>Cài đặt ứng dụng</Text>
        <Pressable
          onPress={handleClose}
          style={({ pressed }) => [styles.headerButton, pressed && { opacity: 0.7 }]}
          accessibilityRole="button"
          accessibilityLabel="Đóng"
        >
          <Ionicons name="close" size={20} color={colors.dark} />
        </Pressable>
      </View>

      <ScrollView
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
      >
        <SectionLabel>THÔNG BÁO</SectionLabel>
        <View style={styles.card}>
          <SettingRow
            icon="notifications-outline"
            title="Cho phép thông báo"
            subtitle="Nhận thông báo từ ứng dụng"
            isLast
            right={
              <Switch
                value={draft.pushEnabled}
                onValueChange={(value) => handleToggle('pushEnabled', value)}
                trackColor={{ false: colors.border, true: colors.primary }}
                thumbColor={colors.white}
                ios_backgroundColor={colors.border}
                accessibilityLabel="Cho phép thông báo"
                accessibilityRole="switch"
                accessibilityState={{ checked: draft.pushEnabled }}
              />
            }
          />
        </View>

        <SectionLabel>BẢO MẬT</SectionLabel>
        <View style={styles.card}>
          <SettingRow
            icon="lock-closed-outline"
            title="Đổi mật khẩu"
            subtitle="Cập nhật mật khẩu tài khoản"
            onPress={() => setPasswordModalVisible(true)}
            right={<Ionicons name="chevron-forward" size={18} color={colors.textMuted} />}
          />
          <SettingRow
            icon="finger-print-outline"
            title="Đăng nhập sinh trắc học"
            subtitle="FaceID / vân tay"
            isLast
            right={
              <Switch
                value={draft.biometricEnabled}
                onValueChange={handleBiometricToggle}
                trackColor={{ false: colors.border, true: colors.primary }}
                thumbColor={colors.white}
                ios_backgroundColor={colors.border}
                accessibilityLabel="Đăng nhập sinh trắc học"
                accessibilityRole="switch"
                accessibilityState={{ checked: draft.biometricEnabled }}
              />
            }
          />
        </View>

        <SectionLabel>QUYỀN RIÊNG TƯ</SectionLabel>
        <View style={styles.card}>
          <SettingRow
            icon="shield-checkmark-outline"
            title="Chính sách bảo mật"
            subtitle="Cách chúng tôi xử lý dữ liệu"
            onPress={handlePrivacyPolicy}
            right={<Ionicons name="chevron-forward" size={18} color={colors.textMuted} />}
            isLast
          />
        </View>
      </ScrollView>

      <View style={styles.footer}>
        <PrimaryButton
          title="Lưu cài đặt"
          onPress={handleSave}
          loading={isSubmitting}
          disabled={isSubmitting}
        />
      </View>

      <SheetModal
        visible={passwordModalVisible}
        title="Đổi mật khẩu"
        onClose={closePasswordModal}
      >
        <Text style={styles.inputLabel}>Mật khẩu hiện tại</Text>
        <View style={styles.inputWrap}>
          <TextInput
            style={styles.input}
            value={currentPassword}
            onChangeText={setCurrentPassword}
            placeholder="Nhập mật khẩu hiện tại"
            placeholderTextColor={colors.placeholder}
            secureTextEntry={!showPassword}
            autoCapitalize="none"
            autoCorrect={false}
          />
        </View>

        <Text style={styles.inputLabel}>Mật khẩu mới</Text>
        <View style={styles.inputWrap}>
          <TextInput
            style={[styles.input, styles.inputWithIcon]}
            value={newPassword}
            onChangeText={setNewPassword}
            placeholder="Ít nhất 6 ký tự"
            placeholderTextColor={colors.placeholder}
            secureTextEntry={!showPassword}
            autoCapitalize="none"
            autoCorrect={false}
          />
          <Pressable
            style={styles.eyeButton}
            onPress={() => setShowPassword((prev) => !prev)}
            hitSlop={8}
            accessibilityRole="button"
            accessibilityLabel={showPassword ? 'Ẩn mật khẩu' : 'Hiện mật khẩu'}
          >
            <Ionicons
              name={showPassword ? 'eye-off-outline' : 'eye-outline'}
              size={18}
              color={colors.textMuted}
            />
          </Pressable>
        </View>

        <Text style={styles.inputLabel}>Xác nhận mật khẩu mới</Text>
        <View style={styles.inputWrap}>
          <TextInput
            style={styles.input}
            value={confirmPassword}
            onChangeText={setConfirmPassword}
            placeholder="Nhập lại mật khẩu mới"
            placeholderTextColor={colors.placeholder}
            secureTextEntry={!showPassword}
            autoCapitalize="none"
            autoCorrect={false}
          />
        </View>

        {passwordError ? <Text style={styles.errorText}>{passwordError}</Text> : null}

        <View style={styles.sheetActions}>
          <SecondaryButton title="Hủy" onPress={closePasswordModal} style={styles.cancelButton} />
          <PrimaryButton
            title="Cập nhật mật khẩu"
            onPress={handlePasswordSubmit}
            loading={isPasswordSubmitting}
            disabled={isPasswordSubmitting}
            style={styles.updateButton}
          />
        </View>
      </SheetModal>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: colors.background },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.sm,
  },
  headerButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.card,
    borderWidth: 1,
    borderColor: colors.border,
  },
  headerTitle: {
    flex: 1,
    marginHorizontal: spacing.md,
    fontSize: 20,
    fontWeight: '700',
    color: colors.dark,
  },
  scrollContent: {
    paddingHorizontal: spacing.xl,
    paddingTop: spacing.xs,
    paddingBottom: spacing.xxl,
  },
  sectionLabel: {
    marginTop: spacing.lg,
    marginBottom: spacing.sm,
    fontSize: 12,
    fontWeight: '600',
    letterSpacing: 0.8,
    color: colors.textMuted,
  },
  card: {
    backgroundColor: colors.card,
    borderRadius: radius.lg,
    borderWidth: 1,
    borderColor: colors.border,
    overflow: 'hidden',
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.md,
  },
  rowDivider: {
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  iconBox: {
    width: 40,
    height: 40,
    borderRadius: radius.md,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: spacing.md,
  },
  rowTextWrap: {
    flex: 1,
    paddingRight: spacing.sm,
  },
  rowTitle: {
    fontSize: 15,
    fontWeight: '600',
    color: colors.dark,
  },
  rowSubtitle: {
    marginTop: 2,
    fontSize: 12.5,
    color: colors.textMuted,
  },
  footer: {
    paddingHorizontal: spacing.xl,
    paddingTop: spacing.md,
    paddingBottom: spacing.md,
    backgroundColor: colors.background,
    borderTopWidth: 1,
    borderTopColor: colors.border,
  },
  modalRoot: {
    flex: 1,
    justifyContent: 'flex-end',
    backgroundColor: colors.overlay,
  },
  sheet: {
    backgroundColor: colors.card,
    borderTopLeftRadius: radius.xl,
    borderTopRightRadius: radius.xl,
    paddingHorizontal: spacing.xl,
    paddingTop: spacing.sm,
    paddingBottom: spacing.xl,
  },
  sheetHandle: {
    alignSelf: 'center',
    width: 44,
    height: 5,
    borderRadius: 3,
    backgroundColor: colors.border,
    marginBottom: spacing.md,
  },
  sheetHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: spacing.md,
  },
  sheetTitle: {
    fontSize: 17,
    fontWeight: '700',
    color: colors.dark,
  },
  sheetClose: {
    width: 44,
    height: 44,
    borderRadius: 22,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.background,
  },
  inputLabel: {
    fontSize: 12.5,
    fontWeight: '600',
    color: colors.textMuted,
    marginBottom: 6,
    marginTop: 8,
  },
  inputWrap: {
    justifyContent: 'center',
    marginBottom: 4,
  },
  input: {
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: radius.md,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.md,
    fontSize: 15,
    color: colors.dark,
    backgroundColor: colors.background,
  },
  inputWithIcon: {
    paddingRight: 44,
  },
  eyeButton: {
    position: 'absolute',
    right: 12,
    width: 28,
    height: 28,
    alignItems: 'center',
    justifyContent: 'center',
  },
  errorText: {
    marginTop: 8,
    fontSize: 12.5,
    fontWeight: '600',
    color: colors.danger,
  },
  sheetActions: {
    flexDirection: 'row',
    marginTop: spacing.lg,
  },
  cancelButton: {
    flex: 1,
    marginRight: spacing.sm,
  },
  updateButton: {
    flex: 1.6,
  },
});
