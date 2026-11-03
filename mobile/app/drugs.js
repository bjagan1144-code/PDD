import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  ScrollView,
  TextInput,
  TouchableOpacity,
  Modal,
  StyleSheet,
  SafeAreaView,
  ActivityIndicator,
  Alert,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { COLORS, RADIUS, SPACING } from '../constants/theme';
import { Header } from '../components/Header';
import { Badge } from '../components/Badge';
import { Button } from '../components/Button';
import { Input } from '../components/Input';
import { libraryService } from '../services/libraryService';

export default function DrugLibraryScreen() {
  const [drugs, setDrugs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [modalVisible, setModalVisible] = useState(false);

  // Add Drug Form state
  const [newName, setNewName] = useState('');
  const [newSolubility, setNewSolubility] = useState('');
  const [newMW, setNewMW] = useState('');
  const [newCategory, setNewCategory] = useState('');
  const [newHalfLife, setNewHalfLife] = useState('');
  const [newDesc, setNewDesc] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const fetchDrugs = useCallback(async () => {
    try {
      const data = await libraryService.getDrugs();
      setDrugs(data);
    } catch (_) {
      // Fallback preloaded list
      setDrugs([
        { id: 'Metformin', name: 'Metformin', solubility: 200.0, molecularWeight: 129.16, category: 'Antidiabetic', halfLife: '6.2 hours', status: 'Completed', description: 'Highly water-soluble biguanide anti-diabetic drug.' },
        { id: 'Paracetamol', name: 'Paracetamol', solubility: 14.0, molecularWeight: 151.16, category: 'Analgesic', halfLife: '2.5 hours', status: 'Completed', description: 'Widely used analgesic and antipyretic drug.' },
        { id: 'Losartan', name: 'Losartan', solubility: 3.3, molecularWeight: 422.9, category: 'Antihypertensive', halfLife: '2.0 hours', status: 'Completed', description: 'Angiotensin II receptor antagonist, hydrophobic with moderate MW.' },
        { id: 'Ibuprofen', name: 'Ibuprofen', solubility: 0.021, molecularWeight: 206.29, category: 'NSAID', halfLife: '2.0 hours', status: 'Completed', description: 'NSAID anti-inflammatory with very low aqueous solubility.' },
      ]);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchDrugs();
  }, [fetchDrugs]);

  const handleAddDrug = async () => {
    if (!newName.trim()) {
      Alert.alert('Required Field', 'Please enter a drug name.');
      return;
    }
    setSubmitting(true);
    try {
      await libraryService.addDrug({
        name: newName.trim(),
        solubility: parseFloat(newSolubility) || 10.0,
        molecularWeight: parseFloat(newMW) || 200.0,
        category: newCategory.trim() || 'Therapeutic Active',
        halfLife: newHalfLife.trim() || '4.0 hours',
        description: newDesc.trim() || 'Transdermal therapeutic drug candidate.',
        status: 'Completed',
      });
      setModalVisible(false);
      setNewName('');
      setNewSolubility('');
      setNewMW('');
      setNewCategory('');
      setNewHalfLife('');
      setNewDesc('');
      await fetchDrugs();
    } catch (err) {
      Alert.alert('Add Drug Error', err.message || 'Failed to save drug to catalog.');
    } finally {
      setSubmitting(false);
    }
  };

  const filteredDrugs = drugs.filter((d) =>
    (d.name || '').toLowerCase().includes(searchQuery.toLowerCase()) ||
    (d.category || '').toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <SafeAreaView style={styles.safeArea}>
      <Header title="Drug Library" showBack={true} subtitle="Pharmacological Catalog" />

      <ScrollView style={styles.scroll} showsVerticalScrollIndicator={false}>
        {/* Top Controls */}
        <View style={styles.topBar}>
          <View style={styles.searchBox}>
            <Ionicons name="search-outline" size={18} color={COLORS.textMuted} style={{ marginRight: 6 }} />
            <TextInput
              placeholder="Search active drugs by name or class..."
              placeholderTextColor={COLORS.textMuted}
              value={searchQuery}
              onChangeText={setSearchQuery}
              style={styles.searchInput}
            />
          </View>
          <Button
            title="Add Drug"
            onPress={() => setModalVisible(true)}
            size="sm"
            icon={<Ionicons name="add" size={16} color="#ffffff" />}
          />
        </View>

        {loading ? (
          <ActivityIndicator size="large" color={COLORS.primaryLight} style={{ marginVertical: 40 }} />
        ) : (
          <View style={styles.listContainer}>
            {filteredDrugs.map((drug) => {
              const mw = drug.molecularWeight || drug.molecular_weight || 'N/A';
              const sol = drug.solubility !== undefined ? `${drug.solubility} mg/mL` : 'N/A';
              const hl = drug.halfLife || drug.half_life || 'N/A';

              return (
                <View key={drug.id || drug.name} style={styles.card}>
                  <View style={styles.cardHeader}>
                    <View style={styles.iconCircle}>
                      <Ionicons name="flask-outline" size={18} color={COLORS.primaryLight} />
                    </View>
                    <View style={{ flex: 1 }}>
                      <Text style={styles.drugName}>{drug.name}</Text>
                      <Text style={styles.drugCat}>{drug.category || 'Therapeutic Active'}</Text>
                    </View>
                    <Badge label={drug.status || 'Active'} variant="success" size="sm" />
                  </View>

                  {/* Properties Grid */}
                  <View style={styles.propsRow}>
                    <View style={styles.propItem}>
                      <Text style={styles.propLabel}>Solubility</Text>
                      <Text style={styles.propVal}>{sol}</Text>
                    </View>
                    <View style={styles.propItem}>
                      <Text style={styles.propLabel}>Mol. Weight</Text>
                      <Text style={styles.propVal}>{mw} Da</Text>
                    </View>
                    <View style={styles.propItem}>
                      <Text style={styles.propLabel}>Half-Life</Text>
                      <Text style={styles.propVal}>{hl}</Text>
                    </View>
                  </View>

                  {drug.description ? (
                    <Text style={styles.descText} numberOfLines={2}>
                      {drug.description}
                    </Text>
                  ) : null}
                </View>
              );
            })}
          </View>
        )}

        <View style={{ height: 40 }} />
      </ScrollView>

      {/* Add Drug Modal */}
      <Modal visible={modalVisible} animationType="slide" transparent={true}>
        <View style={styles.modalBackdrop}>
          <View style={styles.modalCard}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Register Drug Candidate</Text>
              <TouchableOpacity onPress={() => setModalVisible(false)}>
                <Ionicons name="close" size={22} color={COLORS.textSecondary} />
              </TouchableOpacity>
            </View>

            <ScrollView style={{ maxHeight: 420 }} showsVerticalScrollIndicator={false}>
              <Input label="Drug Name" placeholder="e.g. Diclofenac" value={newName} onChangeText={setNewName} />
              <Input label="Water Solubility (mg/mL)" placeholder="e.g. 2.5" value={newSolubility} onChangeText={setNewSolubility} keyboardType="numeric" />
              <Input label="Molecular Weight (Da)" placeholder="e.g. 296.1" value={newMW} onChangeText={setNewMW} keyboardType="numeric" />
              <Input label="Therapeutic Category" placeholder="e.g. NSAID" value={newCategory} onChangeText={setNewCategory} />
              <Input label="Elimination Half-Life" placeholder="e.g. 2.0 hours" value={newHalfLife} onChangeText={setNewHalfLife} />
              <Input label="Description / Clinical Notes" placeholder="Clinical pharmacokinetic profile..." value={newDesc} onChangeText={setNewDesc} multiline={true} numberOfLines={3} />
            </ScrollView>

            <View style={styles.modalActions}>
              <Button title="Cancel" variant="ghost" onPress={() => setModalVisible(false)} style={{ flex: 1 }} />
              <Button title="Save to Database" variant="primary" loading={submitting} onPress={handleAddDrug} style={{ flex: 1.5 }} />
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
  topBar: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: SPACING.md,
    paddingTop: SPACING.md,
    gap: SPACING.sm,
  },
  searchBox: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.surface,
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
  listContainer: {
    paddingHorizontal: SPACING.md,
    marginTop: SPACING.md,
  },
  card: {
    backgroundColor: COLORS.surface,
    borderRadius: RADIUS.lg,
    padding: SPACING.md,
    borderWidth: 1,
    borderColor: COLORS.surfaceBorder,
    marginBottom: SPACING.sm + 4,
  },
  cardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: SPACING.sm,
  },
  iconCircle: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: COLORS.primaryGlow,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: SPACING.sm,
  },
  drugName: {
    color: COLORS.text,
    fontSize: 15,
    fontWeight: '700',
  },
  drugCat: {
    color: COLORS.textMuted,
    fontSize: 11,
    marginTop: 1,
  },
  propsRow: {
    flexDirection: 'row',
    backgroundColor: COLORS.surfaceCard,
    borderRadius: RADIUS.md,
    padding: SPACING.sm,
    borderWidth: 1,
    borderColor: COLORS.surfaceBorder,
    marginBottom: SPACING.sm,
  },
  propItem: {
    flex: 1,
    alignItems: 'center',
  },
  propLabel: {
    color: COLORS.textMuted,
    fontSize: 10,
    textTransform: 'uppercase',
  },
  propVal: {
    color: COLORS.primaryLight,
    fontSize: 12,
    fontWeight: '700',
    marginTop: 2,
  },
  descText: {
    color: COLORS.textSecondary,
    fontSize: 11,
    lineHeight: 16,
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
  modalTitle: {
    color: COLORS.text,
    fontSize: 17,
    fontWeight: '700',
  },
  modalActions: {
    flexDirection: 'row',
    gap: SPACING.sm,
    marginTop: SPACING.md,
  },
});

