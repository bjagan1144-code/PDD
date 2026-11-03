import React, { useState, useEffect, useRef } from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  StyleSheet,
  SafeAreaView,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { COLORS, RADIUS, SPACING } from '../constants/theme';
import { Header } from '../components/Header';
import { CurveChart } from '../components/CurveChart';
import { Badge } from '../components/Badge';
import { Button } from '../components/Button';

const SAMPLE_PROFILE = {
  drug: 'Fentanyl',
  polymer: 'Chitosan',
  initialLoading: 50.0,
  maxHours: 24,
  curve: [
    { time: 0, predicted: 0.0, target: 0.0 },
    { time: 2, predicted: 7.2, target: 6.5 },
    { time: 4, predicted: 10.4, target: 11.0 },
    { time: 6, predicted: 12.9, target: 14.2 },
    { time: 8, predicted: 15.0, target: 16.8 },
    { time: 10, predicted: 16.8, target: 18.8 },
    { time: 12, predicted: 18.5, target: 20.5 },
    { time: 14, predicted: 19.9, target: 21.3 },
    { time: 16, predicted: 21.1, target: 22.0 },
    { time: 18, predicted: 22.2, target: 22.8 },
    { time: 20, predicted: 23.1, target: 23.5 },
    { time: 22, predicted: 23.9, target: 24.1 },
    { time: 24, predicted: 24.6, target: 24.6 },
  ],
};

export default function ReleaseMonitorScreen() {
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTimeIndex, setCurrentTimeIndex] = useState(0);
  const [speedMultiplier, setSpeedMultiplier] = useState(1);
  const timerRef = useRef(null);

  const steps = SAMPLE_PROFILE.curve;
  const currentStep = steps[currentTimeIndex] || steps[0];

  const currentReleasePct = currentStep.predicted;
  const currentReleasedMg = parseFloat(((currentReleasePct / 100.0) * SAMPLE_PROFILE.initialLoading).toFixed(2));
  const currentRemainingMg = parseFloat((SAMPLE_PROFILE.initialLoading - currentReleasedMg).toFixed(2));

  useEffect(() => {
    if (isPlaying) {
      timerRef.current = setInterval(() => {
        setCurrentTimeIndex((prev) => {
          if (prev >= steps.length - 1) {
            setIsPlaying(false);
            return prev;
          }
          return prev + 1;
        });
      }, 900 / speedMultiplier);
    } else {
      if (timerRef.current) clearInterval(timerRef.current);
    }
    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, [isPlaying, speedMultiplier, steps.length]);

  const handleReset = () => {
    setIsPlaying(false);
    setCurrentTimeIndex(0);
  };

  const visibleCurve = steps.slice(0, currentTimeIndex + 1);

  return (
    <SafeAreaView style={styles.safeArea}>
      <Header title="Release Monitor" showBack={true} subtitle="Franz Cell Diffusion Telemetry" />

      <ScrollView style={styles.scroll} showsVerticalScrollIndicator={false}>
        {/* Telemetry Hero Card */}
        <View style={styles.monitorCard}>
          <View style={styles.cardTopRow}>
            <View>
              <Text style={styles.monitorTitle}>In-Vitro Permeation Telemetry</Text>
              <Text style={styles.monitorSub}>
                {SAMPLE_PROFILE.drug} in {SAMPLE_PROFILE.polymer} (Franz Diffusion Cell)
              </Text>
            </View>
            <Badge label={isPlaying ? 'LIVE STREAM' : 'PAUSED'} variant={isPlaying ? 'success' : 'default'} />
          </View>

          {/* Time & Release Gauges */}
          <View style={styles.gaugeRow}>
            <View style={styles.gaugeBox}>
              <Text style={styles.gaugeLabel}>ELAPSED TIME</Text>
              <Text style={styles.gaugeVal}>{currentStep.time}h</Text>
              <Text style={styles.gaugeSub}>of {SAMPLE_PROFILE.maxHours}h duration</Text>
            </View>

            <View style={[styles.gaugeBox, { borderColor: 'rgba(14, 165, 233, 0.4)' }]}>
              <Text style={styles.gaugeLabel}>CUMULATIVE RELEASE</Text>
              <Text style={[styles.gaugeVal, { color: COLORS.primaryLight }]}>
                {currentReleasePct}%
              </Text>
              <Text style={styles.gaugeSub}>diffusion flux</Text>
            </View>
          </View>

          {/* Mass Conservation Gauges */}
          <View style={styles.massRow}>
            <View style={styles.massBox}>
              <Text style={styles.massLabel}>Delivered Active</Text>
              <Text style={[styles.massVal, { color: COLORS.primaryLight }]}>
                {currentReleasedMg} mg
              </Text>
            </View>
            <View style={styles.massBox}>
              <Text style={styles.massLabel}>Remaining Matrix</Text>
              <Text style={[styles.massVal, { color: COLORS.secondaryLight }]}>
                {currentRemainingMg} mg
              </Text>
            </View>
            <View style={styles.massBox}>
              <Text style={styles.massLabel}>Total Load (M₀)</Text>
              <Text style={styles.massVal}>
                {SAMPLE_PROFILE.initialLoading} mg
              </Text>
            </View>
          </View>

          {/* Progress Bar */}
          <View style={styles.progressTrack}>
            <View
              style={[
                styles.progressBar,
                { width: `${((currentTimeIndex) / (steps.length - 1)) * 100}%` },
              ]}
            />
          </View>

          {/* Playback Controls */}
          <View style={styles.controlsRow}>
            <TouchableOpacity style={styles.ctrlBtn} onPress={handleReset}>
              <Ionicons name="refresh" size={18} color={COLORS.textSecondary} />
            </TouchableOpacity>

            <TouchableOpacity
              style={[styles.playBtn, isPlaying && styles.playBtnActive]}
              onPress={() => setIsPlaying(!isPlaying)}
            >
              <Ionicons
                name={isPlaying ? 'pause' : 'play'}
                size={22}
                color="#ffffff"
              />
            </TouchableOpacity>

            <View style={styles.speedSelector}>
              {[1, 2, 4].map((s) => (
                <TouchableOpacity
                  key={`spd-${s}`}
                  style={[styles.spdBtn, speedMultiplier === s && styles.spdBtnActive]}
                  onPress={() => setSpeedMultiplier(s)}
                >
                  <Text style={[styles.spdText, speedMultiplier === s && styles.spdTextActive]}>
                    {s}x
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
          </View>
        </View>

        {/* Live Dynamic Curve Chart */}
        <View style={{ paddingHorizontal: SPACING.md, marginTop: SPACING.md }}>
          <CurveChart
            data={visibleCurve}
            title={`Real-Time Diffusion Curve (${currentStep.time}h elapsed)`}
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
  monitorCard: {
    backgroundColor: COLORS.surface,
    marginHorizontal: SPACING.md,
    marginTop: SPACING.md,
    borderRadius: RADIUS.xl,
    padding: SPACING.md,
    borderWidth: 1,
    borderColor: COLORS.surfaceBorder,
  },
  cardTopRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: SPACING.md,
  },
  monitorTitle: {
    color: COLORS.text,
    fontSize: 16,
    fontWeight: '800',
  },
  monitorSub: {
    color: COLORS.textSecondary,
    fontSize: 11,
    marginTop: 2,
  },
  gaugeRow: {
    flexDirection: 'row',
    gap: SPACING.sm,
    marginBottom: SPACING.sm,
  },
  gaugeBox: {
    flex: 1,
    backgroundColor: COLORS.surfaceCard,
    padding: SPACING.md,
    borderRadius: RADIUS.lg,
    borderWidth: 1,
    borderColor: COLORS.surfaceBorder,
    alignItems: 'center',
  },
  gaugeLabel: {
    color: COLORS.textMuted,
    fontSize: 10,
    fontWeight: '700',
  },
  gaugeVal: {
    color: COLORS.text,
    fontSize: 28,
    fontWeight: '900',
    marginVertical: 4,
  },
  gaugeSub: {
    color: COLORS.textMuted,
    fontSize: 10,
  },
  massRow: {
    flexDirection: 'row',
    backgroundColor: COLORS.inputBg,
    borderRadius: RADIUS.md,
    padding: SPACING.sm,
    borderWidth: 1,
    borderColor: COLORS.surfaceBorder,
    marginBottom: SPACING.md,
  },
  massBox: {
    flex: 1,
    alignItems: 'center',
  },
  massLabel: {
    color: COLORS.textMuted,
    fontSize: 10,
  },
  massVal: {
    color: COLORS.text,
    fontSize: 13,
    fontWeight: '700',
    marginTop: 2,
  },
  progressTrack: {
    height: 6,
    backgroundColor: COLORS.surfaceBorder,
    borderRadius: 3,
    overflow: 'hidden',
    marginBottom: SPACING.md,
  },
  progressBar: {
    height: '100%',
    backgroundColor: COLORS.primaryLight,
  },
  controlsRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingTop: SPACING.xs,
  },
  ctrlBtn: {
    width: 38,
    height: 38,
    borderRadius: 19,
    backgroundColor: COLORS.surfaceCard,
    borderWidth: 1,
    borderColor: COLORS.surfaceBorder,
    justifyContent: 'center',
    alignItems: 'center',
  },
  playBtn: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: COLORS.primary,
    justifyContent: 'center',
    alignItems: 'center',
  },
  playBtnActive: {
    backgroundColor: COLORS.secondary,
  },
  speedSelector: {
    flexDirection: 'row',
    backgroundColor: COLORS.surfaceCard,
    borderRadius: RADIUS.md,
    borderWidth: 1,
    borderColor: COLORS.surfaceBorder,
    padding: 2,
  },
  spdBtn: {
    paddingHorizontal: 8,
    paddingVertical: 5,
    borderRadius: RADIUS.sm,
  },
  spdBtnActive: {
    backgroundColor: COLORS.primaryGlow,
  },
  spdText: {
    color: COLORS.textMuted,
    fontSize: 11,
    fontWeight: '600',
  },
  spdTextActive: {
    color: COLORS.primaryLight,
    fontWeight: '700',
  },
});

