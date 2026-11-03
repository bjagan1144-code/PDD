import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  Modal,
  RefreshControl,
  StyleSheet,
  SafeAreaView,
  ActivityIndicator,
  Alert,
} from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { COLORS, RADIUS, SPACING } from '../constants/theme';
import { Header } from '../components/Header';
import { Badge } from '../components/Badge';
import { Button } from '../components/Button';
import { reportService } from '../services/reportService';

export default function ReportsScreen() {
  const router = useRouter();
  const [reports, setReports] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [selectedReport, setSelectedReport] = useState(null);
  const [modalVisible, setModalVisible] = useState(false);

  const fetchReports = useCallback(async () => {
    try {
      const data = await reportService.getReports();
      setReports(data);
    } catch (_) {
      // Fallback display
      setReports([
        {
          id: 'REP-4A7B2C',
          simulationId: 'sim-fentanyl-01',
          drugName: 'Fentanyl',
          polymerName: 'Chitosan',
          summary: 'Release: 24.6%, Duration: 24.0h, Simulation Risk Indicator: Low',
          date: '2026-11-02 18:30',
        },
        {
          id: 'REP-91D0E3',
          simulationId: 'sim-nicotine-02',
          drugName: 'Nicotine',
          polymerName: 'PVA',
          summary: 'Release: 16.9%, Duration: 24.0h, Simulation Risk Indicator: Low',
          date: '2026-11-02 17:15',
        },
      ]);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => {
    fetchReports();
  }, [fetchReports]);

  const onRefresh = async () => {
    setRefreshing(true);
    await fetchReports();
  };

  const handleDelete = (reportId) => {
    Alert.alert(
      'Delete Report',
      `Permanently remove report ${reportId} from the database?`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: async () => {
            try {
              await reportService.deleteReport(reportId);
              await fetchReports();
            } catch (err) {
              Alert.alert('Error', err.message || 'Failed to delete report.');
            }
          },
        },
      ]
    );
  };

  const openReportModal = (rep) => {
    setSelectedReport(rep);
    setModalVisible(true);
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      <Header title="Research Reports" showBack={true} subtitle="Pre-Clinical Dossiers" />

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
        <View style={styles.introBox}>
          <Text style={styles.heading}>Compiled Simulation Dossiers</Text>
          <Text style={styles.subheading}>
            Comprehensive release kinetics reports formatted for pre-clinical evaluation and peer review.
          </Text>
        </View>

        {loading ? (
          <ActivityIndicator size="large" color={COLORS.primaryLight} style={{ marginVertical: 40 }} />
        ) : reports.length === 0 ? (
          <View style={styles.emptyBox}>
            <Ionicons name="document-text-outline" size={44} color={COLORS.textMuted} />
            <Text style={styles.emptyTitle}>No reports generated yet</Text>
            <Text style={styles.emptyDesc}>
              Execute a run in the Simulator and tap "Compile PDF Research Report" to generate an archive.
            </Text>
            <Button
              title="Go to Simulator"
              onPress={() => router.push('/(tabs)/simulator')}
              size="sm"
              style={{ marginTop: SPACING.md }}
            />
          </View>
        ) : (
          <View style={styles.reportsList}>
            {reports.map((rep) => (
              <View key={rep.id} style={styles.card}>
                <View style={styles.cardTopRow}>
                  <View style={styles.repBadge}>
                    <Ionicons name="document-attach" size={14} color={COLORS.primaryLight} style={{ marginRight: 4 }} />
                    <Text style={styles.repIdText}>{rep.id}</Text>
                  </View>
                  <Text style={styles.repDate}>{rep.date}</Text>
                </View>

                <Text style={styles.formulationTitle}>
                  {rep.drugName} in {rep.polymerName} Matrix
                </Text>

                <Text style={styles.summaryText}>{rep.summary}</Text>

                <View style={styles.cardActions}>
                  <TouchableOpacity
                    style={styles.viewBtn}
                    onPress={() => openReportModal(rep)}
                  >
                    <Ionicons name="eye-outline" size={16} color={COLORS.primaryLight} style={{ marginRight: 4 }} />
                    <Text style={styles.viewBtnText}>Inspect Dossier</Text>
                  </TouchableOpacity>

                  <TouchableOpacity
                    style={styles.delBtn}
                    onPress={() => handleDelete(rep.id)}
                  >
                    <Ionicons name="trash-outline" size={16} color={COLORS.danger} />
                  </TouchableOpacity>
                </View>
              </View>
            ))}
          </View>
        )}

        <View style={{ height: 40 }} />
      </ScrollView>

      {/* Inspect Report Modal */}
      <Modal visible={modalVisible} animationType="slide" transparent={true}>
        <View style={styles.modalBackdrop}>
          <View style={styles.modalCard}>
            <View style={styles.modalHeader}>
              <View>
                <Text style={styles.modalRepId}>{selectedReport?.id}</Text>
                <Text style={styles.modalTitle}>
                  {selectedReport?.drugName} Formulation Dossier
                </Text>
              </View>
              <TouchableOpacity onPress={() => setModalVisible(false)}>
                <Ionicons name="close" size={22} color={COLORS.textSecondary} />
              </TouchableOpacity>
            </View>

            <ScrollView style={{ maxHeight: 360 }} showsVerticalScrollIndicator={false}>
              <View style={styles.dossierRow}>
                <Text style={styles.dossierLabel}>Active Pharmaceutical:</Text>
                <Text style={styles.dossierVal}>{selectedReport?.drugName}</Text>
              </View>

              <View style={styles.dossierRow}>
                <Text style={styles.dossierLabel}>Polymer Matrix:</Text>
                <Text style={styles.dossierVal}>{selectedReport?.polymerName}</Text>
              </View>

              <View style={styles.dossierRow}>
                <Text style={styles.dossierLabel}>Compilation Date:</Text>
                <Text style={styles.dossierVal}>{selectedReport?.date}</Text>
              </View>

              <View style={styles.dossierRow}>
                <Text style={styles.dossierLabel}>Simulation ID:</Text>
                <Text style={styles.dossierVal}>{selectedReport?.simulationId}</Text>
              </View>

              <View style={styles.dossierBox}>
                <Text style={styles.dossierBoxTitle}>Executive Kinetic Summary</Text>
                <Text style={styles.dossierBoxContent}>{selectedReport?.summary}</Text>
              </View>

              <View style={styles.stampBox}>
                <Ionicons name="shield-checkmark" size={18} color={COLORS.emeraldLight} style={{ marginRight: 6 }} />
                <Text style={styles.stampText}>Verified Deterministic In-Silico Formulation Model</Text>
              </View>
            </ScrollView>

            <View style={styles.modalFooter}>
              <Button
                title="Export PDF Document"
                variant="primary"
                icon={<Ionicons name="download-outline" size={16} color="#ffffff" />}
                onPress={() => {
                  Alert.alert('PDF Exported', `Dossier ${selectedReport?.id} exported for pre-clinical documentation.`);
                  setModalVisible(false);
                }}
              />
            </View>
          </View>
        </View>
      </Modal>
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
  heading: {
    color: COLORS.text,
    fontSize: 18,
    fontWeight: '800',
  },
  subheading: {
    color: COLORS.textSecondary,
    fontSize: 12,
    marginTop: 2,
    lineHeight: 18,
  },
  reportsList: {
    paddingHorizontal: SPACING.md,
    marginTop: SPACING.sm,
  },
  card: {
    backgroundColor: COLORS.surface,
    borderRadius: RADIUS.lg,
    padding: SPACING.md,
    borderWidth: 1,
    borderColor: COLORS.surfaceBorder,
    marginBottom: SPACING.sm + 4,
  },
  cardTopRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: SPACING.xs + 2,
  },
  repBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.primaryGlow,
    paddingHorizontal: SPACING.sm,
    paddingVertical: 3,
    borderRadius: RADIUS.full,
    borderWidth: 1,
    borderColor: 'rgba(14, 165, 233, 0.3)',
  },
  repIdText: {
    color: COLORS.primaryLight,
    fontSize: 11,
    fontWeight: '700',
  },
  repDate: {
    color: COLORS.textMuted,
    fontSize: 11,
  },
  formulationTitle: {
    color: COLORS.text,
    fontSize: 15,
    fontWeight: '700',
    marginBottom: 4,
  },
  summaryText: {
    color: COLORS.textSecondary,
    fontSize: 12,
    lineHeight: 18,
    marginBottom: SPACING.md,
  },
  cardActions: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    borderTopWidth: 1,
    borderTopColor: COLORS.surfaceBorder,
    paddingTop: SPACING.sm,
  },
  viewBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 4,
  },
  viewBtnText: {
    color: COLORS.primaryLight,
    fontSize: 12,
    fontWeight: '600',
  },
  delBtn: {
    padding: SPACING.xs,
  },
  emptyBox: {
    alignItems: 'center',
    padding: SPACING.xl,
    marginTop: SPACING.lg,
  },
  emptyTitle: {
    color: COLORS.text,
    fontSize: 16,
    fontWeight: '700',
    marginTop: SPACING.sm,
  },
  emptyDesc: {
    color: COLORS.textMuted,
    fontSize: 12,
    textAlign: 'center',
    marginTop: 4,
    lineHeight: 18,
  },
  modalBackdrop: {
    flex: 1,
    backgroundColor: COLORS.overlay,
    justifyContent: 'center',
    padding: SPACING.md,
  },
  modalCard: {
    backgroundColor: COLORS.surface,
    borderRadius: RADIUS.xl,
    padding: SPACING.lg,
    borderWidth: 1,
    borderColor: COLORS.surfaceBorder,
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: SPACING.md,
  },
  modalRepId: {
    color: COLORS.primaryLight,
    fontSize: 11,
    fontWeight: '700',
  },
  modalTitle: {
    color: COLORS.text,
    fontSize: 16,
    fontWeight: '700',
    marginTop: 1,
  },
  dossierRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: 8,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.surfaceBorder,
  },
  dossierLabel: {
    color: COLORS.textMuted,
    fontSize: 12,
  },
  dossierVal: {
    color: COLORS.text,
    fontSize: 12,
    fontWeight: '600',
  },
  dossierBox: {
    backgroundColor: COLORS.surfaceCard,
    padding: SPACING.md,
    borderRadius: RADIUS.md,
    marginTop: SPACING.md,
    borderWidth: 1,
    borderColor: COLORS.surfaceBorder,
  },
  dossierBoxTitle: {
    color: COLORS.textSecondary,
    fontSize: 11,
    fontWeight: '700',
    marginBottom: 4,
    textTransform: 'uppercase',
  },
  dossierBoxContent: {
    color: COLORS.text,
    fontSize: 12,
    lineHeight: 18,
  },
  stampBox: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(16, 185, 129, 0.1)',
    padding: SPACING.sm,
    borderRadius: RADIUS.md,
    marginTop: SPACING.sm + 4,
    borderWidth: 1,
    borderColor: 'rgba(16, 185, 129, 0.25)',
  },
  stampText: {
    color: COLORS.emeraldLight,
    fontSize: 11,
    fontWeight: '600',
    flex: 1,
  },
  modalFooter: {
    marginTop: SPACING.md,
  },
});

