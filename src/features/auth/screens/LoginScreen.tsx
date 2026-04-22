import React, { useEffect, useMemo, useRef, useState } from 'react';
import {
  ActivityIndicator,
  KeyboardAvoidingView,
  Linking,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import { SafeAreaView } from 'react-native-safe-area-context';
import Button from '../../../shared/components/Button';
import Card from '../../../shared/components/Card';
import { useResponsive } from '../../../shared/hooks/useResponsive';
import { colors } from '../../../shared/theme/colors';
import { borderRadius, shadows, spacing } from '../../../shared/theme/spacing';
import { typography } from '../../../shared/theme/typography';
import type { AuthStackParamList } from '../../../navigation/types';
import OtpInput from '../components/OtpInput';
import { OTP_COOLDOWN_SECONDS, useAuth, validateUmdEmail } from '../hooks/useAuth';
import { useAuthFlowStore } from '../stores/authStore';

type Props = NativeStackScreenProps<AuthStackParamList, 'Login'>;

export default function LoginScreen(_props: Props) {
  const { isMobile } = useResponsive();
  const { requestOtp, verifyOtp, loading } = useAuth();
  const { step, loadingStep, email, error, setEmail, setError, setStep, beginLoading, startCooldown, otpCooldownEnd, reset } = useAuthFlowStore();
  const [emailDraft, setEmailDraft] = useState(email);
  const [otpValue, setOtpValue] = useState('');
  const [secondsRemaining, setSecondsRemaining] = useState(0);
  const actionIdRef = useRef(0);

  useEffect(() => {
    setEmailDraft(email);
  }, [email]);

  useEffect(() => {
    if (!otpCooldownEnd) {
      setSecondsRemaining(0);
      return;
    }

    const tick = () => {
      const remaining = Math.max(0, Math.ceil((otpCooldownEnd - Date.now()) / 1000));
      setSecondsRemaining(remaining);
    };

    tick();
    const interval = setInterval(tick, 1000);
    return () => clearInterval(interval);
  }, [otpCooldownEnd]);

  const helperError = useMemo(() => {
    if (step === 'email' && emailDraft.trim().length > 0) {
      return validateUmdEmail(emailDraft).error ?? null;
    }
    return null;
  }, [emailDraft, step]);

  const handleContinue = async () => {
    if (loading && step === 'loading') {
      return;
    }

    const validation = validateUmdEmail(emailDraft);
    if (!validation.valid) {
      setError(validation.error ?? 'Enter a valid UMD email.');
      return;
    }

    const normalizedEmail = emailDraft.trim().toLowerCase();
    const actionId = actionIdRef.current + 1;
    actionIdRef.current = actionId;

    setEmail(normalizedEmail);
    beginLoading('email');

    try {
      await requestOtp(normalizedEmail);
      if (actionId !== actionIdRef.current) {
        return;
      }
      startCooldown(OTP_COOLDOWN_SECONDS);
      setOtpValue('');
      setError(null);
      setStep('otp');
    } catch (authError) {
      if (actionId !== actionIdRef.current) {
        return;
      }
      setError(authError instanceof Error ? authError.message : 'Unable to send code.');
      setStep('email');
    }
  };

  const handleVerify = async (value = otpValue) => {
    if (loading && step === 'loading') {
      return;
    }

    if (value.trim().length !== 6) {
      setError('Enter the 6-digit code from your email.');
      return;
    }

    const actionId = actionIdRef.current + 1;
    actionIdRef.current = actionId;

    beginLoading('otp');
    try {
      await verifyOtp(email, value);
      if (actionId !== actionIdRef.current) {
        return;
      }
      setError(null);
      reset();
    } catch (authError) {
      if (actionId !== actionIdRef.current) {
        return;
      }
      setError(authError instanceof Error ? authError.message : 'Invalid code.');
      setStep('otp');
    }
  };

  const handleResend = async () => {
    if (secondsRemaining > 0 || (loading && step === 'loading')) {
      return;
    }

    const actionId = actionIdRef.current + 1;
    actionIdRef.current = actionId;

    beginLoading('otp');
    try {
      await requestOtp(email);
      if (actionId !== actionIdRef.current) {
        return;
      }
      startCooldown(OTP_COOLDOWN_SECONDS);
      setOtpValue('');
      setError(null);
      setStep('otp');
    } catch (authError) {
      if (actionId !== actionIdRef.current) {
        return;
      }
      setError(authError instanceof Error ? authError.message : 'Unable to resend code.');
      setStep('otp');
    }
  };

  const goBackToEmail = () => {
    setOtpValue('');
    setStep('email');
    setError(null);
  };

  const activeStep = step === 'loading' ? loadingStep : step;

  return (
    <SafeAreaView style={styles.safeArea}>
      <KeyboardAvoidingView style={styles.flex} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
        <ScrollView
          contentContainerStyle={[styles.scrollContent, !isMobile && styles.desktopScrollContent]}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
        >
          <Card style={[styles.card, !isMobile && styles.desktopCard]}>
            {activeStep === 'otp' ? (
              <Pressable onPress={goBackToEmail} style={styles.backButton} accessibilityLabel="Back to email step">
                <Ionicons name="arrow-back" size={20} color={colors.text.primary} />
              </Pressable>
            ) : null}

            <View style={styles.logoWrap}>
              <Text style={styles.logo}>xUMD</Text>
              <Text style={styles.tagline}>Experience Your Campus</Text>
            </View>

            {activeStep === 'email' ? (
              <>
                <Text style={styles.title}>Sign in with your UMD email</Text>
                <Text style={styles.subtitle}>No password needed. We will send a 6-digit code to your inbox.</Text>

                <View style={styles.inputGroup}>
                  <Text style={styles.label}>Email</Text>
                  <TextInput
                    value={emailDraft}
                    onChangeText={(text) => {
                      setEmailDraft(text);
                      if (error) {
                        setError(null);
                      }
                    }}
                    placeholder="you@umd.edu"
                    placeholderTextColor={colors.text.tertiary}
                    keyboardType="email-address"
                    autoCapitalize="none"
                    autoCorrect={false}
                    style={styles.input}
                    accessibilityLabel="UMD email address"
                  />
                  <Text style={styles.helperText}>Only @umd.edu and @terpmail.umd.edu can sign in.</Text>
                </View>

                {error || helperError ? (
                  <Text style={styles.errorText} accessibilityLiveRegion="polite">
                    {error ?? helperError}
                  </Text>
                ) : null}

                <Button
                  title="Continue"
                  onPress={() => void handleContinue()}
                  disabled={!emailDraft.trim() || Boolean(helperError)}
                  loading={loading && step === 'loading'}
                  fullWidth
                  size="lg"
                />

                <Text style={styles.footerText}>
                  By continuing, you agree to our{' '}
                  <Text style={styles.footerLink} onPress={() => void Linking.openURL('https://umd.edu')}>
                    Terms
                  </Text>{' '}
                  and{' '}
                  <Text style={styles.footerLink} onPress={() => void Linking.openURL('https://umd.edu')}>
                    Privacy Policy
                  </Text>
                  .
                </Text>
              </>
            ) : (
              <>
                <Text style={styles.title}>Check your email</Text>
                <Text style={styles.subtitle}>We sent a 6-digit code to</Text>
                <Pressable onPress={goBackToEmail} accessibilityLabel="Change email address">
                  <Text style={styles.emailPill}>{email}</Text>
                </Pressable>

                <OtpInput
                  value={otpValue}
                  onChange={(next) => {
                    setOtpValue(next);
                    if (error) {
                      setError(null);
                    }
                  }}
                  onComplete={(next) => {
                    setOtpValue(next);
                    void handleVerify(next);
                  }}
                  disabled={loading && step === 'loading'}
                />

                <Text style={styles.helperText}>Code expires in 10 minutes.</Text>
                <Text style={styles.helperText}>The newest code replaces any earlier code.</Text>

                <View style={styles.resendRow}>
                  <Text style={styles.resendPrompt}>Did not get the code?</Text>
                  <Pressable onPress={() => void handleResend()} disabled={secondsRemaining > 0}>
                    <Text style={[styles.resendLink, secondsRemaining > 0 && styles.resendLinkDisabled]}>
                      {secondsRemaining > 0 ? `Resend in 0:${String(secondsRemaining).padStart(2, '0')}` : 'Resend'}
                    </Text>
                  </Pressable>
                </View>

                {error ? (
                  <Text style={styles.errorText} accessibilityLiveRegion="polite">
                    {error}
                  </Text>
                ) : null}

                <Button
                  title="Verify"
                  onPress={() => void handleVerify()}
                  disabled={otpValue.length !== 6}
                  loading={loading && step === 'loading'}
                  fullWidth
                  size="lg"
                />

                <Text style={styles.footerText}>Check your spam folder if you do not see the email right away.</Text>
              </>
            )}
          </Card>
        </ScrollView>
      </KeyboardAvoidingView>

      {loading && step === 'loading' ? (
        <View style={styles.loadingOverlay}>
          <View style={styles.loadingCard}>
            <ActivityIndicator size="small" color={colors.primary.main} />
            <Text style={styles.loadingLabel}>Working on it...</Text>
          </View>
        </View>
      ) : null}
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
    padding: spacing.lg,
    justifyContent: 'center',
  },
  desktopScrollContent: {
    alignItems: 'center',
  },
  card: {
    width: '100%',
    padding: spacing.xl,
    borderRadius: borderRadius.xl,
    backgroundColor: colors.brand.white,
    borderWidth: 1,
    borderColor: colors.border.light,
    ...shadows.lg,
  },
  desktopCard: {
    maxWidth: 460,
  },
  backButton: {
    width: 40,
    height: 40,
    borderRadius: borderRadius.full,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.background.secondary,
    marginBottom: spacing.md,
  },
  logoWrap: {
    alignItems: 'center',
    marginBottom: spacing.xl,
  },
  logo: {
    fontSize: typography.fontSize['4xl'],
    fontWeight: typography.fontWeight.extraBold,
    color: colors.primary.main,
    letterSpacing: -1,
  },
  tagline: {
    marginTop: spacing.xs,
    fontSize: typography.fontSize.base,
    color: colors.text.secondary,
  },
  title: {
    fontSize: typography.fontSize['2xl'],
    fontWeight: typography.fontWeight.bold,
    color: colors.text.primary,
    textAlign: 'center',
  },
  subtitle: {
    marginTop: spacing.sm,
    marginBottom: spacing.lg,
    fontSize: typography.fontSize.base,
    lineHeight: 24,
    color: colors.text.secondary,
    textAlign: 'center',
  },
  inputGroup: {
    marginBottom: spacing.md,
  },
  label: {
    marginBottom: spacing.xs,
    fontSize: typography.fontSize.sm,
    fontWeight: typography.fontWeight.semiBold,
    color: colors.text.secondary,
  },
  input: {
    minHeight: 54,
    borderRadius: borderRadius.lg,
    borderWidth: 1,
    borderColor: colors.border.default,
    backgroundColor: colors.brand.white,
    paddingHorizontal: spacing.md,
    fontSize: typography.fontSize.base,
    color: colors.text.primary,
  },
  helperText: {
    marginTop: spacing.sm,
    fontSize: typography.fontSize.sm,
    color: colors.text.secondary,
    textAlign: 'center',
  },
  errorText: {
    marginBottom: spacing.md,
    fontSize: typography.fontSize.sm,
    fontWeight: typography.fontWeight.semiBold,
    color: colors.status.error,
    textAlign: 'center',
  },
  footerText: {
    marginTop: spacing.lg,
    fontSize: typography.fontSize.sm,
    lineHeight: 22,
    color: colors.text.secondary,
    textAlign: 'center',
  },
  footerLink: {
    color: colors.primary.main,
    fontWeight: typography.fontWeight.semiBold,
  },
  emailPill: {
    alignSelf: 'center',
    marginBottom: spacing.lg,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    borderRadius: borderRadius.full,
    backgroundColor: colors.primary.lightest,
    color: colors.primary.main,
    fontWeight: typography.fontWeight.bold,
  },
  resendRow: {
    alignItems: 'center',
    gap: spacing.xs,
    marginTop: spacing.md,
    marginBottom: spacing.md,
  },
  resendPrompt: {
    fontSize: typography.fontSize.sm,
    color: colors.text.secondary,
  },
  resendLink: {
    fontSize: typography.fontSize.sm,
    fontWeight: typography.fontWeight.semiBold,
    color: colors.primary.main,
  },
  resendLinkDisabled: {
    color: colors.text.tertiary,
  },
  loadingOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(17, 24, 39, 0.18)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  loadingCard: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.md,
    borderRadius: borderRadius.full,
    backgroundColor: colors.brand.white,
    ...shadows.md,
  },
  loadingLabel: {
    fontSize: typography.fontSize.base,
    fontWeight: typography.fontWeight.semiBold,
    color: colors.text.primary,
  },
});
