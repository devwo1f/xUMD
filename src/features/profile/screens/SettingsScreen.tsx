import React from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import Button from '../../../shared/components/Button';
import Card from '../../../shared/components/Card';
import ScreenLayout from '../../../shared/components/ScreenLayout';
import SettingsRow from '../components/SettingsRow';
import { useDemoAppStore } from '../../../shared/stores/useDemoAppStore';
import { useAuth } from '../../auth/hooks/useAuth';
import { isSupabaseConfigured } from '../../../services/supabase';
import { colors } from '../../../shared/theme/colors';
import { borderRadius } from '../../../shared/theme/spacing';
import { typography } from '../../../shared/theme/typography';
import type { ProfileStackParamList } from '../../../navigation/types';

type Props = NativeStackScreenProps<ProfileStackParamList, 'Settings'>;

export default function SettingsScreen({ navigation }: Props) {
  const { settings, updateSetting } = useDemoAppStore();
  const { signOut, loading } = useAuth();

  return (
    <ScreenLayout
      title="Settings"
      subtitle="Personalize notifications and app behavior."
      leftAction={
        <Pressable onPress={() => navigation.goBack()} style={styles.backButton}>
          <Ionicons name="arrow-back" size={20} color={colors.text.primary} />
        </Pressable>
      }
    >
      <Card style={styles.sectionCard}>
        <SettingsRow
          icon="bell-outline"
          label="Push Notifications"
          isToggle
          toggleValue={settings.pushNotifications}
          onToggle={(value) => updateSetting('pushNotifications', value)}
        />
        <SettingsRow
          icon="email-fast-outline"
          label="Email Digest"
          isToggle
          toggleValue={settings.emailDigest}
          onToggle={(value) => updateSetting('emailDigest', value)}
        />
        <SettingsRow
          icon="map-marker-radius-outline"
          label="Location Sharing"
          isToggle
          toggleValue={settings.locationSharing}
          onToggle={(value) => updateSetting('locationSharing', value)}
        />
        <SettingsRow
          icon="shield-check-outline"
          label="Campus Alerts"
          isToggle
          toggleValue={settings.campusAlerts}
          onToggle={(value) => updateSetting('campusAlerts', value)}
        />
      </Card>

      <Card>
        <Text style={styles.sectionTitle}>Backend status</Text>
        <Text style={styles.sectionBody}>
          {isSupabaseConfigured
            ? 'Supabase is configured. Auth will use the live backend.'
            : 'Supabase is not configured yet, so the app is running in a polished demo mode with local state.'}
        </Text>
      </Card>

      {isSupabaseConfigured ? (
        <Button title="Sign Out" onPress={() => void signOut()} loading={loading} variant="secondary" fullWidth />
      ) : null}
    </ScreenLayout>
  );
}

const styles = StyleSheet.create({
  backButton: {
    width: 40,
    height: 40,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: borderRadius.full,
    backgroundColor: colors.background.secondary,
  },
  sectionCard: {
    paddingVertical: 0,
  },
  sectionTitle: {
    fontSize: typography.fontSize.base,
    fontWeight: typography.fontWeight.bold,
    color: colors.text.primary,
    marginBottom: 8,
  },
  sectionBody: {
    fontSize: typography.fontSize.base,
    lineHeight: 24,
    color: colors.text.secondary,
  },
});