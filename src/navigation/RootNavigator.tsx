import React from 'react';
import { ActivityIndicator, StyleSheet, Text, View } from 'react-native';
import MainTabs from './MainTabs';
import AuthNavigator from './AuthNavigator';
import OnboardingNavigator from './OnboardingNavigator';
import { useAuth, useInitializeAuth } from '../features/auth/hooks/useAuth';
import { isSupabaseConfigured } from '../services/supabase';
import { colors } from '../shared/theme/colors';
import { spacing } from '../shared/theme/spacing';
import { typography } from '../shared/theme/typography';

function BootScreen() {
  return (
    <View style={styles.bootScreen}>
      <Text style={styles.logo}>xUMD</Text>
      <Text style={styles.subtitle}>Loading your Maryland experience...</Text>
      <ActivityIndicator size="small" color={colors.primary.main} style={styles.spinner} />
    </View>
  );
}

export default function RootNavigator() {
  useInitializeAuth();
  const { loading, initialized, session, needsProfileCompletion } = useAuth();

  if (isSupabaseConfigured && (!initialized || loading)) {
    return <BootScreen />;
  }

  if (!isSupabaseConfigured) {
    return <MainTabs />;
  }

  if (!session) {
    return <AuthNavigator />;
  }

  if (needsProfileCompletion) {
    return <OnboardingNavigator />;
  }

  return <MainTabs />;
}

const styles = StyleSheet.create({
  bootScreen: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.background.secondary,
    padding: spacing.xl,
  },
  logo: {
    fontSize: typography.fontSize['4xl'],
    fontWeight: typography.fontWeight.extraBold,
    color: colors.primary.main,
    letterSpacing: -1,
  },
  subtitle: {
    fontSize: typography.fontSize.base,
    color: colors.text.secondary,
    marginTop: spacing.sm,
  },
  spinner: {
    marginTop: spacing.lg,
  },
});
