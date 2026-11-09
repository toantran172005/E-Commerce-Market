import React, { useState } from 'react';
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
  TouchableOpacity,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { colors } from '../src/constants/theme';

type IoniconName = keyof typeof Ionicons.glyphMap;

const LANGUAGES: { label: string; icon: IoniconName }[] = [
  { label: 'English', icon: 'globe-outline' },
  { label: 'Tiếng Việt', icon: 'globe-outline' },
];

const CURRENCIES: { label: string; value: string; icon: IoniconName }[] = [
  { label: '$ USD — US Dollar', value: 'USD', icon: 'cash-outline' },
  { label: '₫ VND — Vietnamese Dong', value: 'VND', icon: 'cash-outline' },
];

const TRACK_OFF = '#E3E5E8';
const MUTED = '#8A9099';
const ICON_BG = '#FFF3EE';
const DANGER = '#E5484D';
const DANGER_BG = '#FDECEC';

type SettingRowProps = {
  icon: IoniconName;
  iconColor?: string;
  iconBackground?: string;
  title: string;
  subtitle?: string;
  titleColor?: string;
  right?: React.ReactNode;
  onPress?: () => void;
  isLast?: boolean;
};

function SettingRow({
  icon,
  iconColor = colors.primary,
  iconBackground = ICON_BG,
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
      <TouchableOpacity
        style={[styles.row, !isLast && styles.rowDivider]}
        activeOpacity={0.7}
        onPress={onPress}
      >
        {content}
      </TouchableOpacity>
    );
  }

  return <View style={[styles.row, !isLast && styles.rowDivider]}>{content}</View>;
}

function SectionLabel({ children }: { children: string }) {
  return <Text style={styles.sectionLabel}>{children}</Text>;
}

type SheetModalProps = {
  visible: boolean;
  title: string;
  onClose: () => void;
  children: React.ReactNode;
};

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
        <Pressable style={StyleSheet.absoluteFill} onPress={onClose} />
        <View style={styles.sheet}>
          <View style={styles.sheetHandle} />
          <View style={styles.sheetHeader}>
            <Text style={styles.sheetTitle}>{title}</Text>
            <TouchableOpacity style={styles.sheetClose} onPress={onClose} activeOpacity={0.7}>
              <Ionicons name="close" size={18} color={colors.dark} />
            </TouchableOpacity>
          </View>
          {children}
        </View>
      </KeyboardAvoidingView>
    </Modal>
  );
}

export default function AppSettingsScreen() {
  const router = useRouter();

  const [darkMode, setDarkMode] = useState(false);
  const [pushEnabled, setPushEnabled] = useState(true);
  const [emailEnabled, setEmailEnabled] = useState(true);
  const [biometricEnabled, setBiometricEnabled] = useState(false);
  const [language, setLanguage] = useState('English');
  const [currency, setCurrency] = useState('USD');

  const [languageModalVisible, setLanguageModalVisible] = useState(false);
  const [currencyModalVisible, setCurrencyModalVisible] = useState(false);
  const [passwordModalVisible, setPasswordModalVisible] = useState(false);

  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [passwordError, setPasswordError] = useState<string | null>(null);

  const closePasswordModal = () => {
    setPasswordModalVisible(false);
    setCurrentPassword('');
    setNewPassword('');
    setConfirmPassword('');
    setPasswordError(null);
    setShowPassword(false);
  };

  const handleBack = () => {
    router.back();
  };

  const handleClose = () => {
    Alert.alert('Discard changes?', 'Your preferences have not been saved yet.', [
      { text: 'Keep editing', style: 'cancel' },
      { text: 'Discard', style: 'destructive', onPress: () => router.back() },
    ]);
  };

  const handleDarkModeToggle = (value: boolean) => {
    setDarkMode(value);
  };

  const handleBiometricToggle = (value: boolean) => {
    setBiometricEnabled(value);
    if (value) {
      Alert.alert(
        'Biometric Login Enabled',
        'You can now sign in with FaceID / Fingerprint on this device.'
      );
    }
  };

  const handlePrivacyPolicy = () => {
    Alert.alert(
      'Privacy Policy',
      'We only store the information needed to process your orders. Your data is never sold to third parties and you can request deletion at any time.',
      [{ text: 'Got it' }]
    );
  };

  const handleClearCache = () => {
    Alert.alert('Cache cleared: 42MB', 'Temporary files have been removed. Your saved data is safe.', [
      { text: 'OK' },
    ]);
  };

  const handlePasswordSubmit = () => {
    if (!currentPassword || !newPassword || !confirmPassword) {
      setPasswordError('Please fill in all fields.');
      return;
    }
    if (newPassword.length < 8) {
      setPasswordError('New password must be at least 8 characters.');
      return;
    }
    if (newPassword !== confirmPassword) {
      setPasswordError('Passwords do not match.');
      return;
    }
    setPasswordError(null);
    closePasswordModal();
    Alert.alert('Password Updated', 'Your password has been changed successfully.');
  };

  const handleSave = () => {
    Alert.alert(
      'Preferences Saved',
      [
        `Language: ${language}`,
        `Currency: ${currency === 'USD' ? '$ USD' : '₫ VND'}`,
        `Dark mode: ${darkMode ? 'On' : 'Off'}`,
        `Push notifications: ${pushEnabled ? 'On' : 'Off'}`,
        `Email notifications: ${emailEnabled ? 'On' : 'Off'}`,
        `Biometric login: ${biometricEnabled ? 'On' : 'Off'}`,
      ].join('\n'),
      [{ text: 'OK', onPress: () => router.back() }]
    );
  };

  return (
    <SafeAreaView style={styles.safe} edges={['top', 'bottom']}>
      <View style={styles.header}>
        <TouchableOpacity style={styles.headerButton} onPress={handleBack} activeOpacity={0.7}>
          <Ionicons name="chevron-back" size={22} color={colors.dark} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>App Settings</Text>
        <TouchableOpacity style={styles.headerButton} onPress={handleClose} activeOpacity={0.7}>
          <Ionicons name="close" size={20} color={colors.dark} />
        </TouchableOpacity>
      </View>

      <ScrollView
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
      >
        <SectionLabel>APPEARANCE</SectionLabel>
        <View style={styles.card}>
          <SettingRow
            icon="moon-outline"
            title="Dark Mode"
            subtitle="Easier on the eyes at night"
            isLast
            right={
              <Switch
                value={darkMode}
                onValueChange={handleDarkModeToggle}
                trackColor={{ false: TRACK_OFF, true: colors.primary }}
                thumbColor={colors.white}
                ios_backgroundColor={TRACK_OFF}
              />
            }
          />
        </View>

        <SectionLabel>LANGUAGE</SectionLabel>
        <View style={styles.card}>
          <SettingRow
            icon="globe-outline"
            title="Language"
            subtitle="App display language"
            isLast
            onPress={() => setLanguageModalVisible(true)}
            right={
              <View style={styles.chip}>
                <Text style={styles.chipText}>{language}</Text>
                <Ionicons
                  name="chevron-down"
                  size={14}
                  color={colors.dark}
                  style={styles.chipChevron}
                />
              </View>
            }
          />
        </View>

        <SectionLabel>CURRENCY</SectionLabel>
        <View style={styles.card}>
          <SettingRow
            icon="cash-outline"
            title="Currency"
            subtitle="Prices are displayed in"
            isLast
            onPress={() => setCurrencyModalVisible(true)}
            right={
              <View style={styles.chip}>
                <Text style={styles.chipText}>{currency === 'USD' ? '$ USD' : '₫ VND'}</Text>
                <Ionicons
                  name="chevron-down"
                  size={14}
                  color={colors.dark}
                  style={styles.chipChevron}
                />
              </View>
            }
          />
        </View>

        <SectionLabel>NOTIFICATIONS</SectionLabel>
        <View style={styles.card}>
          <SettingRow
            icon="notifications-outline"
            title="Push Notifications"
            subtitle="Order updates and offers"
            right={
              <Switch
                value={pushEnabled}
                onValueChange={setPushEnabled}
                trackColor={{ false: TRACK_OFF, true: colors.primary }}
                thumbColor={colors.white}
                ios_backgroundColor={TRACK_OFF}
              />
            }
          />
          <SettingRow
            icon="mail-outline"
            title="Email Notifications"
            subtitle="Receipts and weekly digest"
            isLast
            right={
              <Switch
                value={emailEnabled}
                onValueChange={setEmailEnabled}
                trackColor={{ false: TRACK_OFF, true: colors.primary }}
                thumbColor={colors.white}
                ios_backgroundColor={TRACK_OFF}
              />
            }
          />
        </View>

        <SectionLabel>SECURITY</SectionLabel>
        <View style={styles.card}>
          <SettingRow
            icon="lock-closed-outline"
            title="Change Password"
            subtitle="Update your account password"
            onPress={() => setPasswordModalVisible(true)}
            right={<Ionicons name="chevron-forward" size={18} color={MUTED} />}
          />
          <SettingRow
            icon="finger-print-outline"
            title="Biometric Login"
            subtitle="FaceID / Fingerprint sign in"
            isLast
            right={
              <Switch
                value={biometricEnabled}
                onValueChange={handleBiometricToggle}
                trackColor={{ false: TRACK_OFF, true: colors.primary }}
                thumbColor={colors.white}
                ios_backgroundColor={TRACK_OFF}
              />
            }
          />
        </View>

        <SectionLabel>PRIVACY</SectionLabel>
        <View style={styles.card}>
          <SettingRow
            icon="shield-checkmark-outline"
            title="Privacy Policy"
            subtitle="How we handle your data"
            onPress={handlePrivacyPolicy}
            right={<Ionicons name="chevron-forward" size={18} color={MUTED} />}
          />
          <SettingRow
            icon="trash-outline"
            iconColor={DANGER}
            iconBackground={DANGER_BG}
            title="Clear Cache"
            subtitle="Free up storage space"
            titleColor={DANGER}
            isLast
            onPress={handleClearCache}
            right={<Ionicons name="chevron-forward" size={18} color={MUTED} />}
          />
        </View>
      </ScrollView>

      <View style={styles.footer}>
        <TouchableOpacity style={styles.saveButton} activeOpacity={0.85} onPress={handleSave}>
          <Text style={styles.saveText}>Save Preferences</Text>
        </TouchableOpacity>
      </View>

      <SheetModal
        visible={languageModalVisible}
        title="App Language"
        onClose={() => setLanguageModalVisible(false)}
      >
        {LANGUAGES.map((option) => {
          const active = language === option.label;
          return (
            <TouchableOpacity
              key={option.label}
              style={[styles.optionRow, active && styles.optionRowActive]}
              activeOpacity={0.8}
              onPress={() => {
                setLanguage(option.label);
                setLanguageModalVisible(false);
              }}
            >
              <View style={styles.optionLeft}>
                <Ionicons
                  name={option.icon}
                  size={18}
                  color={active ? colors.primary : MUTED}
                />
                <Text
                  style={[styles.optionText, active && { color: colors.primary }]}
                >
                  {option.label}
                </Text>
              </View>
              {active ? (
                <Ionicons name="checkmark-circle" size={20} color={colors.primary} />
              ) : (
                <View style={styles.optionDot} />
              )}
            </TouchableOpacity>
          );
        })}
      </SheetModal>

      <SheetModal
        visible={currencyModalVisible}
        title="Display Currency"
        onClose={() => setCurrencyModalVisible(false)}
      >
        {CURRENCIES.map((option) => {
          const active = currency === option.value;
          return (
            <TouchableOpacity
              key={option.value}
              style={[styles.optionRow, active && styles.optionRowActive]}
              activeOpacity={0.8}
              onPress={() => {
                setCurrency(option.value);
                setCurrencyModalVisible(false);
              }}
            >
              <View style={styles.optionLeft}>
                <Ionicons
                  name={option.icon}
                  size={18}
                  color={active ? colors.primary : MUTED}
                />
                <Text
                  style={[styles.optionText, active && { color: colors.primary }]}
                >
                  {option.label}
                </Text>
              </View>
              {active ? (
                <Ionicons name="checkmark-circle" size={20} color={colors.primary} />
              ) : (
                <View style={styles.optionDot} />
              )}
            </TouchableOpacity>
          );
        })}
      </SheetModal>

      <SheetModal
        visible={passwordModalVisible}
        title="Change Password"
        onClose={closePasswordModal}
      >
        <Text style={styles.inputLabel}>Current password</Text>
        <View style={styles.inputWrap}>
          <TextInput
            style={styles.input}
            value={currentPassword}
            onChangeText={setCurrentPassword}
            placeholder="Enter current password"
            placeholderTextColor={MUTED}
            secureTextEntry={!showPassword}
            autoCapitalize="none"
            autoCorrect={false}
          />
        </View>

        <Text style={styles.inputLabel}>New password</Text>
        <View style={styles.inputWrap}>
          <TextInput
            style={[styles.input, styles.inputWithIcon]}
            value={newPassword}
            onChangeText={setNewPassword}
            placeholder="At least 8 characters"
            placeholderTextColor={MUTED}
            secureTextEntry={!showPassword}
            autoCapitalize="none"
            autoCorrect={false}
          />
          <TouchableOpacity
            style={styles.eyeButton}
            onPress={() => setShowPassword((prev) => !prev)}
            activeOpacity={0.7}
          >
            <Ionicons
              name={showPassword ? 'eye-off-outline' : 'eye-outline'}
              size={18}
              color={MUTED}
            />
          </TouchableOpacity>
        </View>

        <Text style={styles.inputLabel}>Confirm new password</Text>
        <View style={styles.inputWrap}>
          <TextInput
            style={styles.input}
            value={confirmPassword}
            onChangeText={setConfirmPassword}
            placeholder="Re-enter new password"
            placeholderTextColor={MUTED}
            secureTextEntry={!showPassword}
            autoCapitalize="none"
            autoCorrect={false}
          />
        </View>

        {passwordError ? <Text style={styles.errorText}>{passwordError}</Text> : null}

        <View style={styles.sheetActions}>
          <TouchableOpacity
            style={styles.secondaryButton}
            activeOpacity={0.8}
            onPress={closePasswordModal}
          >
            <Text style={styles.secondaryButtonText}>Cancel</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={styles.primaryButton}
            activeOpacity={0.85}
            onPress={handlePasswordSubmit}
          >
            <Text style={styles.primaryButtonText}>Update Password</Text>
          </TouchableOpacity>
        </View>
      </SheetModal>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: {
    flex: 1,
    backgroundColor: colors.background,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 10,
  },
  headerButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.white,
    borderWidth: 1,
    borderColor: colors.border,
  },
  headerTitle: {
    flex: 1,
    marginHorizontal: 12,
    fontSize: 20,
    fontWeight: '700',
    color: colors.dark,
  },
  scrollContent: {
    paddingHorizontal: 20,
    paddingTop: 4,
    paddingBottom: 24,
  },
  sectionLabel: {
    marginTop: 20,
    marginBottom: 10,
    fontSize: 12,
    fontWeight: '600',
    letterSpacing: 0.8,
    color: MUTED,
  },
  card: {
    backgroundColor: colors.white,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: colors.border,
    overflow: 'hidden',
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 14,
    paddingVertical: 14,
  },
  rowDivider: {
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  iconBox: {
    width: 40,
    height: 40,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  rowTextWrap: {
    flex: 1,
    paddingRight: 8,
  },
  rowTitle: {
    fontSize: 15,
    fontWeight: '600',
  },
  rowSubtitle: {
    marginTop: 2,
    fontSize: 12.5,
    color: MUTED,
  },
  chip: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F2F3F5',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 10,
  },
  chipText: {
    fontSize: 13,
    fontWeight: '600',
    color: colors.dark,
  },
  chipChevron: {
    marginLeft: 6,
  },
  footer: {
    paddingHorizontal: 20,
    paddingTop: 12,
    paddingBottom: 12,
    backgroundColor: colors.background,
    borderTopWidth: 1,
    borderTopColor: colors.border,
  },
  saveButton: {
    backgroundColor: colors.primary,
    borderRadius: 16,
    paddingVertical: 16,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: colors.primary,
    shadowOpacity: 0.28,
    shadowRadius: 12,
    shadowOffset: { width: 0, height: 6 },
    elevation: 4,
  },
  saveText: {
    color: colors.white,
    fontSize: 16,
    fontWeight: '700',
  },
  modalRoot: {
    flex: 1,
    justifyContent: 'flex-end',
    backgroundColor: 'rgba(17, 17, 17, 0.45)',
  },
  sheet: {
    backgroundColor: colors.white,
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    paddingHorizontal: 20,
    paddingTop: 8,
    paddingBottom: 28,
  },
  sheetHandle: {
    alignSelf: 'center',
    width: 44,
    height: 5,
    borderRadius: 3,
    backgroundColor: '#E2E4E8',
    marginBottom: 14,
  },
  sheetHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 14,
  },
  sheetTitle: {
    fontSize: 17,
    fontWeight: '700',
    color: colors.dark,
  },
  sheetClose: {
    width: 32,
    height: 32,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.background,
  },
  optionRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 14,
    paddingHorizontal: 14,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: colors.border,
    marginBottom: 10,
  },
  optionRowActive: {
    borderColor: colors.primary,
    backgroundColor: '#FFF6F2',
  },
  optionLeft: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  optionText: {
    marginLeft: 10,
    fontSize: 15,
    fontWeight: '600',
    color: colors.dark,
  },
  optionDot: {
    width: 16,
    height: 16,
    borderRadius: 8,
    borderWidth: 1.5,
    borderColor: '#D7DADE',
  },
  inputLabel: {
    fontSize: 12.5,
    fontWeight: '600',
    color: MUTED,
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
    borderRadius: 12,
    paddingHorizontal: 14,
    paddingVertical: 12,
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
    color: DANGER,
  },
  sheetActions: {
    flexDirection: 'row',
    marginTop: 18,
  },
  secondaryButton: {
    flex: 1,
    paddingVertical: 14,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.white,
    marginRight: 10,
  },
  secondaryButtonText: {
    fontSize: 15,
    fontWeight: '600',
    color: colors.dark,
  },
  primaryButton: {
    flex: 1.6,
    paddingVertical: 14,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.primary,
  },
  primaryButtonText: {
    fontSize: 15,
    fontWeight: '700',
    color: colors.white,
  },
});