import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { COLORS, RADIUS, SPACING } from '../constants/theme';

export const Badge = ({ label, variant = 'default', size = 'md' }) => {
  const getColors = () => {
    switch (variant.toLowerCase()) {
      case 'low':
      case 'success':
      case 'completed':
        return { bg: 'rgba(16, 185, 129, 0.15)', text: COLORS.emeraldLight, border: 'rgba(16, 185, 129, 0.3)' };
      case 'medium':
      case 'warning':
      case 'caution':
        return { bg: 'rgba(245, 158, 11, 0.15)', text: '#fbbf24', border: 'rgba(245, 158, 11, 0.3)' };
      case 'high':
      case 'danger':
      case 'error':
        return { bg: 'rgba(239, 68, 68, 0.15)', text: '#f87171', border: 'rgba(239, 68, 68, 0.3)' };
      case 'cyan':
      case 'primary':
        return { bg: COLORS.primaryGlow, text: COLORS.primaryLight, border: 'rgba(14, 165, 233, 0.3)' };
      case 'violet':
      case 'accent':
        return { bg: COLORS.accentGlow, text: COLORS.accentLight, border: 'rgba(99, 102, 241, 0.3)' };
      default:
        return { bg: 'rgba(148, 163, 184, 0.15)', text: COLORS.textSecondary, border: 'rgba(148, 163, 184, 0.25)' };
    }
  };

  const c = getColors();
  const isSmall = size === 'sm';

  return (
    <View
      style={[
        styles.badge,
        { backgroundColor: c.bg, borderColor: c.border },
        isSmall && styles.badgeSm,
      ]}
    >
      <Text style={[styles.text, { color: c.text }, isSmall && styles.textSm]}>
        {label}
      </Text>
    </View>
  );
};

const styles = StyleSheet.create({
  badge: {
    paddingHorizontal: SPACING.sm + 2,
    paddingVertical: 3,
    borderRadius: RADIUS.full,
    borderWidth: 1,
    alignSelf: 'flex-start',
  },
  badgeSm: {
    paddingHorizontal: SPACING.xs + 2,
    paddingVertical: 1,
  },
  text: {
    fontSize: 12,
    fontWeight: '600',
    letterSpacing: 0.3,
  },
  textSm: {
    fontSize: 10,
  },
});

