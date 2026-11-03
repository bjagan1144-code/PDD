import React, { useState } from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { COLORS, RADIUS, SPACING } from '../constants/theme';
import { useConfig } from '../context/ConfigContext';
import { DrawerModal } from './DrawerModal';

export const Header = ({ title = 'BioPatch AI', showBack = false, subtitle = null }) => {
  const router = useRouter();
  const { isConnected } = useConfig();
  const [drawerOpen, setDrawerOpen] = useState(false);

  return (
    <>
      <View style={styles.container}>
        <View style={styles.leftRow}>
          {showBack ? (
            <TouchableOpacity onPress={() => router.back()} style={styles.iconBtn}>
              <Ionicons name="arrow-back" size={22} color={COLORS.text} />
            </TouchableOpacity>
          ) : (
            <View style={styles.brandIconBox}>
              <Ionicons name="git-network-outline" size={18} color={COLORS.primaryLight} />
            </View>
          )}

          <View style={styles.titleBox}>
            <Text style={styles.title} numberOfLines={1}>
              {title}
            </Text>
            {subtitle && (
              <Text style={styles.subtitle} numberOfLines={1}>
                {subtitle}
              </Text>
            )}
          </View>
        </View>

        <View style={styles.rightRow}>
          {/* Connectivity Status Pill */}
          <TouchableOpacity
            style={[
              styles.statusPill,
              {
                backgroundColor: isConnected
                  ? 'rgba(16, 185, 129, 0.12)'
                  : 'rgba(239, 68, 68, 0.12)',
                borderColor: isConnected
                  ? 'rgba(16, 185, 129, 0.3)'
                  : 'rgba(239, 68, 68, 0.3)',
              },
            ]}
            onPress={() => router.push('/settings')}
          >
            <View
              style={[
                styles.dot,
                { backgroundColor: isConnected ? COLORS.emerald : COLORS.danger },
              ]}
            />
            <Text
              style={[
                styles.statusText,
                { color: isConnected ? COLORS.emeraldLight : '#f87171' },
              ]}
            >
              {isConnected ? 'API Live' : 'Offline'}
            </Text>
          </TouchableOpacity>

          {/* Menu Drawer Toggle */}
          <TouchableOpacity
            style={styles.menuBtn}
            onPress={() => setDrawerOpen(true)}
          >
            <Ionicons name="menu-outline" size={24} color={COLORS.text} />
          </TouchableOpacity>
        </View>
      </View>

      <DrawerModal visible={drawerOpen} onClose={() => setDrawerOpen(false)} />
    </>
  );
};

const styles = StyleSheet.create({
  container: {
    height: 58,
    backgroundColor: COLORS.background,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.surfaceBorder,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: SPACING.md,
  },
  leftRow: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
    marginRight: SPACING.sm,
  },
  iconBtn: {
    padding: SPACING.xs,
    marginRight: SPACING.sm,
  },
  brandIconBox: {
    width: 32,
    height: 32,
    borderRadius: RADIUS.sm,
    backgroundColor: COLORS.primaryGlow,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: SPACING.sm,
    borderWidth: 1,
    borderColor: 'rgba(14, 165, 233, 0.3)',
  },
  titleBox: {
    flex: 1,
  },
  title: {
    color: COLORS.text,
    fontSize: 16,
    fontWeight: '700',
    letterSpacing: 0.2,
  },
  subtitle: {
    color: COLORS.textMuted,
    fontSize: 10,
  },
  rightRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING.sm,
  },
  statusPill: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: SPACING.sm,
    paddingVertical: 3,
    borderRadius: RADIUS.full,
    borderWidth: 1,
  },
  dot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    marginRight: 4,
  },
  statusText: {
    fontSize: 10,
    fontWeight: '600',
  },
  menuBtn: {
    padding: SPACING.xs,
  },
});

