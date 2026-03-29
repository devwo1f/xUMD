import React from 'react';
import {
  ScrollView,
  StyleProp,
  StyleSheet,
  Text,
  View,
  ViewStyle,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import ResponsiveContainer from './ResponsiveContainer';
import { colors } from '../theme/colors';
import { borderRadius, spacing } from '../theme/spacing';
import { typography } from '../theme/typography';

interface ScreenLayoutProps {
  title: string;
  subtitle?: string;
  leftAction?: React.ReactNode;
  rightAction?: React.ReactNode;
  headerTopContent?: React.ReactNode;
  headerMetaContent?: React.ReactNode;
  children: React.ReactNode;
  scroll?: boolean;
  contentContainerStyle?: StyleProp<ViewStyle>;
  headerStyle?: StyleProp<ViewStyle>;
}

export default function ScreenLayout({
  title,
  subtitle,
  leftAction,
  rightAction,
  headerTopContent,
  headerMetaContent,
  children,
  scroll = true,
  contentContainerStyle,
  headerStyle,
}: ScreenLayoutProps) {
  const header = (
    <View style={[styles.header, headerStyle]}>
      {headerTopContent ? <View style={styles.headerTopContent}>{headerTopContent}</View> : null}
      <View style={styles.headerMainRow}>
        {leftAction ? <View style={styles.leftAction}>{leftAction}</View> : null}
        <View style={styles.headerCopy}>
          {headerMetaContent ? <View style={styles.headerMetaContent}>{headerMetaContent}</View> : null}
          <Text style={styles.title}>{title}</Text>
          {subtitle ? <Text style={styles.subtitle}>{subtitle}</Text> : null}
        </View>
        {rightAction ? <View style={styles.rightAction}>{rightAction}</View> : null}
      </View>
    </View>
  );

  const body = scroll ? (
    <ScrollView
      contentContainerStyle={styles.scrollContent}
      showsVerticalScrollIndicator={false}
    >
      {header}
      <View style={[styles.scrollBody, contentContainerStyle]}>{children}</View>
    </ScrollView>
  ) : (
    <>
      {header}
      <View style={[styles.body, contentContainerStyle]}>{children}</View>
    </>
  );

  return (
    <SafeAreaView style={styles.safeArea} edges={['top']}>
      <ResponsiveContainer maxWidth={1280}>
        {body}
      </ResponsiveContainer>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: colors.background.secondary,
  },
  header: {
    paddingHorizontal: spacing.md,
    paddingTop: spacing.md,
    paddingBottom: spacing.sm,
    backgroundColor: colors.brand.white,
    borderBottomLeftRadius: borderRadius.lg,
    borderBottomRightRadius: borderRadius.lg,
  },
  headerTopContent: {
    marginBottom: spacing.sm,
  },
  headerMainRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  headerCopy: {
    flex: 1,
    justifyContent: 'center',
    paddingVertical: spacing.xs,
  },
  headerMetaContent: {
    marginBottom: spacing.sm,
  },
  leftAction: {
    marginRight: spacing.sm,
  },
  rightAction: {
    marginLeft: spacing.sm,
  },
  title: {
    fontSize: typography.fontSize['2xl'],
    fontWeight: typography.fontWeight.bold,
    letterSpacing: typography.letterSpacing.tight,
    color: colors.text.primary,
  },
  subtitle: {
    fontSize: typography.fontSize.base,
    color: colors.text.secondary,
    lineHeight: 22,
    marginTop: 2,
  },
  scrollContent: {
    paddingBottom: spacing.xxl + spacing.lg,
  },
  scrollBody: {
    padding: spacing.md,
    gap: spacing.md,
  },
  body: {
    flex: 1,
    padding: spacing.md,
  },
});
