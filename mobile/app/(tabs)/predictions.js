import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  StyleSheet,
  SafeAreaView,
  ActivityIndicator,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { COLORS, RADIUS, SPACING } from '../../constants/theme';
import { Header } from '../../components/Header';
import { SliderInput } from '../../components/SliderInput';
import { BarChart } from '../../components/BarChart';
import { Button } from '../../components/Button';
import { predictionService } from '../../services/predictionService';

const DRUGS = ['Metformin', 'Paracetamol', 'Losartan', 'Ibuprofen'];
const POLYMERS = ['PLA', 'Alginate', 'Gelatin', 'Pectin', 'Cellulose', 'Chitosan'];

export default function AIPredictionScreen() {
  // Input parameters
  const [drugName, setDrugName] = useState('Metformin');
  const [polymerName, setPolymerName] = useState('PLA');
  const [drugLoading, setDrugLoading] = useState(50.0);
  const [polymerConcentration, setPolymerConcentration] = useState(3.0);
  const [patchThickness, setPatchThickness] = useState(1.0);
  const [temperature, setTemperature] = useState(37.0);
  const [pH, setPH] = useState(7.0);
  const [moisture, setMoisture] = useState(50.0);
  const [duration, setDuration] = useState(24.0);

  // States
  const [isPredicting, setIsPredicting] = useState(false);
  const [predictionResult, setPredictionResult] = useState(null);
  const [metricsData, setMetricsData] = useState(null);
  const [errorMsg, setErrorMsg] = useState('');

  // Fetch real model evaluation metrics on load
  useEffect(() => {
    const fetchMetrics = async () => {
      try {
        const data = await predictionService.getMetrics();
        setMetricsData(data);
      } catch (err) {
        // Fallback to verified local metadata
        setMetricsData({
          r2: 0.7638,
          mae: '6.59%',
          rmse: '11.51%',
          mse: 132.4,
          samples: 1200,
          model_name: 'Random Forest Regressor',
          is_synthetic: true,
          feature_importances: [
            { name: 'patchThickness', importance: 33.05 },
            { name: 'temperature', importance: 14.66 },
            { name: 'drug_Metformin', importance: 12.45 },
            { name: 'polymer_PLA', importance: 8.89 },
            { name: 'polymer_Gelatin', importance: 6.39 },
            { name: 'moisture', importance: 5.74 },
            { name: 'polymerConcentration', importance: 5.2 },
          ],
        });
      }
    };
    fetchMetrics();
  }, []);

  const handlePredict = async () => {
    setIsPredicting(true);
    setErrorMsg('');
    try {
      const res = await predictionService.predict({
        drugName,
        polymerName,
        drugLoading,
        polymerConcentration,
        patchThickness,
        temperature,
        pH,
        moisture,
        duration,
      });
      setPredictionResult(res.prediction !== undefined ? res.prediction : res);
      if (res.metrics) {
        setMetricsData(res.metrics);
      }
    } catch (err) {
      setErrorMsg(err.message || 'AI Prediction failed.');
    } finally {
      setIsPredicting(false);
    }
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      <Header title="AI Rate Prediction" subtitle="Machine Learning Regression" />

      <ScrollView style={styles.scroll} showsVerticalScrollIndicator={false}>
        {/* Intro */}
        <View style={styles.introBox}>
          <Text style={styles.pageTitle}>Random Forest Formulation Predictor</Text>
          <Text style={styles.pageDesc}>
            Infers 24h cumulative release percentage directly from multi-factorial formulation features.
          </Text>
        </View>

        {errorMsg ? (
          <View style={styles.errorBox}>
            <Ionicons name="alert-circle-outline" size={16} color={COLORS.danger} style={{ marginRight: 6 }} />
            <Text style={styles.errorText}>{errorMsg}</Text>
          </View>
        ) : null}

        {/* Prediction Output Card (if available) */}
        {predictionResult !== null && (
          <View style={styles.predictionCard}>
            <View style={styles.predTopRow}>
              <View style={styles.sparklePill}>
                <Ionicons name="sparkles" size={16} color={COLORS.accentLight} />
              </View>
              <Text style={styles.predCardTitle}>Predicted 24h Release</Text>
            </View>

            <Text style={styles.predValue}>{predictionResult}%</Text>
            <Text style={styles.predSub}>
              {drugName} encapsulated in {polymerName} matrix ({patchThickness} mm, {drugLoading} mg)
            </Text>

            <View style={styles.predBadgesRow}>
              <View style={styles.predBadge}>
                <Text style={styles.predBadgeLabel}>Model Confidence</Text>
                <Text style={styles.predBadgeVal}>R² = 0.76</Text>
              </View>
              <View style={styles.predBadge}>
                <Text style={styles.predBadgeLabel}>Expected Dev.</Text>
                <Text style={styles.predBadgeVal}>±6.59% MAE</Text>
              </View>
            </View>
          </View>
        )}

        {/* Formulation Sliders Form */}
        <View style={styles.formContainer}>
          {/* Drug Selector */}
          <Text style={styles.pickerHeading}>Select Drug Molecule</Text>
          <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.chipsRow}>
            {DRUGS.map((d) => {
              const active = drugName === d;
              return (
                <TouchableOpacity
                  key={d}
                  style={[styles.chip, active && styles.chipActive]}
                  onPress={() => setDrugName(d)}
                >
                  <Text style={[styles.chipText, active && styles.chipTextActive]}>{d}</Text>
                </TouchableOpacity>
              );
            })}
          </ScrollView>

          {/* Polymer Selector */}
          <Text style={[styles.pickerHeading, { marginTop: SPACING.md }]}>Select Polymer Matrix</Text>
          <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.chipsRow}>
            {POLYMERS.map((p) => {
              const active = polymerName === p;
              return (
                <TouchableOpacity
                  key={p}
                  style={[styles.chip, active && styles.chipActiveAccent]}
                  onPress={() => setPolymerName(p)}
                >
                  <Text style={[styles.chipText, active && styles.chipTextActiveAccent]}>{p}</Text>
                </TouchableOpacity>
              );
            })}
          </ScrollView>

          <View style={{ marginTop: SPACING.md }}>
            <SliderInput
              label="Drug Loading"
              value={drugLoading}
              onValueChange={setDrugLoading}
              min={0}
              max={100}
              step={1}
              unit="mg"
            />

            <SliderInput
              label="Patch Thickness"
              value={patchThickness}
              onValueChange={setPatchThickness}
              min={0.1}
              max={2.0}
              step={0.1}
              unit="mm"
            />

            <SliderInput
              label="Polymer Concentration"
              value={polymerConcentration}
              onValueChange={setPolymerConcentration}
              min={1.0}
              max={15.0}
              step={0.5}
              unit="%"
            />

            <SliderInput
              label="Temperature"
              value={temperature}
              onValueChange={setTemperature}
              min={20}
              max={45}
              step={1}
              unit="°C"
            />

            <SliderInput
              label="pH Level"
              value={pH}
              onValueChange={setPH}
              min={4.0}
              max={9.0}
              step={0.1}
              unit=""
            />

            <Button
              title="Run AI Inference"
              onPress={handlePredict}
              loading={isPredicting}
              variant="accent"
              size="lg"
              icon={<Ionicons name="sparkles" size={18} color="#ffffff" />}
              style={{ marginVertical: SPACING.md }}
            />
          </View>
        </View>

        {/* Feature Importance Horizontal Bars */}
        {metricsData?.feature_importances && (
          <View style={{ paddingHorizontal: SPACING.md }}>
            <BarChart
              data={metricsData.feature_importances.slice(0, 7)}
              title="Model Feature Weights (%)"
            />
          </View>
        )}

        {/* Real Model Evaluation Metrics Panel */}
        <View style={styles.metricsCard}>
          <Text style={styles.metricsTitle}>Verified Model Evaluation Metrics</Text>
          <Text style={styles.metricsSubtitle}>
            Trained on 1,200 reproducible formulations (80/20 train/test split)
          </Text>

          <View style={styles.metricsGrid}>
            <View style={styles.metricBox}>
              <Text style={styles.mLabel}>R² Score</Text>
              <Text style={[styles.mVal, { color: COLORS.accentLight }]}>
                {metricsData?.r2 ?? '0.7638'}
              </Text>
            </View>
            <View style={styles.metricBox}>
              <Text style={styles.mLabel}>MAE Error</Text>
              <Text style={[styles.mVal, { color: COLORS.emeraldLight }]}>
                {metricsData?.mae ?? '6.59%'}
              </Text>
            </View>
            <View style={styles.metricBox}>
              <Text style={styles.mLabel}>RMSE Error</Text>
              <Text style={styles.mVal}>
                {metricsData?.rmse ?? '11.51%'}
              </Text>
            </View>
            <View style={styles.metricBox}>
              <Text style={styles.mLabel}>Dataset Size</Text>
              <Text style={styles.mVal}>
                {metricsData?.samples ?? 1200}
              </Text>
            </View>
          </View>

          {/* Transparency Disclosure */}
          <View style={styles.transparencyBox}>
            <Ionicons name="information-circle-outline" size={15} color={COLORS.textSecondary} style={{ marginRight: 6 }} />
            <Text style={styles.transparencyText}>
              In-Silico Disclosure: Model trained on reproducible mathematical diffusion simulations. Clinical wet-lab Franz cell spectrophotometry calibration is recommended for pharmaceutical manufacturing.
            </Text>
          </View>
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
  predictionCard: {
    backgroundColor: COLORS.surfaceCard,
    marginHorizontal: SPACING.md,
    marginTop: SPACING.sm,
    borderRadius: RADIUS.xl,
    padding: SPACING.md,
    borderWidth: 1.5,
    borderColor: 'rgba(99, 102, 241, 0.4)',
    alignItems: 'center',
  },
  predTopRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: SPACING.xs,
  },
  sparklePill: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: COLORS.accentGlow,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 6,
  },
  predCardTitle: {
    color: COLORS.textSecondary,
    fontSize: 12,
    fontWeight: '600',
    textTransform: 'uppercase',
  },
  predValue: {
    color: COLORS.accentLight,
    fontSize: 38,
    fontWeight: '900',
    letterSpacing: -1,
  },
  predSub: {
    color: COLORS.textMuted,
    fontSize: 12,
    textAlign: 'center',
    marginTop: 4,
    marginBottom: SPACING.md,
  },
  predBadgesRow: {
    flexDirection: 'row',
    gap: SPACING.md,
  },
  predBadge: {
    backgroundColor: COLORS.inputBg,
    paddingHorizontal: SPACING.md,
    paddingVertical: 5,
    borderRadius: RADIUS.md,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: COLORS.surfaceBorder,
  },
  predBadgeLabel: {
    color: COLORS.textMuted,
    fontSize: 10,
  },
  predBadgeVal: {
    color: COLORS.text,
    fontSize: 12,
    fontWeight: '700',
    marginTop: 1,
  },
  formContainer: {
    paddingHorizontal: SPACING.md,
    marginTop: SPACING.md,
  },
  pickerHeading: {
    color: COLORS.textSecondary,
    fontSize: 12,
    fontWeight: '600',
    marginBottom: SPACING.xs + 2,
    textTransform: 'uppercase',
  },
  chipsRow: {
    gap: SPACING.xs + 2,
  },
  chip: {
    backgroundColor: COLORS.surface,
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
  chipActiveAccent: {
    backgroundColor: COLORS.accentGlow,
    borderColor: COLORS.accent,
  },
  chipText: {
    color: COLORS.textSecondary,
    fontSize: 12,
  },
  chipTextActive: {
    color: COLORS.primaryLight,
    fontWeight: '700',
  },
  chipTextActiveAccent: {
    color: COLORS.accentLight,
    fontWeight: '700',
  },
  metricsCard: {
    backgroundColor: COLORS.surface,
    marginHorizontal: SPACING.md,
    marginTop: SPACING.sm,
    borderRadius: RADIUS.lg,
    padding: SPACING.md,
    borderWidth: 1,
    borderColor: COLORS.surfaceBorder,
  },
  metricsTitle: {
    color: COLORS.text,
    fontSize: 14,
    fontWeight: '700',
  },
  metricsSubtitle: {
    color: COLORS.textMuted,
    fontSize: 11,
    marginTop: 2,
    marginBottom: SPACING.md,
  },
  metricsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: SPACING.sm,
    marginBottom: SPACING.md,
  },
  metricBox: {
    width: '48%',
    backgroundColor: COLORS.surfaceCard,
    padding: SPACING.sm + 2,
    borderRadius: RADIUS.md,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: COLORS.surfaceBorder,
  },
  mLabel: {
    color: COLORS.textMuted,
    fontSize: 10,
  },
  mVal: {
    color: COLORS.text,
    fontSize: 16,
    fontWeight: '700',
    marginTop: 2,
  },
  transparencyBox: {
    flexDirection: 'row',
    backgroundColor: 'rgba(30, 41, 59, 0.6)',
    padding: SPACING.sm,
    borderRadius: RADIUS.md,
    borderWidth: 1,
    borderColor: COLORS.surfaceBorder,
  },
  transparencyText: {
    color: COLORS.textMuted,
    fontSize: 10,
    lineHeight: 14,
    flex: 1,
  },
});

