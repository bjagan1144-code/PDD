import React, { useState } from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  StyleSheet,
  SafeAreaView,
  ActivityIndicator,
  Alert,
} from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { COLORS, RADIUS, SPACING } from '../../constants/theme';
import { Header } from '../../components/Header';
import { SliderInput } from '../../components/SliderInput';
import { CurveChart } from '../../components/CurveChart';
import { Badge } from '../../components/Badge';
import { Button } from '../../components/Button';
import { simulationService } from '../../services/simulationService';
import { reportService } from '../../services/reportService';

const DRUGS = ['Fentanyl', 'Ibuprofen', 'Metformin', 'Paracetamol', 'Losartan', 'Nicotine'];
const POLYMERS = ['Chitosan', 'PLA', 'Alginate', 'Gelatin', 'Pectin', 'Cellulose', 'PVA'];

export default function SimulatorScreen() {
  const router = useRouter();

  // Selected Actives
  const [selectedDrug, setSelectedDrug] = useState('Fentanyl');
  const [selectedPolymer, setSelectedPolymer] = useState('Chitosan');

  // Sliders state (supports zero drug loading = 0)
  const [drugLoading, setDrugLoading] = useState(50.0);
  const [polymerConcentration, setPolymerConcentration] = useState(5.0);
  const [patchThickness, setPatchThickness] = useState(0.5);
  const [temperature, setTemperature] = useState(37.0);
  const [pH, setPH] = useState(7.4);
  const [moisture, setMoisture] = useState(60.0);
  const [duration, setDuration] = useState(24.0);

  // Execution state
  const [isSimulating, setIsSimulating] = useState(false);
  const [simulationResult, setSimulationResult] = useState(null);
  const [errorMsg, setErrorMsg] = useState('');
  const [reportGenerating, setReportGenerating] = useState(false);

  const handleRun = async () => {
    setIsSimulating(true);
    setErrorMsg('');
    try {
      const res = await simulationService.runSimulation({
        drugName: selectedDrug,
        polymerName: selectedPolymer,
        drugLoading,
        polymerConcentration,
        patchThickness,
        temperature,
        pH,
        moisture,
        duration,
      });
      setSimulationResult(res);
    } catch (err) {
      setErrorMsg(err.message || 'Simulation execution failed.');
    } finally {
      setIsSimulating(false);
    }
  };

  const handleGenerateReport = async () => {
    if (!simulationResult?.id) return;
    setReportGenerating(true);
    try {
      const rep = await reportService.generateReport(simulationResult.id);
      Alert.alert(
        'Report Compiled',
        `Report ${rep.id} successfully generated and registered in Research Archives.`,
        [
          { text: 'View Reports', onPress: () => router.push('/reports') },
          { text: 'OK', style: 'cancel' },
        ]
      );
    } catch (err) {
      Alert.alert('Report Generation', err.message || 'Failed to generate report.');
    } finally {
      setReportGenerating(false);
    }
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      <Header title="Drug Release Simulator" subtitle="In-Silico Kinetic Engine" />

      <ScrollView style={styles.scroll} showsVerticalScrollIndicator={false}>
        {/* Intro Banner */}
        <View style={styles.introBox}>
          <Text style={styles.pageTitle}>Formulation Parameters</Text>
          <Text style={styles.pageDesc}>
            Adjust polymer matrix geometry, thermal conditions, and active pharmaceutical loading.
          </Text>
        </View>

        {errorMsg ? (
          <View style={styles.errorBox}>
            <Ionicons name="alert-circle-outline" size={16} color={COLORS.danger} style={{ marginRight: 6 }} />
            <Text style={styles.errorText}>{errorMsg}</Text>
          </View>
        ) : null}

        {/* Drug Selection Chips */}
        <View style={styles.sectionCard}>
          <Text style={styles.sectionHeader}>1. Active Pharmaceutical Ingredient (API)</Text>
          <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.chipRow}>
            {DRUGS.map((d) => {
              const active = selectedDrug === d;
              return (
                <TouchableOpacity
                  key={d}
                  style={[styles.chip, active && styles.chipActive]}
                  onPress={() => setSelectedDrug(d)}
                >
                  <Text style={[styles.chipText, active && styles.chipTextActive]}>{d}</Text>
                </TouchableOpacity>
              );
            })}
          </ScrollView>

          <Text style={[styles.sectionHeader, { marginTop: SPACING.md }]}>2. Biopolymer Barrier Matrix</Text>
          <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.chipRow}>
            {POLYMERS.map((p) => {
              const active = selectedPolymer === p;
              return (
                <TouchableOpacity
                  key={p}
                  style={[styles.chip, active && styles.chipActiveTeal]}
                  onPress={() => setSelectedPolymer(p)}
                >
                  <Text style={[styles.chipText, active && styles.chipTextActiveTeal]}>{p}</Text>
                </TouchableOpacity>
              );
            })}
          </ScrollView>
        </View>

        {/* Sliders Container */}
        <View style={styles.slidersContainer}>
          <Text style={styles.sectionHeading}>3. Physical Formulation & Environment</Text>

          {/* Zero loading supported */}
          <SliderInput
            label="Initial Drug Loading (M₀)"
            value={drugLoading}
            onValueChange={setDrugLoading}
            min={0}
            max={100}
            step={1}
            unit="mg"
            description="Total active drug mass embedded in matrix (0 mg yields 0% release)"
          />

          <SliderInput
            label="Polymer Concentration"
            value={polymerConcentration}
            onValueChange={setPolymerConcentration}
            min={1.0}
            max={25.0}
            step={0.5}
            unit="%"
            description="Matrix density; governs hydrodynamic pore tortuosity"
          />

          <SliderInput
            label="Patch Thickness"
            value={patchThickness}
            onValueChange={setPatchThickness}
            min={0.1}
            max={2.0}
            step={0.1}
            unit="mm"
            description="Diffusion pathlength; inverse square relationship to rate"
          />

          <SliderInput
            label="Ambient Temperature"
            value={temperature}
            onValueChange={setTemperature}
            min={20}
            max={45}
            step={1}
            unit="°C"
            description="Thermodynamic Arrhenius kinetic driver (Physiological: 37°C)"
          />

          <SliderInput
            label="Physiological pH"
            value={pH}
            onValueChange={setPH}
            min={4.0}
            max={9.0}
            step={0.1}
            unit=""
            description="Dermal surface is acidic (5.0 - 5.5); receptor fluid is 7.4"
          />

          <SliderInput
            label="Relative Moisture"
            value={moisture}
            onValueChange={setMoisture}
            min={10}
            max={100}
            step={5}
            unit="%"
            description="Hydrogel hydration & matrix pore expansion factor"
          />

          <SliderInput
            label="Simulation Duration"
            value={duration}
            onValueChange={setDuration}
            min={1}
            max={72}
            step={1}
            unit="hours"
            description="Total experimental dissolution / Franz cell evaluation window"
          />

          <Button
            title="Execute In-Silico Simulation"
            onPress={handleRun}
            loading={isSimulating}
            variant="primary"
            size="lg"
            icon={<Ionicons name="play" size={18} color="#ffffff" />}
            style={{ marginVertical: SPACING.md }}
          />
        </View>

        {/* Simulation Output Card */}
        {simulationResult && (
          <View style={styles.resultsCard}>
            <View style={styles.resultsHeader}>
              <View>
                <Text style={styles.resultsTitle}>
                  {simulationResult.drugName || selectedDrug} Kinetics Report
                </Text>
                <Text style={styles.resultsSubtitle}>
                  in {simulationResult.polymerName || selectedPolymer} Matrix
                </Text>
              </View>
              <Badge
                label={`Risk: ${simulationResult.riskLevel || 'Low'}`}
                variant={simulationResult.riskLevel || 'Low'}
              />
            </View>

            {/* Mass Balance Display */}
            <View style={styles.massBalanceBox}>
              <Text style={styles.massBalanceTitle}>Mass Balance Conservation</Text>
              <View style={styles.massBalanceRow}>
                <View style={styles.massItem}>
                  <Text style={styles.massLabel}>Initial Load</Text>
                  <Text style={styles.massValue}>
                    {simulationResult.drugLoading ?? drugLoading} mg
                  </Text>
                </View>
                <Text style={styles.massOp}>=</Text>
                <View style={styles.massItem}>
                  <Text style={styles.massLabel}>Released</Text>
                  <Text style={[styles.massValue, { color: COLORS.primaryLight }]}>
                    {simulationResult.releasedAmountMg ?? 0} mg
                  </Text>
                </View>
                <Text style={styles.massOp}>+</Text>
                <View style={styles.massItem}>
                  <Text style={styles.massLabel}>Remaining</Text>
                  <Text style={[styles.massValue, { color: COLORS.secondaryLight }]}>
                    {simulationResult.remainingDrugMg ?? 0} mg
                  </Text>
                </View>
              </View>
            </View>

            {/* Metrics Triplets */}
            <View style={styles.tripletRow}>
              <View style={styles.tripletCard}>
                <Text style={styles.tripletLabel}>Total Delivery</Text>
                <Text style={styles.tripletValue}>
                  {simulationResult.predictedRelease}%
                </Text>
              </View>
              <View style={styles.tripletCard}>
                <Text style={styles.tripletLabel}>Peak Rate</Text>
                <Text style={[styles.tripletValue, { color: COLORS.secondaryLight }]}>
                  {simulationResult.peakReleaseRate}%/h
                </Text>
              </View>
              <View style={styles.tripletCard}>
                <Text style={styles.tripletLabel}>Time to 50%</Text>
                <Text style={[styles.tripletValue, { color: COLORS.accentLight }]}>
                  {simulationResult.timeTo50Percent}
                </Text>
              </View>
            </View>

            {/* Curve Chart */}
            <CurveChart
              data={simulationResult.releaseCurve || []}
              title="Authoritative Release Curve (Higuchi / Peppas)"
            />

            {/* Narrative Analysis */}
            {simulationResult.analysis ? (
              <View style={styles.analysisBox}>
                <Ionicons name="analytics-outline" size={16} color={COLORS.primaryLight} style={{ marginRight: 6 }} />
                <Text style={styles.analysisText}>{simulationResult.analysis}</Text>
              </View>
            ) : null}

            <Button
              title="Compile PDF Research Report"
              onPress={handleGenerateReport}
              loading={reportGenerating}
              variant="outline"
              size="md"
              icon={<Ionicons name="document-text-outline" size={16} color={COLORS.primaryLight} />}
              style={{ marginTop: SPACING.md }}
            />
          </View>
        )}

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
    paddingBottom: SPACING.xs,
  },
  pageTitle: {
    color: COLORS.text,
    fontSize: 18,
    fontWeight: '800',
  },
  pageDesc: {
    color: COLORS.textSecondary,
    fontSize: 12,
    marginTop: 2,
  },
  errorBox: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(239, 68, 68, 0.15)',
    marginHorizontal: SPACING.md,
    marginTop: SPACING.sm,
    padding: SPACING.sm,
    borderRadius: RADIUS.md,
    borderWidth: 1,
    borderColor: COLORS.danger,
  },
  errorText: {
    color: '#fca5a5',
    fontSize: 12,
    flex: 1,
  },
  sectionCard: {
    backgroundColor: COLORS.surface,
    marginHorizontal: SPACING.md,
    marginTop: SPACING.sm,
    borderRadius: RADIUS.lg,
    padding: SPACING.md,
    borderWidth: 1,
    borderColor: COLORS.surfaceBorder,
  },
  sectionHeader: {
    color: COLORS.textSecondary,
    fontSize: 12,
    fontWeight: '600',
    marginBottom: SPACING.xs + 2,
    textTransform: 'uppercase',
  },
  chipRow: {
    gap: SPACING.xs + 2,
  },
  chip: {
    backgroundColor: COLORS.inputBg,
    paddingHorizontal: SPACING.sm + 4,
    paddingVertical: 6,
    borderRadius: RADIUS.full,
    borderWidth: 1,
    borderColor: COLORS.surfaceBorder,
  },
  chipActive: {
    backgroundColor: COLORS.primaryGlow,
    borderColor: COLORS.primary,
  },
  chipActiveTeal: {
    backgroundColor: 'rgba(20, 184, 166, 0.15)',
    borderColor: COLORS.secondary,
  },
  chipText: {
    color: COLORS.textSecondary,
    fontSize: 12,
    fontWeight: '500',
  },
  chipTextActive: {
    color: COLORS.primaryLight,
    fontWeight: '700',
  },
  chipTextActiveTeal: {
    color: COLORS.secondaryLight,
    fontWeight: '700',
  },
  slidersContainer: {
    paddingHorizontal: SPACING.md,
    marginTop: SPACING.md,
  },
  sectionHeading: {
    color: COLORS.text,
    fontSize: 14,
    fontWeight: '700',
    marginBottom: SPACING.sm,
  },
  resultsCard: {
    backgroundColor: COLORS.surfaceCard,
    marginHorizontal: SPACING.md,
    marginTop: SPACING.md,
    borderRadius: RADIUS.xl,
    padding: SPACING.md,
    borderWidth: 1,
    borderColor: 'rgba(14, 165, 233, 0.4)',
  },
  resultsHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: SPACING.md,
  },
  resultsTitle: {
    color: COLORS.text,
    fontSize: 16,
    fontWeight: '800',
  },
  resultsSubtitle: {
    color: COLORS.textSecondary,
    fontSize: 12,
    marginTop: 2,
  },
  massBalanceBox: {
    backgroundColor: COLORS.inputBg,
    borderRadius: RADIUS.md,
    padding: SPACING.sm + 2,
    borderWidth: 1,
    borderColor: COLORS.surfaceBorder,
    marginBottom: SPACING.md,
  },
  massBalanceTitle: {
    color: COLORS.textMuted,
    fontSize: 10,
    textTransform: 'uppercase',
    fontWeight: '700',
    marginBottom: 4,
  },
  massBalanceRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  massItem: {
    alignItems: 'center',
  },
  massLabel: {
    color: COLORS.textMuted,
    fontSize: 10,
  },
  massValue: {
    color: COLORS.text,
    fontSize: 13,
    fontWeight: '700',
    marginTop: 1,
  },
  massOp: {
    color: COLORS.textMuted,
    fontSize: 14,
    fontWeight: '700',
  },
  tripletRow: {
    flexDirection: 'row',
    gap: SPACING.sm,
    marginBottom: SPACING.md,
  },
  tripletCard: {
    flex: 1,
    backgroundColor: COLORS.surface,
    padding: SPACING.sm + 2,
    borderRadius: RADIUS.md,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: COLORS.surfaceBorder,
  },
  tripletLabel: {
    color: COLORS.textMuted,
    fontSize: 10,
    fontWeight: '600',
  },
  tripletValue: {
    color: COLORS.primaryLight,
    fontSize: 16,
    fontWeight: '800',
    marginTop: 3,
  },
  analysisBox: {
    flexDirection: 'row',
    backgroundColor: COLORS.primaryGlow,
    padding: SPACING.sm + 4,
    borderRadius: RADIUS.md,
    borderWidth: 1,
    borderColor: 'rgba(14, 165, 233, 0.25)',
  },
  analysisText: {
    color: COLORS.primaryLight,
    fontSize: 11,
    lineHeight: 16,
    flex: 1,
  },
});

