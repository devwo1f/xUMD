import React from 'react';
import { Pressable, StyleSheet, Text } from 'react-native';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import Card from '../../../shared/components/Card';
import Button from '../../../shared/components/Button';
import ScreenLayout from '../../../shared/components/ScreenLayout';
import { colors } from '../../../shared/theme/colors';
import { spacing } from '../../../shared/theme/spacing';
import { typography } from '../../../shared/theme/typography';
import type { AuthStackParamList } from '../../../navigation/types';

type Props = NativeStackScreenProps<AuthStackParamList, 'ForgotPassword'>;

export default function ForgotPasswordScreen({ navigation }: Props) {
  return (
    <ScreenLayout title="No passwords here" subtitle="xUMD now uses one-time verification codes instead of password resets.">
      <Card>
        <Text style={styles.body}>
          If you are trying to sign in again, go back to the login screen and request a fresh 6-digit code with your UMD email.
        </Text>
        <Button title="Back to login" onPress={() => navigation.navigate('Login')} fullWidth />
      </Card>
      <Pressable onPress={() => navigation.navigate('Login')} style={styles.linkWrap}>
        <Text style={styles.link}>Return to OTP login</Text>
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
