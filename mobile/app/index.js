import React from 'react';
import {
  View,
  Text,
  ScrollView,
  Image,
  StyleSheet,
  SafeAreaView,
  TouchableOpacity,
} from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { COLORS, RADIUS, SPACING } from '../constants/theme';
import { Header } from '../components/Header';
import { Button } from '../components/Button';
import { useAuth } from '../context/AuthContext';

export default function HomeScreen() {
  const router = useRouter();
  const { isAuthenticated } = useAuth();

  return (
    <SafeAreaView style={styles.safeArea}>
      <Header title="BioPatch AI" subtitle="Transdermal Drug Delivery Platform" />

      <ScrollView style={styles.scroll} showsVerticalScrollIndicator={false}>
        {/* Hero Section */}
        <View style={styles.heroSection}>
          <View style={styles.badgeRow}>
            <View style={styles.pillBadge}>
              <Ionicons name="sparkles" size={13} color={COLORS.primaryLight} style={{ marginRight: 4 }} />
              <Text style={styles.pillText}>Next-Gen Transdermal Modeling</Text>
            </View>
          </View>

          <Text style={styles.heroTitle}>
            In-Silico Patch Kinetics & <Text style={styles.gradientText}>AI Prediction</Text>
          </Text>

          <Text style={styles.heroSubtitle}>
            Accelerate pre-clinical transdermal formulation R&D with biophysical diffusion modeling and machine learning regression.
          </Text>

          {/* Hero Graphic Card */}
          <View style={styles.heroImageCard}>
            <Image
              source={require('../assets/hero.png')}
              style={styles.heroImage}
              resizeMode="cover"
            />
            <View style={styles.heroOverlayBadge}>
              <Ionicons name="shield-checkmark" size={14} color={COLORS.emeraldLight} style={{ marginRight: 4 }} />
              <Text style={styles.heroOverlayText}>Fickian Monotonicity Enforced</Text>
            </View>
          </View>

          {/* Call to Actions */}
          <View style={styles.actionRow}>
            <Button
              title={isAuthenticated ? 'Open Simulator' : 'Researcher Workspace'}
              onPress={() => router.push(isAuthenticated ? '/(tabs)/simulator' : '/login')}
              variant="primary"
              size="lg"
              icon={<Ionicons name="flask-outline" size={18} color="#ffffff" />}
              style={styles.primaryAction}
            />
            <Button
              title="Explore Demo"
              onPress={() => router.push('/explore')}
              variant="outline"
              size="lg"
              icon={<Ionicons name="compass-outline" size={18} color={COLORS.primaryLight} />}
              style={styles.secondaryAction}
            />
          </View>
        </View>

        {/* Feature Highlights Grid */}
        <View style={styles.featuresSection}>
          <Text style={styles.sectionHeading}>Scientific Modeling Capabilities</Text>

          {/* Card 1 */}
          <View style={styles.featureCard}>
            <View style={[styles.iconBox, { backgroundColor: COLORS.primaryGlow }]}>
              <Ionicons name="calculator-outline" size={22} color={COLORS.primaryLight} />
            </View>
            <Text style={styles.featureTitle}>Biophysical Kinetics</Text>
            <Text style={styles.featureDesc}>
              Modified Higuchi & Korsmeyer-Peppas matrix diffusion with mass balance conservation and non-decreasing cumulative delivery.
            </Text>
          </View>

          {/* Card 2 */}
          <View style={styles.featureCard}>
            <View style={[styles.iconBox, { backgroundColor: COLORS.accentGlow }]}>
              <Ionicons name="git-branch-outline" size={22} color={COLORS.accentLight} />
            </View>
            <Text style={styles.featureTitle}>Machine Learning Engine</Text>
            <Text style={styles.featureDesc}>
              Trained Random Forest regressor with verified R² = 0.7638, transparent in-silico dataset disclosure, and dynamic feature weights.
            </Text>
          </View>

          {/* Card 3 */}
          <View style={styles.featureCard}>
            <View style={[styles.iconBox, { backgroundColor: 'rgba(20, 184, 166, 0.12)' }]}>
              <Ionicons name="layers-outline" size={22} color={COLORS.secondaryLight} />
            </View>
            <Text style={styles.featureTitle}>Formulation Libraries</Text>
            <Text style={styles.featureDesc}>
              Curated databases of transdermal drugs (solubility, MW, half-life) and biodegradable polymers (swelling, degradation rates).
            </Text>
          </View>
        </View>

        {/* Demonstration Access Card */}
        <View style={styles.demoBanner}>
          <View style={styles.demoBannerIcon}>
            <Ionicons name="finger-print-outline" size={24} color={COLORS.primaryLight} />
          </View>
          <View style={{ flex: 1, marginRight: SPACING.sm }}>
            <Text style={styles.demoBannerTitle}>Final-Year Project Demonstration</Text>
            <Text style={styles.demoBannerSubtitle}>
              Seeded researcher access with preloaded formulations and test data.
            </Text>
          </View>
          <TouchableOpacity
            style={styles.demoBannerBtn}
            onPress={() => router.push('/login')}
          >
            <Text style={styles.demoBannerBtnText}>Sign In</Text>
          </TouchableOpacity>
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
  heroSection: {
    paddingHorizontal: SPACING.md,
    paddingTop: SPACING.lg,
  },
  badgeRow: {
    flexDirection: 'row',
    marginBottom: SPACING.sm,
  },
  pillBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.primaryGlow,
    paddingHorizontal: SPACING.sm + 2,
    paddingVertical: 4,
    borderRadius: RADIUS.full,
    borderWidth: 1,
    borderColor: 'rgba(14, 165, 233, 0.3)',
  },
  pillText: {
    color: COLORS.primaryLight,
    fontSize: 11,
    fontWeight: '600',
  },
  heroTitle: {
    color: COLORS.text,
    fontSize: 26,
    fontWeight: '800',
    lineHeight: 34,
    marginBottom: SPACING.sm,
    letterSpacing: -0.5,
  },
  gradientText: {
    color: COLORS.primaryLight,
  },
  heroSubtitle: {
    color: COLORS.textSecondary,
    fontSize: 13,
    lineHeight: 20,
    marginBottom: SPACING.lg,
  },
  heroImageCard: {
    height: 180,
    borderRadius: RADIUS.lg,
    overflow: 'hidden',
    backgroundColor: COLORS.surface,
    borderWidth: 1,
    borderColor: COLORS.surfaceBorder,
    marginBottom: SPACING.lg,
    position: 'relative',
  },
  heroImage: {
    width: '100%',
    height: '100%',
  },
  heroOverlayBadge: {
    position: 'absolute',
    bottom: SPACING.sm,
    left: SPACING.sm,
    backgroundColor: 'rgba(11, 15, 25, 0.85)',
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: SPACING.sm,
    paddingVertical: 4,
    borderRadius: RADIUS.md,
    borderWidth: 1,
    borderColor: 'rgba(16, 185, 129, 0.4)',
  },
  heroOverlayText: {
    color: COLORS.emeraldLight,
    fontSize: 10,
    fontWeight: '600',
  },
  actionRow: {
    flexDirection: 'row',
    gap: SPACING.sm,
    marginBottom: SPACING.xl,
  },
  primaryAction: {
    flex: 1.2,
  },
  secondaryAction: {
    flex: 1,
  },
  featuresSection: {
    paddingHorizontal: SPACING.md,
    marginBottom: SPACING.lg,
  },
  sectionHeading: {
    color: COLORS.text,
    fontSize: 17,
    fontWeight: '700',
    marginBottom: SPACING.md,
  },
  featureCard: {
    backgroundColor: COLORS.surface,
    borderRadius: RADIUS.lg,
    padding: SPACING.md,
    borderWidth: 1,
    borderColor: COLORS.surfaceBorder,
    marginBottom: SPACING.md,
  },
  iconBox: {
    width: 42,
    height: 42,
    borderRadius: RADIUS.md,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: SPACING.sm,
  },
  featureTitle: {
    color: COLORS.text,
    fontSize: 15,
    fontWeight: '600',
    marginBottom: 4,
  },
  featureDesc: {
    color: COLORS.textSecondary,
    fontSize: 12,
    lineHeight: 18,
  },
  demoBanner: {
    marginHorizontal: SPACING.md,
    backgroundColor: COLORS.surfaceCard,
    borderRadius: RADIUS.lg,
    borderWidth: 1,
    borderColor: 'rgba(14, 165, 233, 0.3)',
    padding: SPACING.md,
    flexDirection: 'row',
    alignItems: 'center',
  },
  demoBannerIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: COLORS.primaryGlow,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: SPACING.md,
  },
  demoBannerTitle: {
    color: COLORS.text,
    fontSize: 13,
    fontWeight: '600',
  },
  demoBannerSubtitle: {
    color: COLORS.textMuted,
    fontSize: 11,
    marginTop: 2,
  },
  demoBannerBtn: {
    backgroundColor: COLORS.primary,
    paddingHorizontal: SPACING.md,
    paddingVertical: 7,
    borderRadius: RADIUS.md,
  },
  demoBannerBtnText: {
    color: '#ffffff',
    fontSize: 12,
    fontWeight: '600',
  },
});

