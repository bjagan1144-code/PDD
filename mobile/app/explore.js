import React, { useState } from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  StyleSheet,
  SafeAreaView,
} from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { COLORS, RADIUS, SPACING } from '../constants/theme';
import { Header } from '../components/Header';
import { CurveChart } from '../components/CurveChart';
import { Badge } from '../components/Badge';
import { Button } from '../components/Button';

const PRESETS = [
  {
    id: 'fentanyl_chitosan',
    title: 'Sustained Analgesic',
    drug: 'Fentanyl',
    polymer: 'Chitosan',
    loading: '50 mg',
    thickness: '0.5 mm',
    release24: '24.6%',
    risk: 'Low',
    curve: [
      { time: 0, predicted: 0.0, target: 0.0 },
      { time: 2, predicted: 7.2, target: 6.5 },
      { time: 4, predicted: 10.4, target: 11.0 },
      { time: 6, predicted: 12.9, target: 14.2 },
      { time: 8, predicted: 15.0, target: 16.8 },
      { time: 12, predicted: 18.5, target: 20.5 },
      { time: 16, predicted: 21.1, target: 22.0 },
      { time: 20, predicted: 23.1, target: 23.5 },
      { time: 24, predicted: 24.6, target: 24.6 },
    ],
    notes: 'Zero-order sustained profile with low initial burst delivery.',
  },
  {
    id: 'nicotine_pva',
    title: 'Rapid Dissolution',
    drug: 'Nicotine',
    polymer: 'PVA',
    loading: '20 mg',
    thickness: '0.4 mm',
    release24: '16.9%',
    risk: 'Low',
    curve: [
      { time: 0, predicted: 0.0, target: 0.0 },
      { time: 2, predicted: 5.1, target: 4.8 },
      { time: 4, predicted: 7.4, target: 7.5 },
      { time: 6, predicted: 9.1, target: 9.8 },
      { time: 8, predicted: 10.5, target: 11.5 },
      { time: 12, predicted: 12.8, target: 14.0 },
      { time: 16, predicted: 14.6, target: 15.2 },
      { time: 20, predicted: 15.9, target: 16.1 },
      { time: 24, predicted: 16.9, target: 16.9 },
    ],
    notes: 'Fast initial hydration with steady matrix plateau.',
  },
  {
    id: 'lidocaine_pla',
    title: 'Hydrophobic Matrix',
    drug: 'Lidocaine',
    polymer: 'PLA',
    loading: '40 mg',
    thickness: '0.8 mm',
    release24: '12.8%',
    risk: 'High',
    curve: [
      { time: 0, predicted: 0.0, target: 0.0 },
      { time: 2, predicted: 2.5, target: 3.0 },
      { time: 4, predicted: 4.2, target: 5.0 },
      { time: 6, predicted: 5.7, target: 7.0 },
      { time: 8, predicted: 7.0, target: 8.5 },
      { time: 12, predicted: 9.2, target: 10.5 },
      { time: 16, predicted: 10.8, target: 11.8 },
      { time: 20, predicted: 11.9, target: 12.4 },
      { time: 24, predicted: 12.8, target: 12.8 },
    ],
    notes: 'Sub-therapeutic warning: dense PLA matrix retards release.',
  },
];

export default function ExploreScreen() {
  const router = useRouter();
  const [selectedPreset, setSelectedPreset] = useState(PRESETS[0]);

  return (
    <SafeAreaView style={styles.safeArea}>
      <Header title="Explore Kinetics" showBack={true} subtitle="Formulation Benchmarks" />

      <ScrollView style={styles.scroll} showsVerticalScrollIndicator={false}>
        <View style={styles.introBox}>
          <Text style={styles.introHeading}>In-Silico Kinetic Benchmarks</Text>
          <Text style={styles.introDesc}>
            Review pre-computed mathematical diffusion curves modeling Fickian mass transport across distinct polymer classes.
          </Text>
        </View>

        {/* Preset Selector Chips */}
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          style={styles.presetsScroll}
          contentContainerStyle={styles.presetsContainer}
        >
          {PRESETS.map((preset) => {
            const isSelected = selectedPreset.id === preset.id;
            return (
              <TouchableOpacity
                key={preset.id}
                style={[styles.presetChip, isSelected && styles.presetChipActive]}
                onPress={() => setSelectedPreset(preset)}
              >
                <Text style={[styles.presetChipTitle, isSelected && styles.presetChipTitleActive]}>
                  {preset.title}
                </Text>
                <Text style={styles.presetChipSub}>
                  {preset.drug} + {preset.polymer}
                </Text>
              </TouchableOpacity>
            );
          })}
        </ScrollView>

        {/* Selected Formulation Details Card */}
        <View style={styles.detailCard}>
          <View style={styles.detailHeader}>
            <View>
              <Text style={styles.detailTitle}>{selectedPreset.title}</Text>
              <Text style={styles.detailSubtitle}>
                {selectedPreset.drug} in {selectedPreset.polymer} Matrix
              </Text>
            </View>
            <Badge
              label={`Risk: ${selectedPreset.risk}`}
              variant={selectedPreset.risk}
            />
          </View>

          {/* Key Metrics Row */}
          <View style={styles.metricsRow}>
            <View style={styles.metricItem}>
              <Text style={styles.metricLabel}>Drug Loading</Text>
              <Text style={styles.metricValue}>{selectedPreset.loading}</Text>
            </View>
            <View style={styles.metricItem}>
              <Text style={styles.metricLabel}>Thickness</Text>
              <Text style={styles.metricValue}>{selectedPreset.thickness}</Text>
            </View>
            <View style={styles.metricItem}>
              <Text style={styles.metricLabel}>24h Delivery</Text>
              <Text style={[styles.metricValue, { color: COLORS.primaryLight }]}>
                {selectedPreset.release24}
              </Text>
            </View>
          </View>

          {/* Interactive Release Chart */}
          <CurveChart
            data={selectedPreset.curve}
            title={`${selectedPreset.drug} Cumulative Release (%)`}
          />

          <View style={styles.notesBox}>
            <Ionicons name="information-circle-outline" size={16} color={COLORS.primaryLight} style={{ marginRight: 6 }} />
            <Text style={styles.notesText}>{selectedPreset.notes}</Text>
          </View>

          <Button
            title="Configure in Simulator"
            onPress={() => router.push('/(tabs)/simulator')}
            icon={<Ionicons name="options-outline" size={16} color="#ffffff" />}
            style={{ marginTop: SPACING.md }}
          />
        </View>

        <View style={{ height: 40 }} />
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: COLORS.background,
  },
  scroll: {
    flex: 1,
  },
  introBox: {
    paddingHorizontal: SPACING.md,
    paddingTop: SPACING.md,
    paddingBottom: SPACING.sm,
  },
  introHeading: {
    color: COLORS.text,
    fontSize: 18,
    fontWeight: '700',
    marginBottom: 4,
  },
  introDesc: {
    color: COLORS.textSecondary,
    fontSize: 13,
    lineHeight: 18,
  },
  presetsScroll: {
    paddingLeft: SPACING.md,
    marginVertical: SPACING.sm,
  },
  presetsContainer: {
    paddingRight: SPACING.lg,
    gap: SPACING.sm,
  },
  presetChip: {
    backgroundColor: COLORS.surface,
    paddingHorizontal: SPACING.md,
    paddingVertical: SPACING.sm + 2,
    borderRadius: RADIUS.md,
    borderWidth: 1,
    borderColor: COLORS.surfaceBorder,
    minWidth: 140,
  },
  presetChipActive: {
    backgroundColor: COLORS.surfaceCard,
    borderColor: COLORS.primary,
  },
  presetChipTitle: {
    color: COLORS.textSecondary,
    fontSize: 13,
    fontWeight: '600',
  },
  presetChipTitleActive: {
    color: COLORS.primaryLight,
  },
  presetChipSub: {
    color: COLORS.textMuted,
    fontSize: 11,
    marginTop: 2,
  },
  detailCard: {
    marginHorizontal: SPACING.md,
    marginTop: SPACING.sm,
    backgroundColor: COLORS.surfaceCard,
    borderRadius: RADIUS.lg,
    borderWidth: 1,
    borderColor: COLORS.surfaceBorder,
    padding: SPACING.md,
  },
  detailHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: SPACING.md,
  },
  detailTitle: {
    color: COLORS.text,
    fontSize: 16,
    fontWeight: '700',
  },
  detailSubtitle: {
    color: COLORS.textSecondary,
    fontSize: 12,
    marginTop: 2,
  },
  metricsRow: {
    flexDirection: 'row',
    backgroundColor: COLORS.inputBg,
    borderRadius: RADIUS.md,
    padding: SPACING.sm + 2,
    marginBottom: SPACING.md,
    borderWidth: 1,
    borderColor: COLORS.surfaceBorder,
  },
  metricItem: {
    flex: 1,
    alignItems: 'center',
  },
  metricLabel: {
    color: COLORS.textMuted,
    fontSize: 10,
    textTransform: 'uppercase',
    fontWeight: '600',
  },
  metricValue: {
    color: COLORS.text,
    fontSize: 14,
    fontWeight: '700',
    marginTop: 2,
  },
  notesBox: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.primaryGlow,
    padding: SPACING.sm + 2,
    borderRadius: RADIUS.md,
    borderWidth: 1,
    borderColor: 'rgba(14, 165, 233, 0.25)',
  },
  notesText: {
    color: COLORS.primaryLight,
    fontSize: 11,
    flex: 1,
  },
});

