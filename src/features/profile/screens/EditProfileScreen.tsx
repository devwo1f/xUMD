import React, { useState } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import Button from '../../../shared/components/Button';
import Input from '../../../shared/components/Input';
import Card from '../../../shared/components/Card';
import ScreenLayout from '../../../shared/components/ScreenLayout';
import Avatar from '../../../shared/components/Avatar';
import { type AvatarUploadAsset, pickAvatarAsset } from '../../../services/profileMedia';
import { useProfile } from '../hooks/useProfile';
import { colors } from '../../../shared/theme/colors';
import { borderRadius, spacing } from '../../../shared/theme/spacing';
import { typography } from '../../../shared/theme/typography';
import type { ProfileStackParamList } from '../../../navigation/types';

type Props = NativeStackScreenProps<ProfileStackParamList, 'EditProfile'>;

export default function EditProfileScreen({ navigation }: Props) {
  const { user, updateProfile, uploadAvatar, loading } = useProfile();
  const [displayName, setDisplayName] = useState(user.displayName);
  const [username, setUsername] = useState(user.username);
  const [major, setMajor] = useState(user.major);
  const [classYear, setClassYear] = useState(String(user.classYear));
  const [bio, setBio] = useState(user.bio);
  const [avatarPreview, setAvatarPreview] = useState(user.avatar);
  const [avatarAsset, setAvatarAsset] = useState<AvatarUploadAsset | null>(null);
  const [avatarRemoved, setAvatarRemoved] = useState(false);
  const [avatarError, setAvatarError] = useState<string | null>(null);

  const handlePickAvatar = async () => {
    setAvatarError(null);
    try {
      const pickedAsset = await pickAvatarAsset();
      if (!pickedAsset) {
        return;
      }

      setAvatarAsset(pickedAsset);
      setAvatarRemoved(false);
      setAvatarPreview(pickedAsset.uri);
    } catch (error) {
      setAvatarError(error instanceof Error ? error.message : 'Unable to choose a photo right now.');
    }
  };

  const handleRemoveAvatar = () => {
    setAvatarAsset(null);
    setAvatarRemoved(true);
    setAvatarPreview('');
    setAvatarError(null);
  };

  const handleSave = async () => {
    await updateProfile({
      displayName: displayName.trim(),
      username: username.trim().replace(/^@/, ''),
      major: major.trim(),
      classYear: Number(classYear),
      bio: bio.trim(),
    });

    if (avatarRemoved) {
      await uploadAvatar(null);
    } else if (avatarAsset) {
      await uploadAvatar(avatarAsset);
    }

    navigation.goBack();
  };

  return (
    <ScreenLayout
      title="Edit Profile"
      subtitle="Update how you show up around campus."
      leftAction={
        <Pressable onPress={() => navigation.goBack()} style={styles.backButton}>
          <Ionicons name="arrow-back" size={20} color={colors.text.primary} />
        </Pressable>
      }
    >
      <Card>
        <View style={styles.avatarSection}>
          <Avatar uri={avatarPreview || null} name={displayName} size="xl" />
          <View style={styles.avatarActions}>
            <Button title={avatarPreview ? 'Change Photo' : 'Choose Photo'} variant="secondary" onPress={() => void handlePickAvatar()} />
            {avatarPreview ? <Button title="Remove" variant="ghost" onPress={handleRemoveAvatar} /> : null}
          </View>
          <Text style={styles.avatarHelper}>Pick a square-friendly image for the cleanest profile card.</Text>
          {avatarError ? <Text style={styles.avatarError}>{avatarError}</Text> : null}
        </View>

        <Input label="Display Name" value={displayName} onChangeText={setDisplayName} />
        <Input label="Username" value={username} onChangeText={setUsername} />
        <Input label="Major" value={major} onChangeText={setMajor} />
        <Input label="Class Year" value={classYear} onChangeText={setClassYear} keyboardType="number-pad" maxLength={4} />
        <Input label="Bio" value={bio} onChangeText={setBio} multiline maxLength={180} />
      </Card>

      <Button title="Save Changes" onPress={handleSave} loading={loading} disabled={!displayName.trim() || !username.trim()} fullWidth />
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
  avatarSection: {
    alignItems: 'center',
    marginBottom: spacing.lg,
  },
  avatarActions: {
    flexDirection: 'row',
    gap: spacing.sm,
    marginTop: spacing.md,
  },
  avatarHelper: {
    marginTop: spacing.sm,
    textAlign: 'center',
    fontSize: typography.fontSize.sm,
    color: colors.text.secondary,
  },
  avatarError: {
    marginTop: spacing.xs,
    textAlign: 'center',
    fontSize: typography.fontSize.sm,
    fontWeight: typography.fontWeight.semiBold,
    color: colors.status.error,
  },
});
