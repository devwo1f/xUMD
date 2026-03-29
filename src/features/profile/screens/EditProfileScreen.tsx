import React, { useState } from 'react';
import { Pressable, StyleSheet, Text } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import Button from '../../../shared/components/Button';
import Input from '../../../shared/components/Input';
import Card from '../../../shared/components/Card';
import ScreenLayout from '../../../shared/components/ScreenLayout';
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
  const [avatarUrl, setAvatarUrl] = useState(user.avatar);

  const handleSave = async () => {
    await updateProfile({
      displayName: displayName.trim(),
      username: username.trim().replace(/^@/, ''),
      major: major.trim(),
      classYear: Number(classYear),
      bio: bio.trim(),
    });

    if (avatarUrl.trim() && avatarUrl.trim() !== user.avatar) {
      await uploadAvatar(avatarUrl.trim());
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
        <Input label="Display Name" value={displayName} onChangeText={setDisplayName} />
        <Input label="Username" value={username} onChangeText={setUsername} />
        <Input label="Major" value={major} onChangeText={setMajor} />
        <Input label="Class Year" value={classYear} onChangeText={setClassYear} keyboardType="number-pad" maxLength={4} />
        <Input label="Avatar URL" value={avatarUrl} onChangeText={setAvatarUrl} />
        <Input label="Bio" value={bio} onChangeText={setBio} multiline maxLength={180} />

        <Pressable
          style={styles.helperAction}
          onPress={() => setAvatarUrl(`https://i.pravatar.cc/300?u=${Date.now()}`)}
        >
          <Text style={styles.helperActionText}>Use a fresh placeholder avatar</Text>
        </Pressable>
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
  helperAction: {
    marginTop: spacing.sm,
  },
  helperActionText: {
    fontSize: typography.fontSize.sm,
    fontWeight: typography.fontWeight.semiBold,
    color: colors.primary.main,
  },
});