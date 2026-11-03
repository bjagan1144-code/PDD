import React from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  StyleSheet,
  SafeAreaView,
  Alert,
} from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { COLORS, RADIUS, SPACING } from '../constants/theme';
import { Header } from '../components/Header';
import { Badge } from '../components/Badge';
import { Button } from '../components/Button';
import { useAuth } from '../context/AuthContext';
import { useConfig } from '../context/ConfigContext';

export default function ProfileScreen() {
  const router = useRouter();
  const { user, logout, refreshUser, isLoading } = useAuth();
  const { baseUrl, isConnected, backendData } = useConfig();

  const handleLogout = async () => {
    Alert.alert(
      'Sign Out',
      'Are you sure you want to terminate your research session?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Sign Out',
          style: 'destructive',
          onPress: async () => {
            await logout();
            router.replace('/login');
          },
        },
      ]
    );
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      <Header title="Researcher Profile" showBack={true} subtitle="Account & Credentials" />

      <ScrollView style={styles.scroll} showsVerticalScrollIndicator={false}>
        {/* Profile Card */}
        <View style={styles.avatarCard}>
          <View style={styles.avatarCircle}>
            <Text style={styles.avatarInitials}>
              {(user?.full_name || user?.email || 'U')[0].toUpperCase()}
            </Text>
          </View>
          <Text style={styles.profileName}>{user?.full_name || 'Biomedical Researcher'}</Text>
          <Text style={styles.profileRole}>{user?.role || 'Principal Investigator'}</Text>
          <View style={styles.statusBadgeRow}>
            <Badge label="Active Session" variant="success" size="sm" />
            <Badge label={backendData?.storage_mode || 'Mock Firestore'} variant="cyan" size="sm" />
          </View>
        </View>

        {/* Credentials Details */}
        <View style={styles.detailsCard}>
          <Text style={styles.cardHeader}>Account Information</Text>

          <View style={styles.infoRow}>
            <View style={styles.infoIconBox}>
              <Ionicons name="mail-outline" size={18} color={COLORS.primaryLight} />
            </View>
            <View style={{ flex: 1 }}>
              <Text style={styles.infoLabel}>Research Email</Text>
              <Text style={styles.infoValue}>{user?.email || 'researcher@biopatch.ai'}</Text>
            </View>
          </View>

          <View style={styles.infoRow}>
            <View style={styles.infoIconBox}>
              <Ionicons name="briefcase-outline" size={18} color={COLORS.secondaryLight} />
            </View>
            <View style={{ flex: 1 }}>
              <Text style={styles.infoLabel}>Institutional Role</Text>
              <Text style={styles.infoValue}>{user?.role || 'Principal Investigator'}</Text>
            </View>
          </View>

          <View style={styles.infoRow}>
            <View style={styles.infoIconBox}>
              <Ionicons name="key-outline" size={18} color={COLORS.accentLight} />
            </View>
            <View style={{ flex: 1 }}>
              <Text style={styles.infoLabel}>Authentication Mechanism</Text>
              <Text style={styles.infoValue}>JWT Token with Bcrypt Passwords</Text>
            </View>
          </View>

          <View style={[styles.infoRow, { borderBottomWidth: 0 }]}>
            <View style={styles.infoIconBox}>
              <Ionicons name="server-outline" size={18} color={COLORS.emeraldLight} />
            </View>
            <View style={{ flex: 1 }}>
              <Text style={styles.infoLabel}>Backend Endpoint</Text>
              <Text style={styles.infoValue} numberOfLines={1}>{baseUrl}</Text>
            </View>
          </View>
        </View>

        {/* Quick Actions */}
        <View style={styles.actionsCard}>
          <TouchableOpacity
            style={styles.actionRow}
            onPress={() => router.push('/settings')}
          >
            <Ionicons name="wifi-outline" size={20} color={COLORS.primaryLight} style={{ marginRight: SPACING.sm }} />
            <Text style={styles.actionRowText}>Configure Host & API Endpoint</Text>
            <Ionicons name="chevron-forward" size={18} color={COLORS.textMuted} />
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.actionRow, { borderBottomWidth: 0 }]}
            onPress={refreshUser}
          >
            <Ionicons name="refresh-outline" size={20} color={COLORS.secondaryLight} style={{ marginRight: SPACING.sm }} />
            <Text style={styles.actionRowText}>Refresh Session Data</Text>
            <Ionicons name="chevron-forward" size={18} color={COLORS.textMuted} />
          </TouchableOpacity>
        </View>

        {/* Logout Button */}
        <Button
          title="Sign Out Session"
          variant="danger"
          size="lg"
          icon={<Ionicons name="log-out-outline" size={18} color="#f87171" />}
          onPress={handleLogout}
          style={styles.logoutBtn}
        />

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
  avatarCard: {
    alignItems: 'center',
    backgroundColor: COLORS.surface,
    marginHorizontal: SPACING.md,
    marginTop: SPACING.md,
    borderRadius: RADIUS.xl,
    padding: SPACING.lg,
    borderWidth: 1,
    borderColor: COLORS.surfaceBorder,
  },
  avatarCircle: {
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: COLORS.accent,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: SPACING.sm,
    shadowColor: COLORS.accent,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 4,
  },
  avatarInitials: {
    color: '#ffffff',
    fontSize: 24,
    fontWeight: '800',
  },
  profileName: {
    color: COLORS.text,
    fontSize: 18,
    fontWeight: '800',
  },
  profileRole: {
    color: COLORS.primaryLight,
    fontSize: 13,
    fontWeight: '600',
    marginTop: 2,
    marginBottom: SPACING.sm,
  },
  statusBadgeRow: {
    flexDirection: 'row',
    gap: SPACING.xs + 2,
  },
  detailsCard: {
    backgroundColor: COLORS.surface,
    marginHorizontal: SPACING.md,
    marginTop: SPACING.md,
    borderRadius: RADIUS.lg,
    padding: SPACING.md,
    borderWidth: 1,
    borderColor: COLORS.surfaceBorder,
  },
  cardHeader: {
    color: COLORS.textSecondary,
    fontSize: 12,
    fontWeight: '700',
    textTransform: 'uppercase',
    marginBottom: SPACING.sm,
  },
  infoRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: SPACING.sm + 2,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.surfaceBorder,
  },
  infoIconBox: {
    width: 34,
    height: 34,
    borderRadius: RADIUS.md,
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: SPACING.sm + 2,
  },
  infoLabel: {
    color: COLORS.textMuted,
    fontSize: 10,
    textTransform: 'uppercase',
    fontWeight: '600',
  },
  infoValue: {
    color: COLORS.text,
    fontSize: 13,
    fontWeight: '600',
    marginTop: 1,
  },
  actionsCard: {
    backgroundColor: COLORS.surface,
    marginHorizontal: SPACING.md,
    marginTop: SPACING.md,
    borderRadius: RADIUS.lg,
    borderWidth: 1,
    borderColor: COLORS.surfaceBorder,
    overflow: 'hidden',
  },
  actionRow: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: SPACING.md,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.surfaceBorder,
  },
  actionRowText: {
    color: COLORS.text,
    fontSize: 13,
    fontWeight: '600',
    flex: 1,
  },
  logoutBtn: {
    marginHorizontal: SPACING.md,
    marginTop: SPACING.lg,
  },
});

