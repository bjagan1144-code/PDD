import React, { useState } from 'react';
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
import { COLORS, RADIUS, SPACING } from '../constants/theme';
import { Header } from '../components/Header';
import { Input } from '../components/Input';
import { Button } from '../components/Button';
import { useAuth } from '../context/AuthContext';

const ROLES = [
  'Principal Investigator',
  'Formulation Scientist',
  'Biomaterials Researcher',
  'Pharmacokinetics Specialist',
  'Graduate Research Fellow',
];

export default function RegisterScreen() {
  const router = useRouter();
  const { register, isLoading } = useAuth();

  const [fullName, setFullName] = useState('');
  const [email, setEmail] = useState('');
  const [role, setRole] = useState(ROLES[0]);
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [errorMsg, setErrorMsg] = useState('');

  const handleRegister = async () => {
    setErrorMsg('');

    if (!fullName.trim() || !email.trim() || !password.trim()) {
      setErrorMsg('Please complete all required fields.');
      return;
    }

    if (password.length < 6) {
      setErrorMsg('Password must be at least 6 characters.');
      return;
    }

    if (password !== confirmPassword) {
      setErrorMsg('Passwords do not match.');
      return;
    }

    try {
      await register({
        full_name: fullName.trim(),
        email: email.trim().toLowerCase(),
        password: password,
        role: role,
      });
      router.replace('/(tabs)/dashboard');
    } catch (err) {
      setErrorMsg(err.message || 'Registration failed. Email may already be registered.');
    }
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      <Header title="New Researcher" showBack={true} subtitle="Workspace Account Registration" />

      <ScrollView style={styles.scroll} contentContainerStyle={styles.scrollContent}>
        <View style={styles.headerTextBox}>
          <Text style={styles.heading}>Create Research Profile</Text>
          <Text style={styles.subheading}>
            Join the BioPatch AI in-silico simulation network for transdermal drug modeling.
          </Text>
        </View>

        {errorMsg ? (
          <View style={styles.errorBanner}>
            <Ionicons name="alert-circle-outline" size={18} color={COLORS.danger} style={{ marginRight: 6 }} />
            <Text style={styles.errorText}>{errorMsg}</Text>
          </View>
        ) : null}

        <View style={styles.formCard}>
          <Input
            label="Full Name"
            placeholder="Dr. Samantha Cruz"
            value={fullName}
            onChangeText={setFullName}
            icon={<Ionicons name="person-outline" size={18} color={COLORS.textMuted} />}
          />

          <Input
            label="Institutional / Research Email"
            placeholder="scruz@biotech-lab.edu"
            value={email}
            onChangeText={setEmail}
            keyboardType="email-address"
            icon={<Ionicons name="mail-outline" size={18} color={COLORS.textMuted} />}
          />

          {/* Role Selection Chips */}
          <Text style={styles.roleLabel}>Research Role</Text>
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            style={styles.rolesScroll}
            contentContainerStyle={styles.rolesContainer}
          >
            {ROLES.map((r) => {
              const isSelected = role === r;
              return (
                <TouchableOpacity
                  key={r}
                  style={[styles.roleChip, isSelected && styles.roleChipActive]}
                  onPress={() => setRole(r)}
                >
                  <Text style={[styles.roleText, isSelected && styles.roleTextActive]}>
                    {r}
                  </Text>
                </TouchableOpacity>
              );
            })}
          </ScrollView>

          <Input
            label="Password"
            placeholder="Minimum 6 characters"
            value={password}
            onChangeText={setPassword}
            secureTextEntry={true}
            icon={<Ionicons name="lock-closed-outline" size={18} color={COLORS.textMuted} />}
          />

          <Input
            label="Confirm Password"
            placeholder="Repeat password"
            value={confirmPassword}
            onChangeText={setConfirmPassword}
            secureTextEntry={true}
            icon={<Ionicons name="checkmark-done-outline" size={18} color={COLORS.textMuted} />}
          />

          <Button
            title="Create Workspace Account"
            onPress={handleRegister}
            loading={isLoading}
            variant="primary"
            size="lg"
            icon={<Ionicons name="person-add-outline" size={18} color="#ffffff" />}
            style={{ marginTop: SPACING.sm }}
          />
        </View>

        <View style={styles.footerRow}>
          <Text style={styles.footerPrompt}>Already have an account? </Text>
          <TouchableOpacity onPress={() => router.push('/login')}>
            <Text style={styles.footerLink}>Sign In</Text>
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
    paddingTop: SPACING.md,
  },
  headerTextBox: {
    marginBottom: SPACING.lg,
  },
  heading: {
    color: COLORS.text,
    fontSize: 22,
    fontWeight: '800',
    letterSpacing: -0.3,
  },
  subheading: {
    color: COLORS.textSecondary,
    fontSize: 13,
    marginTop: 4,
    lineHeight: 18,
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
  },
  roleLabel: {
    color: COLORS.textSecondary,
    fontSize: 13,
    fontWeight: '500',
    marginBottom: SPACING.xs + 2,
  },
  rolesScroll: {
    marginBottom: SPACING.md,
  },
  rolesContainer: {
    gap: SPACING.xs + 2,
  },
  roleChip: {
    backgroundColor: COLORS.inputBg,
    paddingHorizontal: SPACING.sm + 4,
    paddingVertical: 7,
    borderRadius: RADIUS.full,
    borderWidth: 1,
    borderColor: COLORS.surfaceBorder,
  },
  roleChipActive: {
    backgroundColor: COLORS.primaryGlow,
    borderColor: COLORS.primary,
  },
  roleText: {
    color: COLORS.textSecondary,
    fontSize: 12,
  },
  roleTextActive: {
    color: COLORS.primaryLight,
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

