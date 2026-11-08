import React, { useState } from 'react';
import {
  View,
  Text,
  TextInput,
  StyleSheet,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  Pressable,
  Alert,
  Modal,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { colors, radius, spacing } from '../../src/constants/theme';
import { useAuth } from '../../src/context/AuthContext';
import { PrimaryButton } from '../../src/components/Button';
import { isValidEmail, isValidPassword } from '../../src/utils/format';

export default function LoginScreen() {
  const router = useRouter();
  const { login, loginAsGuest, sendPasswordResetEmail } = useAuth();

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);

  // Quên mật khẩu state
  const [showForgotModal, setShowForgotModal] = useState(false);
  const [forgotEmail, setForgotEmail] = useState('');
  const [forgotLoading, setForgotLoading] = useState(false);
  const [forgotError, setForgotError] = useState('');

  const showAlert = (title: string, message: string) => {
    Alert.alert(title, message);
  };

  const handleLogin = async () => {
    const trimmedEmail = email.trim();
    if (!trimmedEmail) {
      showAlert('Thiếu thông tin', 'Vui lòng nhập email của bạn.');
      return;
    }
    if (!isValidEmail(trimmedEmail)) {
      showAlert('Email không hợp lệ', 'Vui lòng kiểm tra lại email.');
      return;
    }
    if (!password) {
      showAlert('Thiếu thông tin', 'Vui lòng nhập mật khẩu.');
      return;
    }
    if (!isValidPassword(password)) {
      showAlert('Mật khẩu quá ngắn', 'Mật khẩu phải có ít nhất 6 ký tự.');
      return;
    }

    setLoading(true);
    try {
      await login(trimmedEmail, password);
      router.replace('/(tabs)/home');
    } catch (error) {
      showAlert('Đăng nhập thất bại', error instanceof Error ? error.message : 'Thông tin đăng nhập không chính xác.');
    } finally {
      setLoading(false);
    }
  };

  const handleSendReset = async () => {
    const trimmed = (forgotEmail || email).trim();
    if (!trimmed) {
      setForgotError('Vui lòng nhập email tài khoản.');
      return;
    }
    if (!isValidEmail(trimmed)) {
      setForgotError('Email không đúng định dạng.');
      return;
    }
    setForgotLoading(true);
    setForgotError('');
    try {
      await sendPasswordResetEmail(trimmed);
      setShowForgotModal(false);
      Alert.alert(
        'Đã gửi email khôi phục',
        `Hướng dẫn đặt lại mật khẩu đã được gửi đến email ${trimmed}. Vui lòng kiểm tra hộp thư đến hoặc mục thư rác.`
      );
    } catch (err) {
      setForgotError(err instanceof Error ? err.message : 'Không thể gửi email đặt lại mật khẩu.');
    } finally {
      setForgotLoading(false);
    }
  };

  const handleGuest = async () => {
    setLoading(true);
    try {
      await loginAsGuest();
      router.replace('/(tabs)/home');
    } catch (error) {
      showAlert('Không thể tiếp tục', error instanceof Error ? error.message : 'Đã có lỗi xảy ra.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <SafeAreaView style={styles.safeArea} edges={['top', 'bottom']}>
      <KeyboardAvoidingView
        style={styles.keyboardView}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      >
        <ScrollView
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled"
        >
          {/* Header */}
          <View style={styles.header}>
            <View style={styles.logoBadge}>
              <Ionicons name="bag-handle" size={32} color={colors.white} />
            </View>
            <Text style={styles.title}>Chào mừng trở lại!</Text>
            <Text style={styles.subtitle}>
              Đăng nhập để tiếp tục trải nghiệm mua sắm công nghệ
            </Text>
          </View>

          {/* Form Card */}
          <View style={styles.card}>
            <Text style={styles.label}>Email</Text>
            <View style={styles.inputWrapper}>
              <Ionicons
                name="mail-outline"
                size={20}
                color={colors.placeholder}
                style={styles.inputIcon}
              />
              <TextInput
                style={styles.input}
                placeholder="Nhập địa chỉ email"
                placeholderTextColor={colors.placeholder}
                value={email}
                onChangeText={setEmail}
                keyboardType="email-address"
                autoCapitalize="none"
                autoCorrect={false}
                accessibilityLabel="Email"
              />
            </View>

            <Text style={[styles.label, styles.labelSpacing]}>Mật khẩu</Text>
            <View style={styles.inputWrapper}>
              <Ionicons
                name="lock-closed-outline"
                size={20}
                color={colors.placeholder}
                style={styles.inputIcon}
              />
              <TextInput
                style={styles.input}
                placeholder="Nhập mật khẩu"
                placeholderTextColor={colors.placeholder}
                value={password}
                onChangeText={setPassword}
                secureTextEntry={!showPassword}
                autoCapitalize="none"
                accessibilityLabel="Mật khẩu"
              />
              <Pressable
                onPress={() => setShowPassword((value) => !value)}
                hitSlop={12}
                style={styles.eyeButton}
                accessibilityRole="button"
                accessibilityLabel={showPassword ? 'Ẩn mật khẩu' : 'Hiện mật khẩu'}
                accessibilityState={{ disabled: loading }}
                disabled={loading}
              >
                <Ionicons
                  name={showPassword ? 'eye-outline' : 'eye-off-outline'}
                  size={20}
                  color={colors.placeholder}
                />
              </Pressable>
            </View>

            {/* Quên mật khẩu link */}
            <View style={styles.forgotPasswordRow}>
              <Pressable
                onPress={() => {
                  setForgotEmail(email);
                  setForgotError('');
                  setShowForgotModal(true);
                }}
                hitSlop={8}
                accessibilityRole="button"
                accessibilityLabel="Quên mật khẩu"
              >
                <Text style={styles.forgotPasswordText}>Quên mật khẩu?</Text>
              </Pressable>
            </View>

            {/* Login button */}
            <PrimaryButton
              title="Đăng nhập"
              icon="arrow-forward"
              loading={loading}
              onPress={handleLogin}
              style={styles.loginButton}
            />
          </View>

          {/* Footer */}
          <View style={styles.footer}>
            <View style={styles.registerRow}>
              <Text style={styles.registerText}>Chưa có tài khoản? </Text>
              <Pressable
                onPress={() => router.push('/(auth)/register')}
                disabled={loading}
                style={styles.registerLinkButton}
                accessibilityRole="link"
                accessibilityLabel="Đăng ký ngay"
              >
                <Text style={styles.registerLink}>Đăng ký ngay</Text>
              </Pressable>
            </View>

            <Pressable
              style={({ pressed }) => [styles.guestButton, pressed && styles.pressed]}
              onPress={handleGuest}
              disabled={loading}
              accessibilityRole="button"
              accessibilityLabel="Tiếp tục với tư cách Khách"
              accessibilityState={{ disabled: loading }}
            >
              <Ionicons name="person-outline" size={18} color={colors.textSecondary} />
              <Text style={styles.guestText}>Tiếp tục với tư cách Khách</Text>
            </Pressable>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>

      {/* Modal Khôi phục mật khẩu (UC001 3a) */}
      <Modal
        visible={showForgotModal}
        transparent
        animationType="fade"
        onRequestClose={() => setShowForgotModal(false)}
      >
        <KeyboardAvoidingView
          behavior={Platform.OS === 'ios' ? 'padding' : undefined}
          style={styles.modalBackdrop}
        >
          <View style={styles.modalCard}>
            <View style={styles.modalHeader}>
              <View style={styles.forgotIconWrap}>
                <Ionicons name="key-outline" size={24} color={colors.primary} />
              </View>
              <Text style={styles.modalTitle}>Khôi phục mật khẩu</Text>
              <Text style={styles.modalSubtitle}>
                Nhập địa chỉ email tài khoản của bạn. Hệ thống sẽ gửi email chứa liên kết đặt lại mật khẩu an toàn.
              </Text>
            </View>

            <View style={styles.inputWrapper}>
              <Ionicons
                name="mail-outline"
                size={20}
                color={colors.placeholder}
                style={styles.inputIcon}
              />
              <TextInput
                style={styles.input}
                placeholder="Nhập địa chỉ email"
                placeholderTextColor={colors.placeholder}
                value={forgotEmail}
                onChangeText={setForgotEmail}
                keyboardType="email-address"
                autoCapitalize="none"
                autoCorrect={false}
              />
            </View>

            {forgotError ? <Text style={styles.forgotErrorText}>{forgotError}</Text> : null}

            <View style={styles.modalButtonRow}>
              <Pressable
                style={({ pressed }) => [styles.cancelModalBtn, pressed && styles.pressed]}
                onPress={() => setShowForgotModal(false)}
                disabled={forgotLoading}
                accessibilityRole="button"
                accessibilityLabel="Hủy bỏ"
              >
                <Text style={styles.cancelModalText}>Hủy</Text>
              </Pressable>
              <PrimaryButton
                title="Gửi liên kết"
                loading={forgotLoading}
                onPress={handleSendReset}
                style={styles.submitModalBtn}
              />
            </View>
          </View>
        </KeyboardAvoidingView>
      </Modal>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: colors.background,
  },
  keyboardView: {
    flex: 1,
  },
  scrollContent: {
    paddingHorizontal: spacing.xl,
    paddingTop: 36,
    paddingBottom: 28,
  },
  header: {
    alignItems: 'center',
    marginBottom: 28,
  },
  logoBadge: {
    width: 68,
    height: 68,
    borderRadius: 22,
    backgroundColor: colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 16,
    shadowColor: colors.primary,
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.35,
    shadowRadius: 16,
    elevation: 8,
  },
  title: {
    fontSize: 26,
    fontWeight: '800',
    color: colors.dark,
    letterSpacing: -0.5,
    marginBottom: 6,
    textAlign: 'center',
  },
  subtitle: {
    fontSize: 14,
    color: colors.textSecondary,
    textAlign: 'center',
    paddingHorizontal: 24,
    lineHeight: 20,
  },
  card: {
    backgroundColor: colors.card,
    borderRadius: radius.xl,
    padding: spacing.xl,
    borderWidth: 1,
    borderColor: colors.border,
    shadowColor: colors.dark,
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.05,
    shadowRadius: 16,
    elevation: 3,
  },
  label: {
    fontSize: 13,
    fontWeight: '700',
    color: colors.dark,
    marginBottom: spacing.sm,
    marginLeft: 2,
  },
  labelSpacing: {
    marginTop: 18,
  },
  inputWrapper: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.background,
    borderRadius: radius.lg,
    borderWidth: 1,
    borderColor: colors.border,
    paddingHorizontal: spacing.md,
    height: 52,
  },
  inputIcon: {
    marginRight: spacing.sm,
  },
  input: {
    flex: 1,
    fontSize: 15,
    color: colors.dark,
    paddingVertical: 0,
  },
  eyeButton: {
    width: 44,
    height: 44,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: -spacing.sm,
  },
  forgotPasswordRow: {
    alignItems: 'flex-end',
    marginTop: 10,
    marginBottom: 4,
  },
  forgotPasswordText: {
    fontSize: 13,
    fontWeight: '600',
    color: colors.primary,
  },
  loginButton: {
    marginTop: 18,
  },
  footer: {
    marginTop: 28,
    alignItems: 'center',
  },
  registerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: spacing.md,
  },
  registerText: {
    fontSize: 14,
    color: colors.textSecondary,
  },
  registerLinkButton: {
    paddingVertical: 8,
  },
  registerLink: {
    fontSize: 14,
    fontWeight: '700',
    color: colors.primary,
  },
  guestButton: {
    flexDirection: 'row',
    alignItems: 'center',
    minHeight: 44,
    paddingHorizontal: spacing.lg,
  },
  guestText: {
    fontSize: 13,
    fontWeight: '600',
    color: colors.textSecondary,
    marginLeft: 6,
  },
  pressed: {
    opacity: 0.7,
  },
  modalBackdrop: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.55)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: spacing.xl,
  },
  modalCard: {
    width: '100%',
    maxWidth: 420,
    backgroundColor: colors.card,
    borderRadius: radius.xl,
    padding: spacing.xl,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.2,
    shadowRadius: 20,
    elevation: 10,
  },
  modalHeader: {
    alignItems: 'center',
    marginBottom: spacing.lg,
  },
  forgotIconWrap: {
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: 'rgba(238, 77, 45, 0.1)',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: spacing.sm,
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: '800',
    color: colors.dark,
    marginBottom: 6,
    textAlign: 'center',
  },
  modalSubtitle: {
    fontSize: 13,
    color: colors.textSecondary,
    textAlign: 'center',
    lineHeight: 18,
  },
  forgotErrorText: {
    fontSize: 12.5,
    color: colors.danger,
    marginTop: 6,
    marginLeft: 4,
  },
  modalButtonRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: spacing.xl,
    gap: spacing.md,
  },
  cancelModalBtn: {
    flex: 1,
    height: 48,
    borderRadius: radius.lg,
    borderWidth: 1,
    borderColor: colors.border,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.background,
  },
  cancelModalText: {
    fontSize: 14,
    fontWeight: '700',
    color: colors.dark,
  },
  submitModalBtn: {
    flex: 1,
    height: 48,
  },
});
