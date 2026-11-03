import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { COLORS, RADIUS, SPACING } from '../constants/theme';

export const BarChart = ({
  data = [],
  title = 'ML Feature Importance Ranking',
}) => {
  if (!data || data.length === 0) {
    return null;
  }

  // Find max value to normalize bar widths
  const maxVal = Math.max(...data.map((d) => d.importance || 0), 1);

  // Friendly name formatter
  const formatName = (key) => {
    return key
      .replace(/([A-Z])/g, ' $1')
      .replace(/^./, (str) => str.toUpperCase())
      .replace('drug_', 'Drug: ')
      .replace('polymer_', 'Polymer: ');
  };

  return (
    <View style={styles.card}>
      <Text style={styles.title}>{title}</Text>
      <Text style={styles.subtitle}>
        Physics & formulation weights derived from Random Forest model
      </Text>

      {data.map((item, idx) => {
        const pct = ((item.importance || 0) / maxVal) * 100;
        const rawPct = (item.importance || 0).toFixed(1);
        const isTop = idx < 2;

        return (
          <View key={`feat-${idx}-${item.name}`} style={styles.barRow}>
            <View style={styles.labelRow}>
              <Text style={[styles.featName, isTop && styles.topFeatName]}>
                {formatName(item.name)}
              </Text>
              <Text style={[styles.featVal, isTop && styles.topFeatVal]}>
                {rawPct}%
              </Text>
            </View>
            <View style={styles.track}>
              <View
                style={[
                  styles.bar,
                  {
                    width: `${Math.max(4, Math.min(100, pct))}%`,
                    backgroundColor: isTop ? COLORS.accentLight : COLORS.primary,
                  },
                ]}
              />
            </View>
          </View>
        );
      })}
    </View>
  );
};

const styles = StyleSheet.create({
  card: {
    backgroundColor: COLORS.surface,
    borderRadius: RADIUS.lg,
    padding: SPACING.md,
    borderWidth: 1,
    borderColor: COLORS.surfaceBorder,
    marginBottom: SPACING.md,
  },
  title: {
    color: COLORS.text,
    fontSize: 14,
    fontWeight: '700',
    marginBottom: 2,
  },
  subtitle: {
    color: COLORS.textMuted,
    fontSize: 11,
    marginBottom: SPACING.md,
  },
  barRow: {
    marginBottom: SPACING.sm + 2,
  },
  labelRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 4,
  },
  featName: {
    color: COLORS.textSecondary,
    fontSize: 12,
  },
  topFeatName: {
    color: COLORS.text,
    fontWeight: '600',
  },
  featVal: {
    color: COLORS.textMuted,
    fontSize: 12,
    fontWeight: '600',
  },
  topFeatVal: {
    color: COLORS.accentLight,
  },
  track: {
    height: 8,
    backgroundColor: COLORS.surfaceBorder,
    borderRadius: RADIUS.full,
    overflow: 'hidden',
  },
  bar: {
    height: '100%',
    borderRadius: RADIUS.full,
  },
});

