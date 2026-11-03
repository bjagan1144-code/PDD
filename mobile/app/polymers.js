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

export default function PolymerLibraryScreen() {
  const [polymers, setPolymers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [modalVisible, setModalVisible] = useState(false);

  // Add Polymer Form state
  const [newName, setNewName] = useState('');
  const [newType, setNewType] = useState('Hydrogel');
  const [newSwelling, setNewSwelling] = useState('250%');
  const [newDegradation, setNewDegradation] = useState('30-60 days');
  const [newConcentration, setNewConcentration] = useState('2.0% - 5.0%');
  const [newBehavior, setNewBehavior] = useState('Sustained matrix erosion');
  const [newDesc, setNewDesc] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const fetchPolymers = useCallback(async () => {
    try {
      const data = await libraryService.getPolymers();
      setPolymers(data);
    } catch (_) {
      // Fallback preloaded list
      setPolymers([
        { id: 'PLA', name: 'PLA', type: 'Erodible', biodegradable: true, swellingRatio: '< 10%', degradationRate: '1-2 years', concentrationRange: '2.0% - 15.0%', releaseBehavior: 'Hydrophobic bulk erosion (slow diffusion)', description: 'Polylactic acid is a biodegradable, hydrophobic thermoplastic aliphatic polyester.' },
        { id: 'Alginate', name: 'Alginate', type: 'Hydrogel', biodegradable: true, swellingRatio: '350%', degradationRate: '30-60 days', concentrationRange: '1.0% - 4.0%', releaseBehavior: 'Swellable cross-linked hydrogel matrix', description: 'Natural anionic polysaccharide hydrogel for sustained diffusion.' },
        { id: 'Gelatin', name: 'Gelatin', type: 'Swellable Matrix', biodegradable: true, swellingRatio: '400%', degradationRate: '7-14 days', concentrationRange: '2.0% - 10.0%', releaseBehavior: 'Thermal-sensitive rapid dissolution matrix', description: 'Swellable protein matrix obtained from collagen hydrolysate.' },
        { id: 'Pectin', name: 'Pectin', type: 'Swellable Matrix', biodegradable: true, swellingRatio: '250%', degradationRate: '21-45 days', concentrationRange: '1.5% - 5.0%', releaseBehavior: 'pH-responsive matrix swelling & erosion', description: 'Structural heteropolysaccharide polymer, moderately swellable.' },
        { id: 'Cellulose', name: 'Cellulose', type: 'Inert Matrix', biodegradable: true, swellingRatio: '15%', degradationRate: '6-12 months', concentrationRange: '1.0% - 5.0%', releaseBehavior: 'Inert biocompatible non-swelling barrier', description: 'Inert structural polysaccharide, biocompatible with low swelling indexes.' },
        { id: 'Chitosan', name: 'Chitosan', type: 'Hydrogel', biodegradable: true, swellingRatio: '300%', degradationRate: '14-30 days', concentrationRange: '1.0% - 5.0%', releaseBehavior: 'Cationic acid-swelling sustained diffusion', description: 'Cationic biopolymer matrix swellable in acidic pH media.' },
      ]);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchPolymers();
  }, [fetchPolymers]);

  const handleAddPolymer = async () => {
    if (!newName.trim()) {
      Alert.alert('Required Field', 'Please enter a polymer matrix name.');
      return;
    }
    setSubmitting(true);
    try {
      await libraryService.addPolymer({
        name: newName.trim(),
        type: newType.trim() || 'Hydrogel',
        swellingRatio: newSwelling.trim() || '200%',
        degradationRate: newDegradation.trim() || '30 days',
        concentrationRange: newConcentration.trim() || '2.0% - 5.0%',
        releaseBehavior: newBehavior.trim() || 'Diffusion controlled matrix',
        description: newDesc.trim() || 'Biocompatible polymer carrier matrix.',
        biodegradable: true,
      });
      setModalVisible(false);
      setNewName('');
      setNewDesc('');
      await fetchPolymers();
    } catch (err) {
      Alert.alert('Add Polymer Error', err.message || 'Failed to save polymer.');
    } finally {
      setSubmitting(false);
    }
  };

  const filtered = polymers.filter((p) =>
    (p.name || '').toLowerCase().includes(searchQuery.toLowerCase()) ||
    (p.type || '').toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <SafeAreaView style={styles.safeArea}>
      <Header title="Polymer Library" showBack={true} subtitle="Biopolymer Matrix Catalog" />

      <ScrollView style={styles.scroll} showsVerticalScrollIndicator={false}>
        {/* Top Controls */}
        <View style={styles.topBar}>
          <View style={styles.searchBox}>
            <Ionicons name="search-outline" size={18} color={COLORS.textMuted} style={{ marginRight: 6 }} />
            <TextInput
              placeholder="Search polymer matrices..."
              placeholderTextColor={COLORS.textMuted}
              value={searchQuery}
              onChangeText={setSearchQuery}
              style={styles.searchInput}
            />
          </View>
          <Button
            title="Add Matrix"
            onPress={() => setModalVisible(true)}
            size="sm"
            variant="secondary"
            icon={<Ionicons name="add" size={16} color="#ffffff" />}
          />
        </View>

        {loading ? (
          <ActivityIndicator size="large" color={COLORS.secondaryLight} style={{ marginVertical: 40 }} />
        ) : (
          <View style={styles.listContainer}>
            {filtered.map((poly) => {
              const swelling = poly.swellingRatio || poly.swelling_ratio || 'N/A';
              const deg = poly.degradationRate || poly.degradation_rate || 'N/A';
              const conc = poly.concentrationRange || poly.concentration_range || 'N/A';

              return (
                <View key={poly.id || poly.name} style={styles.card}>
                  <View style={styles.cardHeader}>
                    <View style={styles.iconCircle}>
                      <Ionicons name="layers-outline" size={18} color={COLORS.secondaryLight} />
                    </View>
                    <View style={{ flex: 1 }}>
                      <Text style={styles.polyName}>{poly.name}</Text>
                      <Text style={styles.polyType}>{poly.type || 'Polymer Matrix'}</Text>
                    </View>
                    <Badge label="Biodegradable" variant="success" size="sm" />
                  </View>

                  {/* Properties Grid */}
                  <View style={styles.propsRow}>
                    <View style={styles.propItem}>
                      <Text style={styles.propLabel}>Swelling</Text>
                      <Text style={styles.propVal}>{swelling}</Text>
                    </View>
                    <View style={styles.propItem}>
                      <Text style={styles.propLabel}>Degradation</Text>
                      <Text style={styles.propVal}>{deg}</Text>
                    </View>
                    <View style={styles.propItem}>
                      <Text style={styles.propLabel}>Usual Conc.</Text>
                      <Text style={styles.propVal}>{conc}</Text>
                    </View>
                  </View>

                  {poly.releaseBehavior ? (
                    <View style={styles.behaviorBox}>
                      <Ionicons name="pulse" size={14} color={COLORS.secondaryLight} style={{ marginRight: 4 }} />
                      <Text style={styles.behaviorText}>{poly.releaseBehavior}</Text>
                    </View>
                  ) : null}

                  {poly.description ? (
                    <Text style={styles.descText} numberOfLines={2}>
                      {poly.description}
                    </Text>
                  ) : null}
                </View>
              );
            })}
          </View>
        )}

        <View style={{ height: 40 }} />
      </ScrollView>

      {/* Add Polymer Modal */}
      <Modal visible={modalVisible} animationType="slide" transparent={true}>
        <View style={styles.modalBackdrop}>
          <View style={styles.modalCard}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Register Biopolymer Matrix</Text>
              <TouchableOpacity onPress={() => setModalVisible(false)}>
                <Ionicons name="close" size={22} color={COLORS.textSecondary} />
              </TouchableOpacity>
            </View>

            <ScrollView style={{ maxHeight: 420 }} showsVerticalScrollIndicator={false}>
              <Input label="Polymer Name" placeholder="e.g. Polycaprolactone (PCL)" value={newName} onChangeText={setNewName} />
              <Input label="Matrix Type" placeholder="e.g. Hydrogel / Erodible / Swellable" value={newType} onChangeText={setNewType} />
              <Input label="Swelling Ratio" placeholder="e.g. 250%" value={newSwelling} onChangeText={setNewSwelling} />
              <Input label="Degradation Rate" placeholder="e.g. 1-2 years" value={newDegradation} onChangeText={setNewDegradation} />
              <Input label="Typical Concentration Range" placeholder="e.g. 2.0% - 8.0%" value={newConcentration} onChangeText={setNewConcentration} />
              <Input label="Release Kinetics Behavior" placeholder="e.g. Slow surface erosion diffusion" value={newBehavior} onChangeText={setNewBehavior} />
              <Input label="Description" placeholder="Biocompatibility notes..." value={newDesc} onChangeText={setNewDesc} multiline={true} numberOfLines={3} />
            </ScrollView>

            <View style={styles.modalActions}>
              <Button title="Cancel" variant="ghost" onPress={() => setModalVisible(false)} style={{ flex: 1 }} />
              <Button title="Save Matrix" variant="secondary" loading={submitting} onPress={handleAddPolymer} style={{ flex: 1.5 }} />
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
    backgroundColor: 'rgba(20, 184, 166, 0.12)',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: SPACING.sm,
  },
  polyName: {
    color: COLORS.text,
    fontSize: 15,
    fontWeight: '700',
  },
  polyType: {
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
    color: COLORS.secondaryLight,
    fontSize: 12,
    fontWeight: '700',
    marginTop: 2,
  },
  behaviorBox: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(20, 184, 166, 0.1)',
    paddingHorizontal: SPACING.sm,
    paddingVertical: 4,
    borderRadius: RADIUS.sm,
    marginBottom: 6,
  },
  behaviorText: {
    color: COLORS.secondaryLight,
    fontSize: 11,
    fontWeight: '500',
    flex: 1,
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

