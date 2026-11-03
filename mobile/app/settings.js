import React, { useState } from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  StyleSheet,
  SafeAreaView,
  ActivityIndicator,
  Alert,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { COLORS, RADIUS, SPACING } from '../constants/theme';
import { Header } from '../components/Header';
import { Input } from '../components/Input';
import { Button } from '../components/Button';
import { useConfig } from '../context/ConfigContext';
import { CONFIG } from '../constants/config';

export default function SettingsScreen() {
  const { baseUrl, isConnected, backendData, updateBaseUrl, refreshHealth } = useConfig();
  const [customUrl, setCustomUrl] = useState(baseUrl);
  const [testing, setTesting] = useState(false);
  const [pingResult, setPingResult] = useState(null);

  const presets = [
    { label: 'Android Emulator', url: 'http://10.0.2.2:8000/api', desc: 'Default alias for Android Virtual Devices (AVD)' },
    { label: 'Localhost (Web/Desktop)', url: 'http://127.0.0.1:8000/api', desc: 'Direct host loopback' },
  ];

  const handleApplyPreset = (url) => {
    setCustomUrl(url);
  };

  const handleTestConnection = async () => {
    if (!customUrl.trim()) {
      Alert.alert('Invalid URL', 'Please enter a valid backend endpoint URL.');
      return;
    }
    setTesting(true);
    setPingResult(null);
    try {
      const res = await updateBaseUrl(customUrl.trim());
      setPingResult(res);
      if (res.connected) {
        Alert.alert('Connection Successful', `Backend reached successfully at ${res.url}`);
      } else {
        Alert.alert('Connection Failed', `Could not reach ${customUrl}. Verify backend is running: python -m uvicorn app.main:app`);
      }
    } catch (err) {
      setPingResult({ connected: false, error: err.message });
      Alert.alert('Connection Error', err.message);
    } finally {
      setTesting(false);
    }
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      <Header title="Network Settings" showBack={true} subtitle="FastAPI Host Configuration" />

      <ScrollView style={styles.scroll} showsVerticalScrollIndicator={false}>
        {/* Connection Status Banner */}
        <View style={styles.statusCard}>
          <View style={styles.statusHeader}>
            <View
              style={[
                styles.statusDot,
                { backgroundColor: isConnected ? COLORS.emerald : COLORS.danger },
              ]}
            />
            <Text style={styles.statusTitle}>
              {isConnected ? 'Backend Server Online' : 'Backend Disconnected'}
            </Text>
          </View>
          <Text style={styles.statusUrl}>{baseUrl}</Text>

          {backendData && (
            <View style={styles.backendDetails}>
              <View style={styles.detailPill}>
                <Text style={styles.detailPillLabel}>Database:</Text>
                <Text style={styles.detailPillVal}>{backendData.database || 'Connected'}</Text>
              </View>
              <View style={styles.detailPill}>
                <Text style={styles.detailPillLabel}>Storage Mode:</Text>
                <Text style={styles.detailPillVal}>{backendData.storage_mode || 'Mock'}</Text>
              </View>
              <View style={styles.detailPill}>
                <Text style={styles.detailPillLabel}>AI Model:</Text>
                <Text style={styles.detailPillVal}>{backendData.model || 'Loaded'}</Text>
              </View>
            </View>
          )}
        </View>

        {/* Configuration Form */}
        <View style={styles.configCard}>
          <Text style={styles.configTitle}>Backend API Base URL</Text>
          <Text style={styles.configSub}>
            Enter your computer's local IPv4 network address when testing on a physical Android phone.
          </Text>

          <Input
            placeholder="http://10.0.2.2:8000/api"
            value={customUrl}
            onChangeText={setCustomUrl}
            autoCapitalize="none"
            autoCorrect={false}
            icon={<Ionicons name="link-outline" size={18} color={COLORS.textMuted} />}
          />

          {/* Quick Presets */}
          <Text style={styles.presetsLabel}>Quick Presets:</Text>
          {presets.map((p) => (
            <TouchableOpacity
              key={p.url}
              style={[styles.presetRow, customUrl === p.url && styles.presetRowActive]}
              onPress={() => handleApplyPreset(p.url)}
            >
              <View style={{ flex: 1 }}>
                <Text style={[styles.presetLabel, customUrl === p.url && styles.presetLabelActive]}>
                  {p.label}
                </Text>
                <Text style={styles.presetDesc}>{p.desc}</Text>
                <Text style={styles.presetUrlText}>{p.url}</Text>
              </View>
              <Ionicons
                name={customUrl === p.url ? 'radio-button-on' : 'radio-button-off'}
                size={18}
                color={customUrl === p.url ? COLORS.primaryLight : COLORS.textMuted}
              />
            </TouchableOpacity>
          ))}

          <Button
            title="Save & Test Connection"
            onPress={handleTestConnection}
            loading={testing}
            variant="primary"
            size="lg"
            icon={<Ionicons name="wifi-outline" size={18} color="#ffffff" />}
            style={{ marginTop: SPACING.md }}
          />
        </View>

        {/* Physical Device Guide */}
        <View style={styles.guideCard}>
          <View style={styles.guideHeader}>
            <Ionicons name="phone-portrait-outline" size={18} color={COLORS.secondaryLight} style={{ marginRight: 6 }} />
            <Text style={styles.guideTitle}>Physical Device Setup Guide</Text>
          </View>
          <Text style={styles.guideText}>
            1. Ensure your computer and Android phone are on the same Wi-Fi network.{'\n'}
            2. Run `ipconfig` on Windows to find your IPv4 Address (e.g. `192.168.1.100`).{'\n'}
            3. Start backend: `python -m uvicorn app.main:app --host 0.0.0.0 --port 8000`.{'\n'}
            4. Set URL above to `http://192.168.1.100:8000/api`.
          </Text>
        </View>

        {/* App Version Info */}
        <View style={styles.versionCard}>
          <Text style={styles.versionTitle}>BioPatch AI Android Mobile</Text>
          <Text style={styles.versionText}>Version {CONFIG.APP_VERSION} • Expo SDK 58 • React Native 0.88</Text>
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
  statusCard: {
    backgroundColor: COLORS.surface,
    marginHorizontal: SPACING.md,
    marginTop: SPACING.md,
    borderRadius: RADIUS.lg,
    padding: SPACING.md,
    borderWidth: 1,
    borderColor: COLORS.surfaceBorder,
  },
  statusHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 4,
  },
  statusDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    marginRight: 6,
  },
  statusTitle: {
    color: COLORS.text,
    fontSize: 14,
    fontWeight: '700',
  },
  statusUrl: {
    color: COLORS.primaryLight,
    fontSize: 12,
    fontWeight: '600',
    marginTop: 2,
  },
  backendDetails: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: SPACING.xs + 2,
    marginTop: SPACING.sm + 2,
    paddingTop: SPACING.sm,
    borderTopWidth: 1,
    borderTopColor: COLORS.surfaceBorder,
  },
  detailPill: {
    flexDirection: 'row',
    backgroundColor: COLORS.surfaceCard,
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: RADIUS.sm,
    borderWidth: 1,
    borderColor: COLORS.surfaceBorder,
  },
  detailPillLabel: {
    color: COLORS.textMuted,
    fontSize: 10,
    marginRight: 4,
  },
  detailPillVal: {
    color: COLORS.textSecondary,
    fontSize: 10,
    fontWeight: '600',
  },
  configCard: {
    backgroundColor: COLORS.surface,
    marginHorizontal: SPACING.md,
    marginTop: SPACING.md,
    borderRadius: RADIUS.lg,
    padding: SPACING.md,
    borderWidth: 1,
    borderColor: COLORS.surfaceBorder,
  },
  configTitle: {
    color: COLORS.text,
    fontSize: 15,
    fontWeight: '700',
  },
  configSub: {
    color: COLORS.textSecondary,
    fontSize: 12,
    marginTop: 2,
    marginBottom: SPACING.md,
  },
  presetsLabel: {
    color: COLORS.textMuted,
    fontSize: 11,
    fontWeight: '700',
    textTransform: 'uppercase',
    marginBottom: SPACING.xs + 2,
  },
  presetRow: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.surfaceCard,
    padding: SPACING.sm + 2,
    borderRadius: RADIUS.md,
    borderWidth: 1,
    borderColor: COLORS.surfaceBorder,
    marginBottom: SPACING.xs + 2,
  },
  presetRowActive: {
    borderColor: COLORS.primary,
    backgroundColor: COLORS.primaryGlow,
  },
  presetLabel: {
    color: COLORS.text,
    fontSize: 13,
    fontWeight: '600',
  },
  presetLabelActive: {
    color: COLORS.primaryLight,
  },
  presetDesc: {
    color: COLORS.textMuted,
    fontSize: 10,
    marginTop: 1,
  },
  presetUrlText: {
    color: COLORS.textSecondary,
    fontSize: 11,
    marginTop: 2,
  },
  guideCard: {
    backgroundColor: COLORS.surfaceCard,
    marginHorizontal: SPACING.md,
    marginTop: SPACING.md,
    borderRadius: RADIUS.lg,
    padding: SPACING.md,
    borderWidth: 1,
    borderColor: 'rgba(20, 184, 166, 0.25)',
  },
  guideHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: SPACING.xs,
  },
  guideTitle: {
    color: COLORS.secondaryLight,
    fontSize: 13,
    fontWeight: '700',
  },
  guideText: {
    color: COLORS.textSecondary,
    fontSize: 11,
    lineHeight: 18,
  },
  versionCard: {
    alignItems: 'center',
    marginTop: SPACING.lg,
  },
  versionTitle: {
    color: COLORS.textMuted,
    fontSize: 12,
    fontWeight: '600',
  },
  versionText: {
    color: COLORS.textMuted,
    fontSize: 10,
    marginTop: 2,
  },
});

