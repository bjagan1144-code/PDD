import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import Slider from '@react-native-community/slider';
import { COLORS, RADIUS, SPACING } from '../constants/theme';

export const SliderInput = ({
  label,
  value,
  onValueChange,
  min = 0,
  max = 100,
  step = 1,
  unit = '',
  description = null,
}) => {
  return (
    <View style={styles.card}>
      <View style={styles.headerRow}>
        <Text style={styles.label}>{label}</Text>
        <View style={styles.valPill}>
          <Text style={styles.valText}>
            {typeof value === 'number' ? (Number.isInteger(step) ? value : value.toFixed(1)) : value}
            {unit ? ` ${unit}` : ''}
          </Text>
        </View>
      </View>

      {description && <Text style={styles.description}>{description}</Text>}

      <Slider
        value={value}
        onValueChange={onValueChange}
        minimumValue={min}
        maximumValue={max}
        step={step}
        minimumTrackTintColor={COLORS.primary}
        maximumTrackTintColor={COLORS.surfaceBorder}
        thumbTintColor={COLORS.primaryLight}
        style={styles.slider}
      />

      <View style={styles.boundsRow}>
        <Text style={styles.boundText}>{min} {unit}</Text>
        <Text style={styles.boundText}>{max} {unit}</Text>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  card: {
    backgroundColor: COLORS.surfaceCard,
    borderRadius: RADIUS.md,
    borderWidth: 1,
    borderColor: COLORS.surfaceBorder,
    padding: SPACING.md,
    marginBottom: SPACING.sm + 4,
  },
  headerRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: SPACING.xs,
  },
  label: {
    color: COLORS.text,
    fontSize: 14,
    fontWeight: '600',
  },
  valPill: {
    backgroundColor: COLORS.primaryGlow,
    paddingHorizontal: SPACING.sm + 2,
    paddingVertical: 3,
    borderRadius: RADIUS.full,
    borderWidth: 1,
    borderColor: 'rgba(14, 165, 233, 0.4)',
  },
  valText: {
    color: COLORS.primaryLight,
    fontWeight: '700',
    fontSize: 13,
  },
  description: {
    color: COLORS.textMuted,
    fontSize: 11,
    marginBottom: SPACING.xs,
  },
  slider: {
    width: '100%',
    height: 38,
  },
  boundsRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: -4,
  },
  boundText: {
    color: COLORS.textMuted,
    fontSize: 10,
  },
});

