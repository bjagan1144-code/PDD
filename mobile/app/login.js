import React, { useState } from 'react';
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
import { Input } from '../components/Input';
import { Button } from '../components/Button';
import { useAuth } from '../context/AuthContext';
import { useConfig } from '../context/ConfigContext';

export default function LoginScreen() {
  const router = useRouter();
  const { login, isLoading } = useAuth();
  const { isConnected, baseUrl } = useConfig();

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');

  const handleLogin = async (overrideEmail = null, overridePassword = null) => {
    setErrorMsg('');
    const targetEmail = overrideEmail || email;
    const targetPassword = overridePassword || password;

    if (!targetEmail.trim() || !targetPassword.trim()) {
      setErrorMsg('Please enter your research email and password.');
      return;
    }

    try {
      await login(targetEmail.trim(), targetPassword);
      router.replace('/(tabs)/dashboard');
    } catch (err) {
      setErrorMsg(err.message || 'Authentication failed. Please verify credentials.');
    }
  };

  const handleDemoLogin = (userType = 'principal') => {
    if (userType === 'principal') {
      setEmail('researcher@biopatch.ai');
      setPassword('password');
      handleLogin('researcher@biopatch.ai', 'password');
    } else {
      setEmail('demo.researcher@biopatch.ai');
      setPassword('password');
      handleLogin('demo.researcher@biopatch.ai', 'password');
    }
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      <Header title="Sign In" showBack={true} subtitle="Researcher Authentication" />

      <ScrollView style={styles.scroll} contentContainerStyle={styles.scrollContent}>
        {/* Brand Banner */}
        <View style={styles.logoBox}>
          <View style={styles.logoPill}>
            <Ionicons name="git-network-outline" size={30} color={COLORS.primaryLight} />
          </View>
          <Text style={styles.brandTitle}>BioPatch AI</Text>
          <Text style={styles.brandSub}>
            Pre-clinical transdermal formulation research portal
          </Text>
        </View>

        {/* Offline Warning if backend is unreachable */}
        {!isConnected && (
          <TouchableOpacity
            style={styles.offlineWarning}
            onPress={() => router.push('/settings')}
          >
            <Ionicons name="alert-circle-outline" size={18} color="#f87171" style={{ marginRight: 6 }} />
            <View style={{ flex: 1 }}>
              <Text style={styles.offlineTitle}>Backend Disconnected</Text>
              <Text style={styles.offlineSub}>
                Tap to configure API IP in Settings ({baseUrl})
              </Text>
            </View>
            <Ionicons name="chevron-forward" size={16} color="#f87171" />
          </TouchableOpacity>
        )}

        {/* Error Banner */}
        {errorMsg ? (
          <View style={styles.errorBanner}>
            <Ionicons name="close-circle-outline" size={18} color={COLORS.danger} style={{ marginRight: 6 }} />
            <Text style={styles.errorText}>{errorMsg}</Text>
          </View>
        ) : null}

        {/* Form Card */}
        <View style={styles.formCard}>
          <Input
            label="Research Email"
            placeholder="researcher@biopatch.ai"
            value={email}
            onChangeText={setEmail}
            keyboardType="email-address"
            icon={<Ionicons name="mail-outline" size={18} color={COLORS.textMuted} />}
          />

          <View style={{ position: 'relative' }}>
            <Input
              label="Password"
              placeholder="••••••••"
              value={password}
              onChangeText={setPassword}
              secureTextEntry={!showPassword}
              icon={<Ionicons name="lock-closed-outline" size={18} color={COLORS.textMuted} />}
            />
            <TouchableOpacity
              style={styles.eyeBtn}
              onPress={() => setShowPassword(!showPassword)}
            >
              <Ionicons
                name={showPassword ? 'eye-off-outline' : 'eye-outline'}
                size={18}
                color={COLORS.textMuted}
              />
            </TouchableOpacity>
          </View>

          <Button
            title="Authenticate & Enter"
            onPress={() => handleLogin()}
            loading={isLoading}
            variant="primary"
            size="lg"
            icon={<Ionicons name="log-in-outline" size={18} color="#ffffff" />}
            style={{ marginTop: SPACING.sm }}
          />

          {/* Demonstration Quick Fill */}
          <View style={styles.demoDivider}>
            <View style={styles.dividerLine} />
            <Text style={styles.dividerText}>DEMONSTRATION SHORTCUTS</Text>
            <View style={styles.dividerLine} />
          </View>

          <View style={styles.demoButtonsRow}>
            <TouchableOpacity
              style={styles.demoBtn}
              onPress={() => handleDemoLogin('principal')}
            >
              <Ionicons name="shield-checkmark" size={14} color={COLORS.primaryLight} style={{ marginRight: 4 }} />
              <Text style={styles.demoBtnText}>Principal Investigator</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[styles.demoBtn, { borderColor: 'rgba(99, 102, 241, 0.3)' }]}
              onPress={() => handleDemoLogin('researcher')}
            >
              <Ionicons name="flask" size={14} color={COLORS.accentLight} style={{ marginRight: 4 }} />
              <Text style={[styles.demoBtnText, { color: COLORS.accentLight }]}>Biomaterials Scientist</Text>
            </TouchableOpacity>
          </View>
        </View>

        {/* Footer Navigation */}
        <View style={styles.footerRow}>
          <Text style={styles.footerPrompt}>Need a new research account? </Text>
          <TouchableOpacity onPress={() => router.push('/register')}>
            <Text style={styles.footerLink}>Register Here</Text>
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
  scrollContent: {
    paddingHorizontal: SPACING.md,
    paddingTop: SPACING.lg,
  },
  logoBox: {
    alignItems: 'center',
    marginBottom: SPACING.lg,
  },
  logoPill: {
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: COLORS.primaryGlow,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1.5,
    borderColor: 'rgba(14, 165, 233, 0.4)',
    marginBottom: SPACING.sm,
  },
  brandTitle: {
    color: COLORS.text,
    fontSize: 22,
    fontWeight: '800',
    letterSpacing: -0.3,
  },
  brandSub: {
    color: COLORS.textSecondary,
    fontSize: 12,
    marginTop: 3,
  },
  offlineWarning: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(239, 68, 68, 0.12)',
    borderRadius: RADIUS.md,
    borderWidth: 1,
    borderColor: 'rgba(239, 68, 68, 0.3)',
    padding: SPACING.sm + 2,
    marginBottom: SPACING.md,
  },
  offlineTitle: {
    color: '#f87171',
    fontSize: 12,
    fontWeight: '600',
  },
  offlineSub: {
    color: COLORS.textMuted,
    fontSize: 10,
    marginTop: 1,
  },
  errorBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(239, 68, 68, 0.15)',
    borderRadius: RADIUS.md,
    borderWidth: 1,
    borderColor: COLORS.danger,
    padding: SPACING.sm + 2,
    marginBottom: SPACING.md,
  },
  errorText: {
    color: '#fca5a5',
    fontSize: 12,
    flex: 1,
  },
  formCard: {
    backgroundColor: COLORS.surface,
    borderRadius: RADIUS.xl,
    padding: SPACING.lg,
    borderWidth: 1,
    borderColor: COLORS.surfaceBorder,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 10,
    elevation: 4,
  },
  eyeBtn: {
    position: 'absolute',
    right: 14,
    top: 36,
    padding: 4,
  },
  demoDivider: {
    flexDirection: 'row',
    alignItems: 'center',
    marginVertical: SPACING.lg,
  },
  dividerLine: {
    flex: 1,
    height: 1,
    backgroundColor: COLORS.surfaceBorder,
  },
  dividerText: {
    color: COLORS.textMuted,
    fontSize: 10,
    fontWeight: '700',
    letterSpacing: 0.5,
    marginHorizontal: SPACING.sm,
  },
  demoButtonsRow: {
    gap: SPACING.sm,
  },
  demoBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: COLORS.surfaceCard,
    paddingVertical: 10,
    borderRadius: RADIUS.md,
    borderWidth: 1,
    borderColor: 'rgba(14, 165, 233, 0.3)',
  },
  demoBtnText: {
    color: COLORS.primaryLight,
    fontSize: 12,
    fontWeight: '600',
  },
  footerRow: {
    flexDirection: 'row',
    justifyContent: 'center',
    marginTop: SPACING.lg,
  },
  footerPrompt: {
    color: COLORS.textSecondary,
    fontSize: 13,
  },
  footerLink: {
    color: COLORS.primaryLight,
    fontSize: 13,
    fontWeight: '600',
  },
});

