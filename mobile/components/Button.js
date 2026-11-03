import React from 'react';
import { TouchableOpacity, Text, ActivityIndicator, StyleSheet, View } from 'react-native';
import { COLORS, RADIUS, SPACING } from '../constants/theme';

export const Button = ({
  title,
  onPress,
  variant = 'primary', // 'primary', 'secondary', 'outline', 'danger', 'ghost'
  size = 'md', // 'sm', 'md', 'lg'
  icon = null,
  loading = false,
  disabled = false,
  style = {},
  textStyle = {},
}) => {
  const getVariantStyles = () => {
    switch (variant) {
      case 'secondary':
        return {
          btn: { backgroundColor: COLORS.secondaryDark, borderColor: COLORS.secondary },
          text: { color: COLORS.text },
        };
      case 'outline':
        return {
          btn: { backgroundColor: 'transparent', borderColor: COLORS.primary, borderWidth: 1.5 },
          text: { color: COLORS.primaryLight },
        };
      case 'ghost':
        return {
          btn: { backgroundColor: 'transparent', borderColor: 'transparent' },
          text: { color: COLORS.textSecondary },
        };
      case 'danger':
        return {
          btn: { backgroundColor: 'rgba(239, 68, 68, 0.2)', borderColor: COLORS.danger, borderWidth: 1 },
          text: { color: '#f87171' },
        };
      case 'accent':
        return {
          btn: { backgroundColor: COLORS.accent, borderColor: COLORS.accentLight },
          text: { color: '#ffffff' },
        };
      case 'primary':
      default:
        return {
          btn: { backgroundColor: COLORS.primary, borderColor: COLORS.primaryLight },
          text: { color: '#ffffff' },
        };
    }
  };

  const v = getVariantStyles();

  const getSizeStyles = () => {
    switch (size) {
      case 'sm':
        return { paddingVertical: 6, paddingHorizontal: 12, fontSize: 13 };
      case 'lg':
        return { paddingVertical: 14, paddingHorizontal: 24, fontSize: 16 };
      case 'md':
      default:
        return { paddingVertical: 10, paddingHorizontal: 18, fontSize: 14 };
    }
  };

  const s = getSizeStyles();

  return (
    <TouchableOpacity
      activeOpacity={0.75}
      onPress={onPress}
      disabled={disabled || loading}
      style={[
        styles.button,
        v.btn,
        { paddingVertical: s.paddingVertical, paddingHorizontal: s.paddingHorizontal },
        disabled && styles.disabled,
        style,
      ]}
    >
      {loading ? (
        <ActivityIndicator size="small" color={v.text.color} />
      ) : (
        <View style={styles.contentRow}>
          {icon && <View style={styles.iconContainer}>{icon}</View>}
          <Text style={[styles.text, v.text, { fontSize: s.fontSize }, textStyle]}>
            {title}
          </Text>
        </View>
      )}
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  button: {
    borderRadius: RADIUS.md,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    flexDirection: 'row',
  },
  contentRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  },
  iconContainer: {
    marginRight: SPACING.sm,
  },
  text: {
    fontWeight: '600',
    letterSpacing: 0.2,
  },
  disabled: {
    opacity: 0.45,
  },
});

