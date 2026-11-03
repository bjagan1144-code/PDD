import React from 'react';
import { View, Text, TextInput, StyleSheet } from 'react-native';
import { COLORS, RADIUS, SPACING } from '../constants/theme';

export const Input = ({
  label,
  value,
  onChangeText,
  placeholder,
  secureTextEntry = false,
  keyboardType = 'default',
  icon = null,
  error = null,
  helperText = null,
  editable = true,
  multiline = false,
  numberOfLines = 1,
  style = {},
}) => {
  return (
    <View style={[styles.container, style]}>
      {label && <Text style={styles.label}>{label}</Text>}
      <View
        style={[
          styles.inputWrapper,
          error ? styles.inputError : null,
          !editable ? styles.inputDisabled : null,
          multiline ? styles.inputMultiline : null,
        ]}
      >
        {icon && <View style={styles.iconBox}>{icon}</View>}
        <TextInput
          value={value !== undefined && value !== null ? String(value) : ''}
          onChangeText={onChangeText}
          placeholder={placeholder}
          placeholderTextColor={COLORS.textMuted}
          secureTextEntry={secureTextEntry}
          keyboardType={keyboardType}
          editable={editable}
          multiline={multiline}
          numberOfLines={numberOfLines}
          style={[styles.input, multiline && styles.textMultiline]}
        />
      </View>
      {error ? (
        <Text style={styles.errorText}>{error}</Text>
      ) : helperText ? (
        <Text style={styles.helperText}>{helperText}</Text>
      ) : null}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    marginBottom: SPACING.md,
  },
  label: {
    fontSize: 13,
    fontWeight: '500',
    color: COLORS.textSecondary,
    marginBottom: SPACING.xs + 2,
    letterSpacing: 0.2,
  },
  inputWrapper: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.inputBg,
    borderRadius: RADIUS.md,
    borderWidth: 1,
    borderColor: COLORS.surfaceBorder,
    paddingHorizontal: SPACING.md,
  },
  inputMultiline: {
    alignItems: 'flex-start',
    paddingVertical: SPACING.sm,
  },
  iconBox: {
    marginRight: SPACING.sm,
  },
  input: {
    flex: 1,
    color: COLORS.text,
    fontSize: 14,
    paddingVertical: SPACING.sm + 2,
  },
  textMultiline: {
    minHeight: 60,
    textAlignVertical: 'top',
  },
  inputError: {
    borderColor: COLORS.danger,
  },
  inputDisabled: {
    opacity: 0.6,
    backgroundColor: '#070b14',
  },
  errorText: {
    color: '#f87171',
    fontSize: 11,
    marginTop: 4,
  },
  helperText: {
    color: COLORS.textMuted,
    fontSize: 11,
    marginTop: 4,
  },
});

