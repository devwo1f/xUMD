import React from 'react';
import { Image, StyleSheet, Text, View } from 'react-native';
import { colors } from '../theme/colors';
import { borderRadius, shadows, spacing } from '../theme/spacing';
import { typography } from '../theme/typography';

const umdSeal = require('../../assets/images/umd-seal.png');

export default function UMDBrandLockup() {
  return (
    <View style={styles.container}>
      <View style={styles.logoFrame}>
        <Image source={umdSeal} style={styles.logo} />
      </View>

      <View style={styles.copy}>
        <View style={styles.wordmarkRow}>
          <Text style={styles.wordmarkAccent}>x</Text>
          <Text style={styles.wordmarkMain}>UMD</Text>
        </View>
        <Text style={styles.subtitle}>University of Maryland</Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    alignSelf: 'flex-start',
  },
  logoFrame: {
    width: 56,
    height: 56,
    borderRadius: borderRadius.xl,
    backgroundColor: colors.brand.white,
    borderWidth: 1,
    borderColor: colors.primary.lightest,
    alignItems: 'center',
    justifyContent: 'center',
    overflow: 'hidden',
    ...shadows.md,
  },
  logo: {
    width: 76,
    height: 76,
  },
  copy: {
    marginLeft: spacing.sm + 2,
  },
  wordmarkRow: {
    flexDirection: 'row',
    alignItems: 'baseline',
  },
  wordmarkAccent: {
    fontSize: typography.fontSize.xl,
    fontWeight: typography.fontWeight.bold,
    color: colors.text.primary,
    letterSpacing: typography.letterSpacing.tight,
  },
  wordmarkMain: {
    fontSize: typography.fontSize['3xl'],
    fontWeight: typography.fontWeight.extraBold,
    color: colors.primary.main,
    letterSpacing: typography.letterSpacing.tight,
    marginLeft: 1,
  },
  subtitle: {
    fontSize: typography.fontSize.xs,
    fontWeight: typography.fontWeight.semiBold,
    letterSpacing: typography.letterSpacing.wide,
    textTransform: 'uppercase',
    color: colors.text.secondary,
    marginTop: -2,
  },
});
