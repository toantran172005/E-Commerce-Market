import React, { useMemo, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  Image,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';

import { colors } from '../src/constants/theme';

const PRIMARY = colors.primary || '#FF5722';
const DARK = colors.dark || '#1A1A1A';
const BACKGROUND = colors.background || '#F8F9FB';
const BORDER = colors.border || '#ECEEF1';
const WHITE = colors.white || '#FFFFFF';

type IconName = React.ComponentProps<typeof Ionicons>['name'];

type Profile = {
  fullName: string;
  email: string;
  phone: string;
  address: string;
};

const INITIAL_PROFILE: Profile = {
  fullName: 'Trần Minh Alex',
  email: 'alex.carter@novatech.io',
  phone: '+84 901 284 920',
  address: '123 Nguyễn Huệ, Quận 1, TP. Hồ Chí Minh',
};

const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

type InputFieldProps = {
  label: string;
  icon: IconName;
  value: string;
  placeholder: string;
  onChangeText: (text: string) => void;
  onFocus: () => void;
  onBlur: () => void;
  isFocused: boolean;
  keyboardType?: 'default' | 'email-address' | 'phone-pad';
  autoCapitalize?: 'none' | 'words' | 'sentences';
  autoComplete?: 'name' | 'email' | 'tel' | 'street-address' | 'off';
  multiline?: boolean;
};

function InputField({
  label,
  icon,
  value,
  placeholder,
  onChangeText,
  onFocus,
  onBlur,
  isFocused,
  keyboardType = 'default',
  autoCapitalize = 'words',
  autoComplete = 'off',
  multiline = false,
}: InputFieldProps) {
  return (
    <View style={styles.fieldWrapper}>
      <Text style={styles.label}>{label}</Text>
      <View
        style={[
          styles.inputContainer,
          isFocused && styles.inputContainerFocused,
          multiline && styles.inputContainerMultiline,
        ]}
      >
        <Ionicons
          name={icon}
          size={19}
          color={isFocused ? PRIMARY : '#9AA0A6'}
          style={styles.inputIcon}
        />
        <TextInput
          style={[styles.input, multiline && styles.inputMultiline]}
          value={value}
          placeholder={placeholder}
          placeholderTextColor="#B0B5BC"
          onChangeText={onChangeText}
          onFocus={onFocus}
          onBlur={onBlur}
          keyboardType={keyboardType}
          autoCapitalize={autoCapitalize}
          autoCorrect={false}
          autoComplete={autoComplete}
          selectionColor={PRIMARY}
          multiline={multiline}
          textAlignVertical={multiline ? 'top' : 'center'}
        />
        {value.length > 0 && isFocused ? (
          <TouchableOpacity
            onPress={() => onChangeText('')}
            hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
            activeOpacity={0.6}
          >
            <Ionicons name="close-circle" size={18} color="#C7CCD4" />
          </TouchableOpacity>
        ) : null}
      </View>
    </View>
  );
}

export default function UpdateUserScreen() {
  const router = useRouter();

  const [profile, setProfile] = useState<Profile>(INITIAL_PROFILE);
  const [focusedField, setFocusedField] = useState<keyof Profile | null>(null);
  const [isSaving, setIsSaving] = useState(false);
  const [avatarUri, setAvatarUri] = useState<string | null>(null);

  const hasChanges = useMemo(() => {
    return (
      profile.fullName !== INITIAL_PROFILE.fullName ||
      profile.email !== INITIAL_PROFILE.email ||
      profile.phone !== INITIAL_PROFILE.phone ||
      profile.address !== INITIAL_PROFILE.address ||
      avatarUri !== null
    );
  }, [profile, avatarUri]);

  const initials = useMemo(() => {
    const parts = profile.fullName.trim().split(/\s+/).filter(Boolean);
    if (parts.length === 0) return 'U';
    if (parts.length === 1) return parts[0].charAt(0).toUpperCase();
    return (
      parts[0].charAt(0).toUpperCase() +
      parts[parts.length - 1].charAt(0).toUpperCase()
    );
  }, [profile.fullName]);

  const updateField = (key: keyof Profile, value: string) => {
    setProfile((prev) => ({ ...prev, [key]: value }));
  };

  const handleCancel = () => {
    if (!hasChanges) {
      router.back();
      return;
    }
    Alert.alert('Discard changes?', 'Your changes will not be saved.', [
      { text: 'Keep Editing', style: 'cancel' },
      { text: 'Discard', style: 'destructive', onPress: () => router.back() },
    ]);
  };

  const handleChangeAvatar = () => {
    Alert.alert('Change Profile Photo', 'Choose an option', [
      {
        text: 'Take Photo',
        onPress: () => {
          setAvatarUri('https://i.pravatar.cc/300?img=13');
          Alert.alert('Camera', 'Camera opened successfully (demo).');
        },
      },
      {
        text: 'Choose from Library',
        onPress: () => {
          setAvatarUri('https://i.pravatar.cc/300?img=12');
          Alert.alert('Gallery', 'Photo selected from library.');
        },
      },
      {
        text: 'Remove Photo',
        style: 'destructive',
        onPress: () => setAvatarUri(null),
      },
      { text: 'Cancel', style: 'cancel' },
    ]);
  };

  const handleSave = () => {
    if (isSaving) return;

    if (profile.fullName.trim().length < 2) {
      Alert.alert('Invalid Name', 'Please enter your full name.');
      return;
    }
    if (!EMAIL_REGEX.test(profile.email.trim())) {
      Alert.alert('Invalid Email', 'Please enter a valid email address.');
      return;
    }
    if (profile.phone.trim().length < 6) {
      Alert.alert('Invalid Phone Number', 'Please enter a valid phone number.');
      return;
    }

    setIsSaving(true);
    setTimeout(() => {
      setIsSaving(false);
      Alert.alert('Success', 'Profile updated!', [
        { text: 'OK', onPress: () => router.back() },
      ]);
    }, 900);
  };

  return (
    <SafeAreaView style={styles.safeArea} edges={['top', 'bottom']}>
      <KeyboardAvoidingView
        style={styles.flex}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        keyboardVerticalOffset={Platform.OS === 'ios' ? 8 : 0}
      >
        <View style={styles.header}>
          <TouchableOpacity
            style={styles.backButton}
            onPress={handleCancel}
            activeOpacity={0.7}
          >
            <Ionicons name="chevron-back" size={22} color={DARK} />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Update Information</Text>
          <View style={styles.headerSpacer} />
        </View>

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
            >
              {avatarUri ? (
                <Image source={{ uri: avatarUri }} style={styles.avatarImage} />
              ) : (
                <View style={styles.avatarPlaceholder}>
                  <Text style={styles.avatarInitials}>{initials}</Text>
                </View>
              )}
              <View style={styles.cameraBadge}>
                <Ionicons name="camera" size={16} color={WHITE} />
              </View>
            </TouchableOpacity>
            <TouchableOpacity onPress={handleChangeAvatar} activeOpacity={0.7}>
              <Text style={styles.changePhotoText}>Change Profile Photo</Text>
            </TouchableOpacity>
          </View>

          <View style={styles.formCard}>
            <InputField
              label="Full Name"
              icon="person-outline"
              value={profile.fullName}
              placeholder="Enter your full name"
              onChangeText={(text) => updateField('fullName', text)}
              onFocus={() => setFocusedField('fullName')}
              onBlur={() => setFocusedField(null)}
              isFocused={focusedField === 'fullName'}
              autoCapitalize="words"
              autoComplete="name"
            />

            <InputField
              label="Email Address"
              icon="mail-outline"
              value={profile.email}
              placeholder="Enter your email address"
              onChangeText={(text) => updateField('email', text)}
              onFocus={() => setFocusedField('email')}
              onBlur={() => setFocusedField(null)}
              isFocused={focusedField === 'email'}
              keyboardType="email-address"
              autoCapitalize="none"
              autoComplete="email"
            />

            <InputField
              label="Phone Number"
              icon="call-outline"
              value={profile.phone}
              placeholder="Enter your phone number"
              onChangeText={(text) => updateField('phone', text)}
              onFocus={() => setFocusedField('phone')}
              onBlur={() => setFocusedField(null)}
              isFocused={focusedField === 'phone'}
              keyboardType="phone-pad"
              autoCapitalize="none"
              autoComplete="tel"
            />

            <InputField
              label="Address"
              icon="location-outline"
              value={profile.address}
              placeholder="Enter your address"
              onChangeText={(text) => updateField('address', text)}
              onFocus={() => setFocusedField('address')}
              onBlur={() => setFocusedField(null)}
              isFocused={focusedField === 'address'}
              autoCapitalize="sentences"
              autoComplete="street-address"
              multiline
            />
          </View>

          <View style={styles.hintRow}>
            <Ionicons
              name="shield-checkmark-outline"
              size={15}
              color="#9AA0A6"
            />
            <Text style={styles.hintText}>
              Your personal information is kept private and secure.
            </Text>
          </View>
        </ScrollView>

        <View style={styles.footer}>
          <TouchableOpacity
            style={styles.cancelButton}
            onPress={handleCancel}
            activeOpacity={0.8}
            disabled={isSaving}
          >
            <Text style={styles.cancelButtonText}>Cancel</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.saveButton, isSaving && styles.saveButtonDisabled]}
            onPress={handleSave}
            activeOpacity={0.85}
            disabled={isSaving}
          >
            {isSaving ? (
              <ActivityIndicator color={WHITE} size="small" />
            ) : (
              <Text style={styles.saveButtonText}>Save Changes</Text>
            )}
          </TouchableOpacity>
        </View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: BACKGROUND,
  },
  flex: {
    flex: 1,
  },
  header: {
    height: 56,
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    backgroundColor: BACKGROUND,
  },
  backButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: WHITE,
    borderWidth: 1,
    borderColor: BORDER,
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerTitle: {
    flex: 1,
    textAlign: 'center',
    fontSize: 18,
    fontWeight: '700',
    color: DARK,
    letterSpacing: 0.2,
  },
  headerSpacer: {
    width: 40,
    height: 40,
  },
  scrollContent: {
    paddingHorizontal: 20,
    paddingTop: 8,
    paddingBottom: 28,
  },
  avatarSection: {
    alignItems: 'center',
    paddingVertical: 12,
  },
  avatarWrapper: {
    width: 104,
    height: 104,
    borderRadius: 52,
    marginBottom: 12,
  },
  avatarImage: {
    width: 104,
    height: 104,
    borderRadius: 52,
    backgroundColor: BORDER,
  },
  avatarPlaceholder: {
    width: 104,
    height: 104,
    borderRadius: 52,
    backgroundColor: '#FDE8E1',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 2,
    borderColor: WHITE,
  },
  avatarInitials: {
    fontSize: 34,
    fontWeight: '700',
    color: PRIMARY,
    letterSpacing: 1,
  },
  cameraBadge: {
    position: 'absolute',
    right: 0,
    bottom: 4,
    width: 34,
    height: 34,
    borderRadius: 17,
    backgroundColor: PRIMARY,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 3,
    borderColor: WHITE,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.18,
    shadowRadius: 4,
    elevation: 4,
  },
  changePhotoText: {
    fontSize: 13,
    fontWeight: '600',
    color: PRIMARY,
  },
  formCard: {
    backgroundColor: WHITE,
    borderRadius: 20,
    paddingHorizontal: 16,
    paddingTop: 6,
    paddingBottom: 18,
    borderWidth: 1,
    borderColor: BORDER,
    shadowColor: '#1A1A1A',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.04,
    shadowRadius: 14,
    elevation: 2,
  },
  fieldWrapper: {
    marginTop: 16,
  },
  label: {
    fontSize: 13,
    fontWeight: '600',
    color: DARK,
    marginBottom: 8,
    letterSpacing: 0.1,
  },
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    height: 52,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: BORDER,
    backgroundColor: WHITE,
    paddingHorizontal: 14,
  },
  inputContainerFocused: {
    borderColor: PRIMARY,
    backgroundColor: '#FFF8F5',
  },
  inputContainerMultiline: {
    height: 84,
    alignItems: 'flex-start',
    paddingTop: 14,
  },
  inputIcon: {
    marginRight: 10,
  },
  input: {
    flex: 1,
    fontSize: 15,
    color: DARK,
    padding: 0,
    height: '100%',
  },
  inputMultiline: {
    height: 56,
    paddingTop: 0,
    lineHeight: 20,
  },
  hintRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 18,
    paddingHorizontal: 10,
  },
  hintText: {
    fontSize: 12,
    color: '#9AA0A6',
    marginLeft: 6,
    flexShrink: 1,
  },
  footer: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingTop: 12,
    paddingBottom: 12,
    backgroundColor: BACKGROUND,
    borderTopWidth: 1,
    borderTopColor: BORDER,
  },
  cancelButton: {
    flex: 1,
    height: 54,
    borderRadius: 16,
    backgroundColor: WHITE,
    borderWidth: 1,
    borderColor: BORDER,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  cancelButtonText: {
    fontSize: 15,
    fontWeight: '600',
    color: DARK,
  },
  saveButton: {
    flex: 1.6,
    height: 54,
    borderRadius: 16,
    backgroundColor: PRIMARY,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: PRIMARY,
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.28,
    shadowRadius: 12,
    elevation: 5,
  },
  saveButtonDisabled: {
    opacity: 0.7,
  },
  saveButtonText: {
    fontSize: 15,
    fontWeight: '700',
    color: WHITE,
    letterSpacing: 0.2,
  },
});