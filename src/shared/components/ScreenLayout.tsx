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
import { useResponsive } from '../hooks/useResponsive';
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
  const { isWide, contentMaxWidth, pageHorizontalPadding } = useResponsive();

  const header = (
    <View
      style={[
        styles.header,
        isWide && styles.headerWide,
        { paddingHorizontal: pageHorizontalPadding },
        headerStyle,
      ]}
    >
      {headerTopContent ? <View style={styles.headerTopContent}>{headerTopContent}</View> : null}
      <View style={[styles.headerMainRow, isWide && styles.headerMainRowWide]}>
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
      contentContainerStyle={[styles.scrollContent, isWide && styles.scrollContentWide]}
      showsVerticalScrollIndicator={false}
      keyboardDismissMode="on-drag"
    >
      {header}
      <View
        style={[
          styles.scrollBody,
          isWide && styles.scrollBodyWide,
          { paddingHorizontal: pageHorizontalPadding },
          contentContainerStyle,
        ]}
      >
        {children}
      </View>
    </ScrollView>
  ) : (
    <>
      {header}
      <View
        style={[
          styles.body,
          isWide && styles.bodyWide,
          { paddingHorizontal: pageHorizontalPadding },
          contentContainerStyle,
        ]}
      >
        {children}
      </View>
    </>
  );

  return (
    <SafeAreaView style={styles.safeArea} edges={['top', 'left', 'right']}>
      <ResponsiveContainer maxWidth={Math.max(1280, contentMaxWidth)}>
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
    paddingTop: spacing.md,
    paddingBottom: spacing.sm,
    backgroundColor: colors.brand.white,
    borderBottomLeftRadius: borderRadius.lg,
    borderBottomRightRadius: borderRadius.lg,
  },
  headerWide: {
    paddingTop: spacing.lg,
    paddingBottom: spacing.md,
  },
  headerTopContent: {
    marginBottom: spacing.sm,
  },
  headerMainRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  headerMainRowWide: {
    alignItems: 'flex-start',
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
  scrollContentWide: {
    paddingBottom: spacing.xxl * 1.5,
  },
  scrollBody: {
    paddingVertical: spacing.md,
    gap: spacing.md,
  },
  scrollBodyWide: {
    paddingVertical: spacing.lg,
    gap: spacing.lg,
  },
  body: {
    flex: 1,
    paddingVertical: spacing.md,
  },
  bodyWide: {
    paddingVertical: spacing.lg,
  },
});
