import React from 'react';
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
import { COLORS, RADIUS, SPACING } from '../../constants/theme';
import { Header } from '../../components/Header';
import { useAuth } from '../../context/AuthContext';
import { useConfig } from '../../context/ConfigContext';

export default function MoreScreen() {
  const router = useRouter();
  const { user, logout } = useAuth();
  const { isConnected, baseUrl } = useConfig();

  const menuSections = [
    {
      title: 'Formulation Libraries & Telemetry',
      items: [
        { label: 'Drug Library', desc: 'Active pharmaceutical ingredients catalog', icon: 'medkit-outline', route: '/drugs', color: COLORS.primaryLight },
        { label: 'Polymer Matrix Catalog', desc: 'Biopolymer properties, swelling & degradation', icon: 'layers-outline', route: '/polymers', color: COLORS.secondaryLight },
        { label: 'Release Monitor', desc: 'Real-time Franz cell diffusion telemetry playback', icon: 'pulse-outline', route: '/monitor', color: COLORS.accentLight },
      ],
    },
    {
      title: 'Documentation & Intelligence',
      items: [
        { label: 'Research Reports', desc: 'Compiled pre-clinical simulation summaries', icon: 'document-text-outline', route: '/reports', color: '#fbbf24' },
        { label: 'Explore Kinetics', desc: 'Public biophysical benchmark curves', icon: 'compass-outline', route: '/explore', color: COLORS.emeraldLight },
      ],
    },
    {
      title: 'System & Profile',
      items: [
        { label: 'Researcher Profile', desc: user?.email || 'Manage institutional credentials', icon: 'person-outline', route: '/profile', color: COLORS.textSecondary },
        { label: 'Network Settings', desc: isConnected ? 'API Live (10.0.2.2:8000)' : 'Configure Host Connection', icon: 'settings-outline', route: '/settings', color: isConnected ? COLORS.emerald : COLORS.danger },
      ],
    },
  ];

  return (
    <SafeAreaView style={styles.safeArea}>
      <Header title="More Tools" subtitle="Navigation & System Hub" />

      <ScrollView style={styles.scroll} showsVerticalScrollIndicator={false}>
        {/* User Card */}
        <View style={styles.userCard}>
          <View style={styles.avatar}>
            <Text style={styles.avatarText}>
              {(user?.full_name || user?.email || 'R')[0].toUpperCase()}
            </Text>
          </View>
          <View style={{ flex: 1 }}>
            <Text style={styles.userName}>{user?.full_name || 'Biomedical Researcher'}</Text>
            <Text style={styles.userRole}>{user?.role || 'Principal Investigator'}</Text>
            <Text style={styles.userEmail}>{user?.email || 'researcher@biopatch.ai'}</Text>
          </View>
          <TouchableOpacity onPress={() => router.push('/profile')} style={styles.profileBtn}>
            <Ionicons name="chevron-forward" size={18} color={COLORS.textSecondary} />
          </TouchableOpacity>
        </View>

        {/* Menu Sections */}
        {menuSections.map((sec, sIdx) => (
          <View key={`sec-${sIdx}`} style={styles.section}>
            <Text style={styles.sectionTitle}>{sec.title}</Text>
            <View style={styles.sectionCard}>
              {sec.items.map((item, iIdx) => (
                <TouchableOpacity
                  key={`item-${iIdx}-${item.route}`}
                  style={[
                    styles.menuRow,
                    iIdx < sec.items.length - 1 && styles.menuRowBorder,
                  ]}
                  onPress={() => router.push(item.route)}
                >
                  <View style={[styles.iconBox, { backgroundColor: 'rgba(255,255,255,0.05)' }]}>
                    <Ionicons name={item.icon} size={20} color={item.color} />
                  </View>
                  <View style={{ flex: 1 }}>
                    <Text style={styles.menuLabel}>{item.label}</Text>
                    <Text style={styles.menuDesc}>{item.desc}</Text>
                  </View>
                  <Ionicons name="chevron-forward" size={16} color={COLORS.textMuted} />
                </TouchableOpacity>
              ))}
            </View>
          </View>
        ))}

        {/* Logout Button */}
        <TouchableOpacity style={styles.logoutBtn} onPress={logout}>
          <Ionicons name="log-out-outline" size={18} color={COLORS.danger} style={{ marginRight: 6 }} />
          <Text style={styles.logoutText}>Terminate Research Session</Text>
        </TouchableOpacity>

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
  userCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.surface,
    marginHorizontal: SPACING.md,
    marginTop: SPACING.md,
    borderRadius: RADIUS.lg,
    padding: SPACING.md,
    borderWidth: 1,
    borderColor: COLORS.surfaceBorder,
  },
  avatar: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: COLORS.accent,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: SPACING.sm + 2,
  },
  avatarText: {
    color: '#ffffff',
    fontSize: 16,
    fontWeight: '800',
  },
  userName: {
    color: COLORS.text,
    fontSize: 15,
    fontWeight: '700',
  },
  userRole: {
    color: COLORS.primaryLight,
    fontSize: 12,
    fontWeight: '600',
    marginTop: 1,
  },
  userEmail: {
    color: COLORS.textMuted,
    fontSize: 11,
    marginTop: 2,
  },
  profileBtn: {
    padding: SPACING.xs,
  },
  section: {
    marginTop: SPACING.md,
    paddingHorizontal: SPACING.md,
  },
  sectionTitle: {
    color: COLORS.textMuted,
    fontSize: 11,
    fontWeight: '700',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
    marginBottom: SPACING.xs + 2,
  },
  sectionCard: {
    backgroundColor: COLORS.surface,
    borderRadius: RADIUS.lg,
    borderWidth: 1,
    borderColor: COLORS.surfaceBorder,
    overflow: 'hidden',
  },
  menuRow: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: SPACING.md,
  },
  menuRowBorder: {
    borderBottomWidth: 1,
    borderBottomColor: COLORS.surfaceBorder,
  },
  iconBox: {
    width: 36,
    height: 36,
    borderRadius: RADIUS.md,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: SPACING.md,
  },
  menuLabel: {
    color: COLORS.text,
    fontSize: 14,
    fontWeight: '600',
  },
  menuDesc: {
    color: COLORS.textMuted,
    fontSize: 11,
    marginTop: 2,
  },
  logoutBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(239, 68, 68, 0.1)',
    marginHorizontal: SPACING.md,
    marginTop: SPACING.lg,
    paddingVertical: 12,
    borderRadius: RADIUS.md,
    borderWidth: 1,
    borderColor: 'rgba(239, 68, 68, 0.3)',
  },
  logoutText: {
    color: COLORS.danger,
    fontSize: 13,
    fontWeight: '700',
  },
});

