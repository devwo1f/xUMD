/**
 * ForgotPasswordScreen
 *
 * Email input, "Send Reset Link" button, and success state with
 * "Check your email" message. Back to login link.
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
import { useAuth, useAuthStore } from '../hooks/useAuth';
import type { AuthStackParamList } from '../../../navigation/types';

type Props = NativeStackScreenProps<AuthStackParamList, 'ForgotPassword'>;

export default function ForgotPasswordScreen({ navigation }: Props) {
  const { resetPassword, loading, error, clearError } = useAuth();
  const { isMobile } = useResponsive();

  const [email, setEmail] = useState('');
  const [sent, setSent] = useState(false);

  const handleSend = async () => {
    clearError();
    await resetPassword(email.trim());
    if (!useAuthStore.getState().error) {
      setSent(true);
    }
  };

  const form = (
    <View style={[styles.formWrapper, !isMobile && styles.desktopCard]}>
      {/* Back */}
      <Pressable onPress={() => navigation.goBack()} style={styles.backButton} hitSlop={8}>
        <Ionicons name="arrow-back" size={24} color={colors.text.primary} />
      </Pressable>

      {sent ? (
        /* ── Success State ── */
        <View style={styles.successContainer}>
          <View style={styles.successIconWrap}>
            <Ionicons name="mail-open-outline" size={48} color={colors.primary.main} />
          </View>
          <Text style={styles.successTitle}>Check your email</Text>
          <Text style={styles.successDescription}>
            We sent a password reset link to{'\n'}
            <Text style={styles.emailHighlight}>{email.trim()}</Text>
          </Text>
          <Text style={styles.successHint}>
            Didn't receive it? Check your spam folder or try again.
          </Text>
          <Button
            title="Back to Sign In"
            onPress={() => navigation.navigate('Login')}
            fullWidth
            size="lg"
            style={styles.actionButton}
          />
          <Pressable
            onPress={() => {
              setSent(false);
              clearError();
            }}
            style={styles.retryLink}
          >
            <Text style={styles.retryText}>Try a different email</Text>
          </Pressable>
        </View>
      ) : (
        /* ── Form State ── */
        <>
          <Text style={styles.title}>Forgot your password?</Text>
          <Text style={styles.description}>
            Enter the email address you used to sign up and we'll send you a
            link to reset your password.
          </Text>

          {error ? (
            <View style={styles.errorContainer}>
              <Ionicons name="alert-circle" size={18} color={colors.status.error} />
              <Text style={styles.errorText}>{error}</Text>
            </View>
          ) : null}

          <Input
            label="Email"
            value={email}
            onChangeText={(text) => {
              clearError();
              setEmail(text);
            }}
            placeholder="you@terpmail.umd.edu"
            keyboardType="email-address"
            leftIcon={<Ionicons name="mail-outline" size={18} color={colors.text.tertiary} />}
          />

          <Button
            title="Send Reset Link"
            onPress={handleSend}
            loading={loading}
            disabled={!email.trim()}
            fullWidth
            size="lg"
            style={styles.actionButton}
          />

          <View style={styles.signInRow}>
            <Text style={styles.signInLabel}>Remember your password? </Text>
            <Pressable onPress={() => navigation.navigate('Login')}>
              <Text style={styles.signInLink}>Sign In</Text>
            </Pressable>
          </View>
        </>
      )}
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
  backButton: {
    width: 40,
    height: 40,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: spacing.md,
  },
  title: {
    fontSize: typography.fontSize['2xl'],
    fontWeight: typography.fontWeight.bold,
    color: colors.text.primary,
    marginBottom: spacing.xs,
  },
  description: {
    fontSize: typography.fontSize.base,
    color: colors.text.secondary,
    lineHeight: 22,
    marginBottom: spacing.lg,
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
  actionButton: {
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
  // Success state
  successContainer: {
    alignItems: 'center',
    paddingTop: spacing.lg,
  },
  successIconWrap: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: colors.primary.lightest,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: spacing.lg,
  },
  successTitle: {
    fontSize: typography.fontSize['2xl'],
    fontWeight: typography.fontWeight.bold,
    color: colors.text.primary,
    marginBottom: spacing.sm,
  },
  successDescription: {
    fontSize: typography.fontSize.base,
    color: colors.text.secondary,
    textAlign: 'center',
    lineHeight: 22,
  },
  emailHighlight: {
    fontWeight: typography.fontWeight.semiBold,
    color: colors.text.primary,
  },
  successHint: {
    fontSize: typography.fontSize.sm,
    color: colors.text.tertiary,
    textAlign: 'center',
    marginTop: spacing.md,
    marginBottom: spacing.lg,
  },
  retryLink: {
    marginTop: spacing.lg,
    padding: spacing.xs,
  },
  retryText: {
    fontSize: typography.fontSize.md,
    fontWeight: typography.fontWeight.semiBold,
    color: colors.primary.main,
  },
});
