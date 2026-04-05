import React from 'react';
import { Pressable, StyleSheet, Text } from 'react-native';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import Card from '../../../shared/components/Card';
import Button from '../../../shared/components/Button';
import ScreenLayout from '../../../shared/components/ScreenLayout';
import { colors } from '../../../shared/theme/colors';
import { borderRadius, spacing } from '../../../shared/theme/spacing';
import { typography } from '../../../shared/theme/typography';
import type { AuthStackParamList } from '../../../navigation/types';

type Props = NativeStackScreenProps<AuthStackParamList, 'Register'>;

export default function RegisterScreen({ navigation }: Props) {
  return (
    <ScreenLayout title="Passwordless xUMD" subtitle="xUMD now uses a single UMD email plus OTP flow.">
      <Card>
        <Text style={styles.body}>
          Account creation now happens from the main login screen. Enter your @umd.edu or @terpmail.umd.edu email, request a code, and you will continue into onboarding automatically.
        </Text>
        <Button title="Back to login" onPress={() => navigation.navigate('Login')} fullWidth />
      </Card>
      <Pressable onPress={() => navigation.navigate('Login')} style={styles.linkWrap}>
        <Text style={styles.link}>Use the OTP login screen</Text>
      </Pressable>
    </ScreenLayout>
  );
}

const styles = StyleSheet.create({
  body: {
    fontSize: typography.fontSize.base,
    lineHeight: 24,
    color: colors.text.secondary,
    marginBottom: spacing.lg,
  },
  linkWrap: {
    alignSelf: 'center',
    padding: spacing.sm,
  },
  link: {
    fontSize: typography.fontSize.sm,
    fontWeight: typography.fontWeight.semiBold,
    color: colors.primary.main,
  },
});
