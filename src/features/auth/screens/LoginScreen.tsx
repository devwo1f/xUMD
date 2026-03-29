/**
 * LoginScreen
 *
 * Responsive auth screen: centered card on desktop, full screen on mobile.
 * Uses shared Input and Button components, useAuth hook for sign-in.
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
import type { AuthStackParamList } from '../../../navigation/types';

type Props = NativeStackScreenProps<AuthStackParamList, 'Login'>;

export default function LoginScreen({ navigation }: Props) {
  const { signIn, loading, error, clearError } = useAuth();
  const { isMobile } = useResponsive();

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);

  const handleSignIn = async () => {
    clearError();
    await signIn(email.trim(), password);
  };

  const form = (
    <View style={[styles.formWrapper, !isMobile && styles.desktopCard]}>
      {/* Logo */}
      <View style={styles.logoContainer}>
        <Text style={styles.logoText}>xUMD</Text>
        <Text style={styles.subtitle}>Experience UMD</Text>
      </View>

      {/* Error */}
      {error ? (
        <View style={styles.errorContainer}>
          <Ionicons name="alert-circle" size={18} color={colors.status.error} />
          <Text style={styles.errorText}>{error}</Text>
        </View>
      ) : null}

      {/* Email */}
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

      {/* Password */}
      <Input
        label="Password"
        value={password}
        onChangeText={(text) => {
          clearError();
          setPassword(text);
        }}
        placeholder="Enter your password"
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

      {/* Sign In Button */}
      <Button
        title="Sign In"
        onPress={handleSignIn}
        loading={loading}
        disabled={!email.trim() || !password}
        fullWidth
        size="lg"
      />

      {/* Forgot Password */}
      <Pressable
        onPress={() => navigation.navigate('ForgotPassword')}
        style={styles.forgotLink}
      >
        <Text style={styles.forgotText}>Forgot Password?</Text>
      </Pressable>

      {/* Sign Up Link */}
      <View style={styles.signUpRow}>
        <Text style={styles.signUpLabel}>Don't have an account? </Text>
        <Pressable onPress={() => navigation.navigate('Register')}>
          <Text style={styles.signUpLink}>Sign Up</Text>
        </Pressable>
      </View>
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
    paddingTop: spacing.xxl,
  },
  desktopCard: {
    maxWidth: 440,
    backgroundColor: colors.brand.white,
    borderRadius: borderRadius.lg,
    padding: spacing.xl,
    paddingTop: spacing.xxl,
    ...shadows.lg,
  },
  logoContainer: {
    alignItems: 'center',
    marginBottom: spacing.xl,
  },
  logoText: {
    fontSize: typography.fontSize['4xl'],
    fontWeight: typography.fontWeight.extraBold,
    color: colors.primary.main,
    letterSpacing: -1,
  },
  subtitle: {
    fontSize: typography.fontSize.lg,
    color: colors.text.secondary,
    marginTop: spacing.xs,
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
  forgotLink: {
    alignSelf: 'center',
    marginTop: spacing.lg,
    padding: spacing.xs,
  },
  forgotText: {
    fontSize: typography.fontSize.md,
    fontWeight: typography.fontWeight.semiBold,
    color: colors.primary.main,
  },
  signUpRow: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: spacing.xl,
  },
  signUpLabel: {
    fontSize: typography.fontSize.base,
    color: colors.text.secondary,
  },
  signUpLink: {
    fontSize: typography.fontSize.base,
    fontWeight: typography.fontWeight.bold,
    color: colors.primary.main,
  },
});
