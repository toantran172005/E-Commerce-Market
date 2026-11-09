import React from 'react';
import {
  StyleSheet,
  Text,
  TextInput,
  TextInputProps,
  View,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { colors, radius, spacing } from '../constants/theme';

type IconName = keyof typeof Ionicons.glyphMap;

interface FormFieldProps {
  label: string;
  value: string;
  onChangeText: (text: string) => void;
  placeholder?: string;
  error?: string;
  icon?: IconName;
  secureTextEntry?: boolean;
  keyboardType?: TextInputProps['keyboardType'];
  autoCapitalize?: TextInputProps['autoCapitalize'];
  multiline?: boolean;
}

/** TextInput có nhãn + icon + thông báo lỗi. */
export function FormField({
  label,
  value,
  onChangeText,
  placeholder,
  error,
  icon,
  secureTextEntry,
  keyboardType,
  autoCapitalize,
  multiline,
}: FormFieldProps) {
  return (
    <View style={styles.container}>
      <Text style={styles.label}>{label}</Text>
      <View style={[styles.inputWrap, error && styles.inputError, multiline && styles.inputMultiline]}>
        {icon ? (
          <Ionicons name={icon} size={19} color={colors.placeholder} style={styles.icon} />
        ) : null}
        <TextInput
          style={[styles.input, multiline && styles.textArea]}
          value={value}
          onChangeText={onChangeText}
          placeholder={placeholder}
          placeholderTextColor={colors.placeholder}
          secureTextEntry={secureTextEntry}
          keyboardType={keyboardType}
          autoCapitalize={autoCapitalize}
          autoCorrect={false}
          multiline={multiline}
          textAlignVertical={multiline ? 'top' : 'center'}
          accessibilityLabel={label}
        />
      </View>
      {error ? <Text style={styles.errorText}>{error}</Text> : null}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { marginBottom: spacing.md },
  label: {
    fontSize: 13,
    fontWeight: '600',
    color: colors.dark,
    marginBottom: spacing.sm,
    marginLeft: 2,
  },
  inputWrap: {
    flexDirection: 'row',
    alignItems: 'center',
    minHeight: 52,
    borderRadius: radius.md,
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.card,
    paddingHorizontal: spacing.md,
  },
  inputError: { borderColor: colors.danger },
  inputMultiline: {
    minHeight: 84,
    alignItems: 'flex-start',
    paddingTop: spacing.md,
  },
  icon: { marginRight: spacing.sm },
  input: {
    flex: 1,
    fontSize: 15,
    color: colors.dark,
    paddingVertical: 0,
  },
  textArea: {
    minHeight: 56,
    lineHeight: 20,
  },
  errorText: {
    marginTop: 4,
    marginLeft: 2,
    fontSize: 12.5,
    fontWeight: '600',
    color: colors.danger,
  },
});
