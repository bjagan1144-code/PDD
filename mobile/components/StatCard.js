import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { COLORS, RADIUS, SPACING } from '../constants/theme';

export const StatCard = ({
  title,
  value,
  subtitle = null,
  icon = null,
  variant = 'cyan', // 'cyan', 'teal', 'violet'
  style = {},
}) => {
  const getAccent = () => {
    switch (variant) {
      case 'teal':
        return {
          glow: 'rgba(20, 184, 166, 0.12)',
          border: 'rgba(20, 184, 166, 0.25)',
          text: COLORS.secondaryLight,
        };
      case 'violet':
        return {
          glow: 'rgba(99, 102, 241, 0.12)',
          border: 'rgba(99, 102, 241, 0.25)',
          text: COLORS.accentLight,
        };
      case 'cyan':
      default:
        return {
          glow: 'rgba(14, 165, 233, 0.12)',
          border: 'rgba(14, 165, 233, 0.25)',
          text: COLORS.primaryLight,
        };
    }
  };

  const a = getAccent();

  return (
    <View style={[styles.card, { borderColor: a.border }, style]}>
      <View style={styles.topRow}>
        <Text style={styles.title}>{title}</Text>
        {icon && (
          <View style={[styles.iconPill, { backgroundColor: a.glow }]}>
            {icon}
          </View>
        )}
      </View>
      <Text style={[styles.value, { color: a.text }]}>{value}</Text>
      {subtitle && <Text style={styles.subtitle}>{subtitle}</Text>}
    </View>
  );
};

const styles = StyleSheet.create({
  card: {
    backgroundColor: COLORS.surface,
    borderRadius: RADIUS.lg,
    padding: SPACING.md,
    borderWidth: 1,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 8,
    elevation: 3,
  },
  topRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: SPACING.xs,
  },
  title: {
    color: COLORS.textSecondary,
    fontSize: 12,
    fontWeight: '500',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  iconPill: {
    width: 32,
    height: 32,
    borderRadius: RADIUS.sm,
    justifyContent: 'center',
    alignItems: 'center',
  },
  value: {
    fontSize: 24,
    fontWeight: '800',
    letterSpacing: -0.5,
    marginVertical: SPACING.xs,
  },
  subtitle: {
    color: COLORS.textMuted,
    fontSize: 11,
    marginTop: 2,
  },
});

