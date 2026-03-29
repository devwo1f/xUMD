/**
 * RegisterScreen
 *
 * Multi-step registration (4 steps with progress dots):
 *  Step 1: Email (@terpmail.umd.edu validation)
 *  Step 2: Password creation with live requirements checklist
 *  Step 3: Profile (display name required, major optional, grad year optional)
 *  Step 4: Interest categories (grid of tappable chips)
 */

import React, { useState } from 'react';
import {
  KeyboardAvoidingView,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Input, Button } from '../../../shared/components';
import { useResponsive } from '../../../shared/hooks/useResponsive';
import { colors } from '../../../shared/theme/colors';
import { typography } from '../../../shared/theme/typography';
import { spacing, borderRadius, shadows } from '../../../shared/theme/spacing';
import { useAuth } from '../hooks/useAuth';
import { validateUmdEmail, validatePassword } from '../hooks/useAuth';
import PasswordRequirements from '../components/PasswordRequirements';
import type { AuthStackParamList } from '../../../navigation/types';

type Props = NativeStackScreenProps<AuthStackParamList, 'Register'>;

const TOTAL_STEPS = 4;

const INTEREST_CATEGORIES = [
  'Academic', 'Sports', 'Cultural', 'Professional',
  'Social', 'Arts & Music', 'Service', 'Greek Life',
  'Gaming', 'Technology', 'Fitness', 'Food & Dining',
  'Politics', 'Sustainability', 'Entrepreneurship', 'Media',
];

export default function RegisterScreen({ navigation }: Props) {
  const { signUp, loading, error, clearError } = useAuth();
  const { isMobile } = useResponsive();

  const [step, setStep] = useState(1);

  // Step 1 - Email
  const [email, setEmail] = useState('');
  const [emailError, setEmailError] = useState<string | null>(null);

  // Step 2 - Password
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);

  // Step 3 - Profile
  const [displayName, setDisplayName] = useState('');
  const [major, setMajor] = useState('');
  const [gradYear, setGradYear] = useState('');

  // Step 4 - Interests
  const [interests, setInterests] = useState<string[]>([]);

  const goBack = () => {
    if (step > 1) {
      setStep(step - 1);
    } else {
      navigation.goBack();
    }
  };

  const canContinue = (): boolean => {
    switch (step) {
      case 1:
        return email.trim().length > 0;
      case 2: {
        const { isValid } = validatePassword(password);
        return isValid && password === confirmPassword;
      }
      case 3:
        return displayName.trim().length > 0;
      case 4:
        return true; // interests are optional
      default:
        return false;
    }
  };

  const handleContinue = async () => {
    clearError();

    if (step === 1) {
      const err = validateUmdEmail(email);
      if (err) {
        setEmailError(err);
        return;
      }
      setEmailError(null);
      setStep(2);
    } else if (step === 2) {
      if (password !== confirmPassword) {
        return;
      }
      setStep(3);
    } else if (step === 3) {
      setStep(4);
    } else if (step === 4) {
      await signUp(email.trim(), password, displayName.trim());
    }
  };

  const toggleInterest = (interest: string) => {
    setInterests((prev) =>
      prev.includes(interest)
        ? prev.filter((i) => i !== interest)
        : [...prev, interest],
    );
  };

  // ── Progress Dots ──────────────────────────────────────────────
  const renderProgressDots = () => (
    <View style={styles.dotsRow}>
      {Array.from({ length: TOTAL_STEPS }, (_, i) => (
        <View
          key={i}
          style={[
            styles.dot,
            i + 1 <= step ? styles.dotActive : styles.dotInactive,
          ]}
        />
      ))}
    </View>
  );

  // ── Step Content ───────────────────────────────────────────────
  const renderStepContent = () => {
    switch (step) {
      case 1:
        return (
          <>
            <Text style={styles.stepTitle}>What's your UMD email?</Text>
            <Text style={styles.stepDescription}>
              We use your @terpmail.umd.edu email to verify you're a Terp.
            </Text>
            <Input
              label="Email"
              value={email}
              onChangeText={(text) => {
                setEmailError(null);
                clearError();
                setEmail(text);
              }}
              placeholder="you@terpmail.umd.edu"
              keyboardType="email-address"
              error={emailError ?? undefined}
              leftIcon={<Ionicons name="mail-outline" size={18} color={colors.text.tertiary} />}
            />
          </>
        );

      case 2:
        return (
          <>
            <Text style={styles.stepTitle}>Create a password</Text>
            <Text style={styles.stepDescription}>
              Make it strong so your account stays safe.
            </Text>
            <Input
              label="Password"
              value={password}
              onChangeText={setPassword}
              placeholder="Create a password"
              secureTextEntry={!showPassword}
              leftIcon={<Ionicons name="lock-closed-outline" size={18} color={colors.text.tertiary} />}
              rightIcon={
                <Pressable onPress={() => setShowPassword((prev) => !prev)} hitSlop={8}>
                  <Ionicons
                    name={showPassword ? 'eye-off-outline' : 'eye-outline'}
                    size={20}
                    color={colors.text.tertiary}
                  />
                </Pressable>
              }
            />
            <PasswordRequirements password={password} />
            <Input
              label="Confirm Password"
              value={confirmPassword}
              onChangeText={setConfirmPassword}
              placeholder="Re-enter your password"
              secureTextEntry={!showConfirm}
              error={
                confirmPassword.length > 0 && password !== confirmPassword
                  ? 'Passwords do not match'
                  : undefined
              }
              leftIcon={<Ionicons name="lock-closed-outline" size={18} color={colors.text.tertiary} />}
              rightIcon={
                <Pressable onPress={() => setShowConfirm((prev) => !prev)} hitSlop={8}>
                  <Ionicons
                    name={showConfirm ? 'eye-off-outline' : 'eye-outline'}
                    size={20}
                    color={colors.text.tertiary}
                  />
                </Pressable>
              }
            />
          </>
        );

      case 3:
        return (
          <>
            <Text style={styles.stepTitle}>Tell us about yourself</Text>
            <Text style={styles.stepDescription}>
              Your display name is how other Terps will see you.
            </Text>
            <Input
              label="Display Name *"
              value={displayName}
              onChangeText={setDisplayName}
              placeholder="e.g. Alex Johnson"
              leftIcon={<Ionicons name="person-outline" size={18} color={colors.text.tertiary} />}
            />
            <Input
              label="Major (optional)"
              value={major}
              onChangeText={setMajor}
              placeholder="e.g. Computer Science"
              leftIcon={<Ionicons name="school-outline" size={18} color={colors.text.tertiary} />}
            />
            <Input
              label="Graduation Year (optional)"
              value={gradYear}
              onChangeText={setGradYear}
              placeholder="e.g. 2027"
              keyboardType="number-pad"
              maxLength={4}
              leftIcon={<Ionicons name="calendar-outline" size={18} color={colors.text.tertiary} />}
            />
          </>
        );

      case 4:
        return (
          <>
            <Text style={styles.stepTitle}>Pick your interests</Text>
            <Text style={styles.stepDescription}>
              Choose topics that excite you. You can change these later.
            </Text>
            <View style={styles.chipGrid}>
              {INTEREST_CATEGORIES.map((interest) => {
                const selected = interests.includes(interest);
                return (
                  <Pressable
                    key={interest}
                    onPress={() => toggleInterest(interest)}
                    style={[styles.chip, selected && styles.chipSelected]}
                  >
                    <Text style={[styles.chipText, selected && styles.chipTextSelected]}>
                      {interest}
                    </Text>
                  </Pressable>
                );
              })}
            </View>
          </>
        );

      default:
        return null;
    }
  };

  const form = (
    <View style={[styles.formWrapper, !isMobile && styles.desktopCard]}>
      {/* Back button + progress */}
      <View style={styles.topRow}>
        <Pressable onPress={goBack} style={styles.backButton} hitSlop={8}>
          <Ionicons name="arrow-back" size={24} color={colors.text.primary} />
        </Pressable>
        {renderProgressDots()}
        <View style={styles.backButton} />
      </View>

      {/* Error */}
      {error ? (
        <View style={styles.errorContainer}>
          <Ionicons name="alert-circle" size={18} color={colors.status.error} />
          <Text style={styles.errorText}>{error}</Text>
        </View>
      ) : null}

      {/* Step content */}
      {renderStepContent()}

      {/* Continue / Create */}
      <Button
        title={step === TOTAL_STEPS ? 'Create Account' : 'Continue'}
        onPress={handleContinue}
        loading={loading}
        disabled={!canContinue()}
        fullWidth
        size="lg"
        style={styles.continueButton}
      />

      {/* Already have account */}
      {step === 1 ? (
        <View style={styles.signInRow}>
          <Text style={styles.signInLabel}>Already have an account? </Text>
          <Pressable onPress={() => navigation.navigate('Login')}>
            <Text style={styles.signInLink}>Sign In</Text>
          </Pressable>
        </View>
      ) : null}
    </View>
  );

  return (
    <SafeAreaView style={styles.safeArea}>
      <KeyboardAvoidingView
        style={styles.flex}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      >
        <ScrollView
          contentContainerStyle={[
            styles.scrollContent,
            !isMobile && styles.desktopScrollContent,
          ]}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
        >
          {form}
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: colors.background.secondary,
  },
  flex: {
    flex: 1,
  },
  scrollContent: {
    flexGrow: 1,
    padding: spacing.md,
  },
  desktopScrollContent: {
    justifyContent: 'center',
    alignItems: 'center',
  },
  formWrapper: {
    width: '100%',
  },
  desktopCard: {
    maxWidth: 440,
    backgroundColor: colors.brand.white,
    borderRadius: borderRadius.lg,
    padding: spacing.xl,
    ...shadows.lg,
  },
  topRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: spacing.lg,
  },
  backButton: {
    width: 40,
    height: 40,
    alignItems: 'center',
    justifyContent: 'center',
  },
  dotsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
  },
  dot: {
    width: 10,
    height: 10,
    borderRadius: 5,
  },
  dotActive: {
    backgroundColor: colors.primary.main,
  },
  dotInactive: {
    backgroundColor: colors.gray[300],
  },
  stepTitle: {
    fontSize: typography.fontSize['2xl'],
    fontWeight: typography.fontWeight.bold,
    color: colors.text.primary,
    marginBottom: spacing.xs,
  },
  stepDescription: {
    fontSize: typography.fontSize.base,
    color: colors.text.secondary,
    lineHeight: 22,
    marginBottom: spacing.lg,
  },
  chipGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.sm,
    marginBottom: spacing.md,
  },
  chip: {
    borderWidth: 1.5,
    borderColor: colors.border.default,
    backgroundColor: colors.brand.white,
    borderRadius: borderRadius.full,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm + 2,
  },
  chipSelected: {
    backgroundColor: colors.primary.main,
    borderColor: colors.primary.main,
  },
  chipText: {
    fontSize: typography.fontSize.md,
    fontWeight: typography.fontWeight.semiBold,
    color: colors.text.secondary,
  },
  chipTextSelected: {
    color: colors.brand.white,
  },
  errorContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.status.errorLight,
    borderRadius: borderRadius.sm,
    padding: spacing.sm,
    marginBottom: spacing.md,
    gap: spacing.sm,
  },
  errorText: {
    flex: 1,
    fontSize: typography.fontSize.md,
    color: colors.status.error,
  },
  continueButton: {
    marginTop: spacing.md,
  },
  signInRow: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: spacing.xl,
  },
  signInLabel: {
    fontSize: typography.fontSize.base,
    color: colors.text.secondary,
  },
  signInLink: {
    fontSize: typography.fontSize.base,
    fontWeight: typography.fontWeight.bold,
    color: colors.primary.main,
  },
});
