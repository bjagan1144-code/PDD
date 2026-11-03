import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  ScrollView,
  TextInput,
  TouchableOpacity,
  RefreshControl,
  StyleSheet,
  SafeAreaView,
  ActivityIndicator,
  Alert,
} from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { COLORS, RADIUS, SPACING } from '../../constants/theme';
import { Header } from '../../components/Header';
import { Badge } from '../../components/Badge';
import { Button } from '../../components/Button';
import { simulationService } from '../../services/simulationService';
import { reportService } from '../../services/reportService';

const RISK_FILTERS = ['All', 'Low', 'Medium', 'High'];

export default function HistoryScreen() {
  const router = useRouter();
  const [history, setHistory] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedRisk, setSelectedRisk] = useState('All');

  const fetchHistory = useCallback(async () => {
    try {
      const data = await simulationService.getHistory();
      setHistory(data);
    } catch (_) {
      // Fallback display
      setHistory([
        {
          id: 'sim-fentanyl-01',
          drug_id: 'Fentanyl',
          polymer_id: 'Chitosan',
          drugName: 'Fentanyl',
          polymerName: 'Chitosan',
          predicted_release: 24.6,
          predictedRelease: 24.6,
          drug_loading: 50.0,
          patch_thickness: 0.5,
          simulation_risk_indicator: 'Low',
          date: '2026-11-02 18:30',
        },
        {
          id: 'sim-nicotine-02',
          drug_id: 'Nicotine',
          polymer_id: 'PVA',
          drugName: 'Nicotine',
          polymerName: 'PVA',
          predicted_release: 16.9,
          predictedRelease: 16.9,
          drug_loading: 20.0,
          patch_thickness: 0.4,
          simulation_risk_indicator: 'Low',
          date: '2026-11-02 17:15',
        },
        {
          id: 'sim-lidocaine-03',
          drug_id: 'Lidocaine',
          polymer_id: 'PLA',
          drugName: 'Lidocaine',
          polymerName: 'PLA',
          predicted_release: 12.8,
          predictedRelease: 12.8,
          drug_loading: 40.0,
          patch_thickness: 0.8,
          simulation_risk_indicator: 'High',
          date: '2026-11-01 14:00',
        },
      ]);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => {
    fetchHistory();
  }, [fetchHistory]);

  const onRefresh = async () => {
    setRefreshing(true);
    await fetchHistory();
  };

  const handleRerun = async (sim) => {
    try {
      await simulationService.rerun(sim.id);
      Alert.alert('Simulation Re-Executed', `Successfully re-simulated ${sim.drugName || sim.drug_id}.`);
      await fetchHistory();
    } catch (err) {
      Alert.alert('Re-run', err.message || 'Failed to re-run simulation.');
    }
  };

  const handleGenerateReport = async (simId) => {
    try {
      await reportService.generateReport(simId);
      Alert.alert('Report Saved', 'Research report generated and saved to Reports archive.', [
        { text: 'View Reports', onPress: () => router.push('/reports') },
        { text: 'OK', style: 'cancel' },
      ]);
    } catch (err) {
      Alert.alert('Report Generation', err.message || 'Failed to compile report.');
    }
  };

  const filteredHistory = history.filter((sim) => {
    const drug = (sim.drugName || sim.drug_id || '').toLowerCase();
    const polymer = (sim.polymerName || sim.polymer_id || '').toLowerCase();
    const q = searchQuery.toLowerCase();
    const matchesSearch = drug.includes(q) || polymer.includes(q);

    const risk = sim.riskLevel || sim.simulation_risk_indicator || 'Low';
    const matchesRisk = selectedRisk === 'All' || risk.toLowerCase() === selectedRisk.toLowerCase();

    return matchesSearch && matchesRisk;
  });

  return (
    <SafeAreaView style={styles.safeArea}>
      <Header title="Simulation History" subtitle="Formulation Archives" />

      <ScrollView
        style={styles.scroll}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            tintColor={COLORS.primaryLight}
            colors={[COLORS.primary]}
          />
        }
        showsVerticalScrollIndicator={false}
      >
        {/* Search Bar */}
        <View style={styles.searchBar}>
          <Ionicons name="search-outline" size={18} color={COLORS.textMuted} style={{ marginRight: 6 }} />
          <TextInput
            placeholder="Search past formulations..."
            placeholderTextColor={COLORS.textMuted}
            value={searchQuery}
            onChangeText={setSearchQuery}
            style={styles.searchInput}
          />
        </View>

        {/* Risk Filter Pills */}
        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.filtersScroll}>
          {RISK_FILTERS.map((rf) => {
            const active = selectedRisk === rf;
            return (
              <TouchableOpacity
                key={rf}
                style={[styles.filterPill, active && styles.filterPillActive]}
                onPress={() => setSelectedRisk(rf)}
              >
                <Text style={[styles.filterText, active && styles.filterTextActive]}>
                  {rf === 'All' ? 'All Risks' : `${rf} Risk`}
                </Text>
              </TouchableOpacity>
            );
          })}
        </ScrollView>

        {loading ? (
          <ActivityIndicator size="large" color={COLORS.primaryLight} style={{ marginVertical: 40 }} />
        ) : filteredHistory.length === 0 ? (
          <View style={styles.emptyBox}>
            <Ionicons name="file-tray-outline" size={44} color={COLORS.textMuted} />
            <Text style={styles.emptyTitle}>No matching simulations found</Text>
            <Text style={styles.emptyDesc}>Run a new formulation test in the Simulator to log history.</Text>
            <Button
              title="Launch Simulator"
              onPress={() => router.push('/(tabs)/simulator')}
              size="sm"
              style={{ marginTop: SPACING.md }}
            />
          </View>
        ) : (
          <View style={styles.cardsList}>
            {filteredHistory.map((sim, idx) => {
              const drug = sim.drugName || sim.drug_id || 'Active Drug';
              const polymer = sim.polymerName || sim.polymer_id || 'Matrix';
              const release = sim.predictedRelease !== undefined ? sim.predictedRelease : sim.predicted_release || 0;
              const loadingMg = sim.drugLoading !== undefined ? sim.drugLoading : sim.drug_loading || 50;
              const thickness = sim.patchThickness !== undefined ? sim.patchThickness : sim.patch_thickness || 0.5;
              const risk = sim.riskLevel || sim.simulation_risk_indicator || 'Low';
              const date = sim.date || sim.created_at || 'Recent';

              return (
                <View key={`hist-${idx}-${sim.id || idx}`} style={styles.card}>
                  <View style={styles.cardHeader}>
                    <View style={{ flex: 1 }}>
                      <Text style={styles.drugTitle}>{drug}</Text>
                      <Text style={styles.polymerSub}>{polymer} Matrix</Text>
                    </View>
                    <Badge label={risk} variant={risk} size="sm" />
                  </View>

                  {/* Quick specs */}
                  <View style={styles.specRow}>
                    <View style={styles.specItem}>
                      <Text style={styles.specLabel}>Loading</Text>
                      <Text style={styles.specVal}>{loadingMg} mg</Text>
                    </View>
                    <View style={styles.specItem}>
                      <Text style={styles.specLabel}>Thickness</Text>
                      <Text style={styles.specVal}>{thickness} mm</Text>
                    </View>
                    <View style={styles.specItem}>
                      <Text style={styles.specLabel}>24h Release</Text>
                      <Text style={[styles.specVal, { color: COLORS.primaryLight }]}>{release}%</Text>
                    </View>
                  </View>

                  <View style={styles.footerRow}>
                    <Text style={styles.dateText}>Logged: {date}</Text>
                    <View style={styles.actionsGroup}>
                      <TouchableOpacity
                        style={styles.actionBtn}
                        onPress={() => handleGenerateReport(sim.id)}
                      >
                        <Ionicons name="document-text-outline" size={14} color={COLORS.textSecondary} />
                        <Text style={styles.actionBtnText}>Report</Text>
                      </TouchableOpacity>
                      <TouchableOpacity
                        style={[styles.actionBtn, styles.actionBtnPrimary]}
                        onPress={() => handleRerun(sim)}
                      >
                        <Ionicons name="repeat" size={14} color={COLORS.primaryLight} />
                        <Text style={[styles.actionBtnText, { color: COLORS.primaryLight }]}>Re-run</Text>
                      </TouchableOpacity>
                    </View>
                  </View>
                </View>
              );
            })}
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
  searchBar: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.surface,
    marginHorizontal: SPACING.md,
    marginTop: SPACING.md,
    borderRadius: RADIUS.md,
    borderWidth: 1,
    borderColor: COLORS.surfaceBorder,
    paddingHorizontal: SPACING.sm + 2,
    height: 42,
  },
  searchInput: {
    flex: 1,
    color: COLORS.text,
    fontSize: 13,
  },
  filtersScroll: {
    paddingHorizontal: SPACING.md,
    paddingVertical: SPACING.sm + 2,
    gap: SPACING.xs + 2,
  },
  filterPill: {
    backgroundColor: COLORS.surface,
    paddingHorizontal: SPACING.sm + 4,
    paddingVertical: 6,
    borderRadius: RADIUS.full,
    borderWidth: 1,
    borderColor: COLORS.surfaceBorder,
  },
  filterPillActive: {
    backgroundColor: COLORS.primaryGlow,
    borderColor: COLORS.primary,
  },
  filterText: {
    color: COLORS.textMuted,
    fontSize: 11,
    fontWeight: '600',
  },
  filterTextActive: {
    color: COLORS.primaryLight,
  },
  cardsList: {
    paddingHorizontal: SPACING.md,
  },
  card: {
    backgroundColor: COLORS.surface,
    borderRadius: RADIUS.lg,
    padding: SPACING.md,
    borderWidth: 1,
    borderColor: COLORS.surfaceBorder,
    marginBottom: SPACING.sm + 2,
  },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: SPACING.sm,
  },
  drugTitle: {
    color: COLORS.text,
    fontSize: 15,
    fontWeight: '700',
  },
  polymerSub: {
    color: COLORS.textSecondary,
    fontSize: 12,
    marginTop: 1,
  },
  specRow: {
    flexDirection: 'row',
    backgroundColor: COLORS.surfaceCard,
    borderRadius: RADIUS.md,
    padding: SPACING.sm,
    borderWidth: 1,
    borderColor: COLORS.surfaceBorder,
    marginBottom: SPACING.sm,
  },
  specItem: {
    flex: 1,
    alignItems: 'center',
  },
  specLabel: {
    color: COLORS.textMuted,
    fontSize: 10,
    textTransform: 'uppercase',
  },
  specVal: {
    color: COLORS.text,
    fontSize: 13,
    fontWeight: '700',
    marginTop: 1,
  },
  footerRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingTop: SPACING.xs,
  },
  dateText: {
    color: COLORS.textMuted,
    fontSize: 10,
  },
  actionsGroup: {
    flexDirection: 'row',
    gap: SPACING.xs + 2,
  },
  actionBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.surfaceCard,
    paddingHorizontal: SPACING.sm,
    paddingVertical: 5,
    borderRadius: RADIUS.sm,
    borderWidth: 1,
    borderColor: COLORS.surfaceBorder,
    gap: 4,
  },
  actionBtnPrimary: {
    borderColor: 'rgba(14, 165, 233, 0.4)',
    backgroundColor: COLORS.primaryGlow,
  },
  actionBtnText: {
    color: COLORS.textSecondary,
    fontSize: 11,
    fontWeight: '600',
  },
  emptyBox: {
    alignItems: 'center',
    padding: SPACING.xl,
    marginTop: SPACING.lg,
  },
  emptyTitle: {
    color: COLORS.text,
    fontSize: 15,
    fontWeight: '700',
    marginTop: SPACING.sm,
  },
  emptyDesc: {
    color: COLORS.textMuted,
    fontSize: 12,
    textAlign: 'center',
    marginTop: 4,
  },
});

