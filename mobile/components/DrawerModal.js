import React from 'react';
import {
  View,
  Text,
  Modal,
  TouchableOpacity,
  ScrollView,
  StyleSheet,
  SafeAreaView,
} from 'react-native';
import { useRouter, usePathname } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { COLORS, RADIUS, SPACING } from '../constants/theme';
import { useAuth } from '../context/AuthContext';
import { useConfig } from '../context/ConfigContext';

export const DrawerModal = ({ visible, onClose }) => {
  const router = useRouter();
  const pathname = usePathname();
  const { user, isAuthenticated, logout } = useAuth();
  const { isConnected } = useConfig();

  const navItems = [
    { label: 'Home', icon: 'home-outline', route: '/' },
    { label: 'Explore Kinetics', icon: 'compass-outline', route: '/explore' },
    { label: 'Dashboard', icon: 'grid-outline', route: '/(tabs)/dashboard', auth: true },
    { label: 'Drug Simulator', icon: 'flask-outline', route: '/(tabs)/simulator', auth: true },
    { label: 'AI Prediction', icon: 'analytics-outline', route: '/(tabs)/predictions', auth: true },
    { label: 'Drug Library', icon: 'medkit-outline', route: '/drugs', auth: true },
    { label: 'Polymer Library', icon: 'layers-outline', route: '/polymers', auth: true },
    { label: 'Release Monitor', icon: 'pulse-outline', route: '/monitor', auth: true },
    { label: 'Simulation History', icon: 'time-outline', route: '/(tabs)/history', auth: true },
    { label: 'Research Reports', icon: 'document-text-outline', route: '/reports', auth: true },
    { label: 'User Profile', icon: 'person-outline', route: '/profile', auth: true },
    { label: 'Network Settings', icon: 'settings-outline', route: '/settings' },
  ];

  const handleNavigate = (route) => {
    onClose();
    setTimeout(() => {
      router.push(route);
    }, 150);
  };

  const handleLogout = async () => {
    onClose();
    await logout();
    router.replace('/login');
  };

  return (
    <Modal
      visible={visible}
      animationType="fade"
      transparent={true}
      onRequestClose={onClose}
    >
      <View style={styles.backdrop}>
        <TouchableOpacity style={styles.dismissOverlay} onPress={onClose} activeOpacity={1} />
        <SafeAreaView style={styles.drawerContainer}>
          {/* Header */}
          <View style={styles.drawerHeader}>
            <View style={styles.logoRow}>
              <View style={styles.logoPill}>
                <Ionicons name="git-network-outline" size={20} color={COLORS.primaryLight} />
              </View>
              <View>
                <Text style={styles.appName}>BioPatch AI</Text>
                <View style={styles.networkRow}>
                  <View
                    style={[
                      styles.netDot,
                      { backgroundColor: isConnected ? COLORS.emerald : COLORS.danger },
                    ]}
                  />
                  <Text style={styles.netText}>
                    {isConnected ? 'Backend Connected' : 'Offline Mode'}
                  </Text>
                </View>
              </View>
            </View>
            <TouchableOpacity onPress={onClose} style={styles.closeBtn}>
              <Ionicons name="close" size={22} color={COLORS.textSecondary} />
            </TouchableOpacity>
          </View>

          {/* User profile card or login prompt */}
          {isAuthenticated && user ? (
            <View style={styles.userCard}>
              <View style={styles.avatar}>
                <Text style={styles.avatarText}>
                  {(user.full_name || user.email || 'U')[0].toUpperCase()}
                </Text>
              </View>
              <View style={styles.userInfo}>
                <Text style={styles.userName} numberOfLines={1}>
                  {user.full_name || 'Biomedical Researcher'}
                </Text>
                <Text style={styles.userRole} numberOfLines={1}>
                  {user.role || user.email}
                </Text>
              </View>
            </View>
          ) : (
            <View style={styles.guestCard}>
              <Text style={styles.guestTitle}>Researcher Access</Text>
              <View style={styles.guestBtnRow}>
                <TouchableOpacity
                  style={[styles.authBtn, styles.loginBtn]}
                  onPress={() => handleNavigate('/login')}
                >
                  <Text style={styles.loginBtnText}>Sign In</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={[styles.authBtn, styles.registerBtn]}
                  onPress={() => handleNavigate('/register')}
                >
                  <Text style={styles.registerBtnText}>Register</Text>
                </TouchableOpacity>
              </View>
            </View>
          )}

          {/* Navigation Items List */}
          <ScrollView style={styles.navScroll} showsVerticalScrollIndicator={false}>
            {navItems.map((item) => {
              const isActive = pathname === item.route;
              return (
                <TouchableOpacity
                  key={item.route}
                  style={[styles.navItem, isActive && styles.navItemActive]}
                  onPress={() => handleNavigate(item.route)}
                >
                  <Ionicons
                    name={item.icon}
                    size={20}
                    color={isActive ? COLORS.primaryLight : COLORS.textSecondary}
                    style={styles.navIcon}
                  />
                  <Text style={[styles.navLabel, isActive && styles.navLabelActive]}>
                    {item.label}
                  </Text>
                  {isActive && <View style={styles.activeIndicator} />}
                </TouchableOpacity>
              );
            })}

            {isAuthenticated && (
              <TouchableOpacity style={styles.logoutBtn} onPress={handleLogout}>
                <Ionicons name="log-out-outline" size={20} color={COLORS.danger} style={styles.navIcon} />
                <Text style={styles.logoutText}>Sign Out Session</Text>
              </TouchableOpacity>
            )}

            <View style={{ height: 40 }} />
          </ScrollView>
        </SafeAreaView>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  backdrop: {
    flex: 1,
    backgroundColor: COLORS.overlay,
    flexDirection: 'row',
  },
  dismissOverlay: {
    flex: 1,
  },
  drawerContainer: {
    width: 290,
    backgroundColor: COLORS.surface,
    height: '100%',
    borderLeftWidth: 1,
    borderLeftColor: COLORS.surfaceBorder,
    shadowColor: '#000',
    shadowOffset: { width: -4, height: 0 },
    shadowOpacity: 0.5,
    shadowRadius: 12,
    elevation: 10,
  },
  drawerHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: SPACING.md,
    paddingTop: SPACING.md,
    paddingBottom: SPACING.sm,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.surfaceBorder,
  },
  logoRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  logoPill: {
    width: 36,
    height: 36,
    borderRadius: RADIUS.md,
    backgroundColor: COLORS.primaryGlow,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: SPACING.sm,
    borderWidth: 1,
    borderColor: 'rgba(14, 165, 233, 0.3)',
  },
  appName: {
    color: COLORS.text,
    fontSize: 15,
    fontWeight: '700',
    letterSpacing: 0.3,
  },
  networkRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 2,
  },
  netDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    marginRight: 4,
  },
  netText: {
    fontSize: 10,
    color: COLORS.textMuted,
  },
  closeBtn: {
    padding: SPACING.xs,
  },
  userCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.surfaceCard,
    marginHorizontal: SPACING.md,
    marginTop: SPACING.md,
    padding: SPACING.sm + 2,
    borderRadius: RADIUS.md,
    borderWidth: 1,
    borderColor: COLORS.surfaceBorder,
  },
  avatar: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: COLORS.accent,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: SPACING.sm,
  },
  avatarText: {
    color: '#ffffff',
    fontWeight: '700',
    fontSize: 14,
  },
  userInfo: {
    flex: 1,
  },
  userName: {
    color: COLORS.text,
    fontSize: 13,
    fontWeight: '600',
  },
  userRole: {
    color: COLORS.textMuted,
    fontSize: 11,
  },
  guestCard: {
    backgroundColor: COLORS.surfaceCard,
    marginHorizontal: SPACING.md,
    marginTop: SPACING.md,
    padding: SPACING.sm + 4,
    borderRadius: RADIUS.md,
    borderWidth: 1,
    borderColor: COLORS.surfaceBorder,
  },
  guestTitle: {
    color: COLORS.textSecondary,
    fontSize: 12,
    marginBottom: SPACING.xs,
  },
  guestBtnRow: {
    flexDirection: 'row',
    gap: SPACING.sm,
  },
  authBtn: {
    flex: 1,
    paddingVertical: 6,
    borderRadius: RADIUS.sm,
    alignItems: 'center',
    borderWidth: 1,
  },
  loginBtn: {
    backgroundColor: COLORS.primary,
    borderColor: COLORS.primaryLight,
  },
  loginBtnText: {
    color: '#ffffff',
    fontSize: 12,
    fontWeight: '600',
  },
  registerBtn: {
    backgroundColor: 'transparent',
    borderColor: COLORS.surfaceBorder,
  },
  registerBtnText: {
    color: COLORS.textSecondary,
    fontSize: 12,
  },
  navScroll: {
    flex: 1,
    paddingHorizontal: SPACING.md,
    paddingTop: SPACING.md,
  },
  navItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 11,
    paddingHorizontal: SPACING.sm + 2,
    borderRadius: RADIUS.md,
    marginBottom: 4,
  },
  navItemActive: {
    backgroundColor: COLORS.primaryGlow,
  },
  navIcon: {
    marginRight: SPACING.md,
  },
  navLabel: {
    color: COLORS.textSecondary,
    fontSize: 14,
    fontWeight: '500',
    flex: 1,
  },
  navLabelActive: {
    color: COLORS.primaryLight,
    fontWeight: '700',
  },
  activeIndicator: {
    width: 4,
    height: 16,
    borderRadius: 2,
    backgroundColor: COLORS.primaryLight,
  },
  logoutBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    paddingHorizontal: SPACING.sm + 2,
    borderRadius: RADIUS.md,
    marginTop: SPACING.md,
    borderTopWidth: 1,
    borderTopColor: COLORS.surfaceBorder,
  },
  logoutText: {
    color: COLORS.danger,
    fontSize: 14,
    fontWeight: '600',
  },
});

