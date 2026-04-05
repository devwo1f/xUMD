import React, { useEffect, useMemo, useState } from 'react';
import {
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  SafeAreaView,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import { Ionicons } from '@expo/vector-icons';
import Button from '../../../shared/components/Button';
import Card from '../../../shared/components/Card';
import Avatar from '../../../shared/components/Avatar';
import { colors } from '../../../shared/theme/colors';
import { borderRadius, shadows, spacing } from '../../../shared/theme/spacing';
import { typography } from '../../../shared/theme/typography';
import type { DegreeType } from '../../../shared/types';
import type { OnboardingStackParamList } from '../../../navigation/types';
import { checkUsernameAvailability, searchCourses, type CourseSearchResult } from '../../../services/auth';
import { pickAvatarAsset, uploadAvatarAsset } from '../../../services/profileMedia';
import { sanitizeUsername, useAuth } from '../hooks/useAuth';

const DEGREE_OPTIONS: Array<{ value: DegreeType; label: string }> = [
  { value: 'bs', label: 'BS' },
  { value: 'ba', label: 'BA' },
  { value: 'ms', label: 'MS' },
  { value: 'phd', label: 'PhD' },
  { value: 'mba', label: 'MBA' },
  { value: 'other', label: 'Other' },
];

const MAJORS = [
  'Computer Science',
  'Data Science',
  'Information Science',
  'Electrical Engineering',
  'Mechanical Engineering',
  'Civil Engineering',
  'Bioengineering',
  'Business',
  'Economics',
  'Mathematics',
  'Physics',
  'Chemistry',
  'Biology',
  'Psychology',
  'English',
  'Journalism',
  'Government and Politics',
  'Architecture',
  'Public Health Science',
  'Kinesiology',
];

const INTEREST_OPTIONS = [
  'Sports',
  'Music',
  'Tech',
  'Dance',
  'Food',
  'Gaming',
  'Art',
  'Fitness',
  'Career',
  'Greek Life',
  'Social',
  'Academic',
  'Film',
  'Travel',
];

type Props = NativeStackScreenProps<OnboardingStackParamList, 'ProfileCompletion'>;

function formatCourseSubtitle(course: CourseSearchResult) {
  const dayLabel = (course.meeting_days ?? []).join('');
  const timeLabel = course.start_time && course.end_time ? `${course.start_time.slice(0, 5)}-${course.end_time.slice(0, 5)}` : null;
  const placeLabel = [course.building_name, course.room_number].filter(Boolean).join(' ');

  return [dayLabel || null, timeLabel, placeLabel || null].filter(Boolean).join(' · ');
}

export default function ProfileCompletionScreen(_props: Props) {
  const { user, loading, saveOnboardingProgress, completeProfile } = useAuth();
  const initialStep = Math.min(4, Math.max(1, (user?.onboarding_step ?? 0) + 1));
  const [step, setStep] = useState(initialStep);
  const [displayName, setDisplayName] = useState(user?.display_name ?? '');
  const [username, setUsername] = useState(user?.username ?? '');
  const [avatarUrl, setAvatarUrl] = useState(user?.avatar_url ?? '');
  const [bio, setBio] = useState(user?.bio ?? '');
  const [degreeType, setDegreeType] = useState<DegreeType | null>((user?.degree_type as DegreeType | null) ?? null);
  const [majorQuery, setMajorQuery] = useState(user?.major ?? '');
  const [selectedMajor, setSelectedMajor] = useState(user?.major ?? '');
  const [graduationYear, setGraduationYear] = useState(user?.graduation_year ? String(user.graduation_year) : '2028');
  const [minor, setMinor] = useState(user?.minor ?? '');
  const [courseQuery, setCourseQuery] = useState('');
  const [selectedCourses, setSelectedCourses] = useState<string[]>(user?.courses ?? []);
  const [courseSuggestions, setCourseSuggestions] = useState<CourseSearchResult[]>([]);
  const [selectedInterests, setSelectedInterests] = useState<string[]>(user?.interests ?? []);
  const [error, setError] = useState<string | null>(null);
  const [avatarError, setAvatarError] = useState<string | null>(null);
  const [uploadingAvatar, setUploadingAvatar] = useState(false);
  const [checkingUsername, setCheckingUsername] = useState(false);
  const [usernameState, setUsernameState] = useState<{ available: boolean; message: string | null; suggestion?: string }>({
    available: true,
    message: null,
  });

  useEffect(() => {
    let isActive = true;
    const clean = sanitizeUsername(username);

    if (clean.length < 3) {
      setUsernameState({ available: false, message: 'Username must be at least 3 characters.' });
      return () => {
        isActive = false;
      };
    }

    const timeout = setTimeout(async () => {
      setCheckingUsername(true);
      try {
        const result = await checkUsernameAvailability(clean, user?.id);
        if (!isActive) {
          return;
        }

        const nextMessage = !result.available && result.suggestion
          ? `${result.message} Try @${result.suggestion}.`
          : result.message;

        setUsernameState({
          available: result.available,
          message: nextMessage,
          suggestion: result.suggestion,
        });
      } catch {
        if (isActive) {
          setUsernameState({ available: true, message: null });
        }
      } finally {
        if (isActive) {
          setCheckingUsername(false);
        }
      }
    }, 250);

    return () => {
      isActive = false;
      clearTimeout(timeout);
    };
  }, [username, user?.id]);

  useEffect(() => {
    let isActive = true;
    const query = courseQuery.trim();

    if (query.length < 2) {
      setCourseSuggestions([]);
      return () => {
        isActive = false;
      };
    }

    const timeout = setTimeout(async () => {
      try {
        const results = await searchCourses(query);
        if (isActive) {
          setCourseSuggestions(results);
        }
      } catch {
        if (isActive) {
          setCourseSuggestions([]);
        }
      }
    }, 220);

    return () => {
      isActive = false;
      clearTimeout(timeout);
    };
  }, [courseQuery]);

  const majorSuggestions = useMemo(
    () => MAJORS.filter((entry) => entry.toLowerCase().includes(majorQuery.toLowerCase())).slice(0, 6),
    [majorQuery],
  );

  const addCourse = (course: CourseSearchResult) => {
    if (!course.course_code || selectedCourses.includes(course.course_code)) {
      return;
    }

    setSelectedCourses((current) => [...current, course.course_code]);
    setCourseQuery('');
    setCourseSuggestions([]);
  };

  const toggleInterest = (interest: string) => {
    setSelectedInterests((current) =>
      current.includes(interest) ? current.filter((item) => item !== interest) : [...current, interest],
    );
  };

  const handlePickAvatar = async () => {
    setAvatarError(null);

    try {
      const asset = await pickAvatarAsset();
      if (!asset) {
        return;
      }

      if (!user?.id) {
        setAvatarUrl(asset.uri);
        return;
      }

      setUploadingAvatar(true);
      const uploadedUrl = await uploadAvatarAsset(user.id, asset);
      setAvatarUrl(uploadedUrl);
    } catch (pickError) {
      setAvatarError(pickError instanceof Error ? pickError.message : 'Unable to upload profile photo right now.');
    } finally {
      setUploadingAvatar(false);
    }
  };

  const removeAvatar = () => {
    setAvatarUrl('');
    setAvatarError(null);
  };

  const saveStep = async (nextStep: number) => {
    await saveOnboardingProgress({
      display_name: displayName.trim(),
      username: sanitizeUsername(username),
      avatar_url: avatarUrl.trim() || null,
      bio: bio.trim() || null,
      degree_type: degreeType,
      major: selectedMajor || null,
      graduation_year: Number(graduationYear) || null,
      minor: minor.trim() || null,
      courses: selectedCourses,
      interests: selectedInterests,
      onboarding_step: nextStep,
    });
  };

  const handleNext = async () => {
    setError(null);

    if (step === 1) {
      if (!displayName.trim()) {
        setError('Display name is required.');
        return;
      }
      if (!sanitizeUsername(username) || !usernameState.available) {
        setError(usernameState.message ?? 'Choose an available username.');
        return;
      }
      await saveStep(1);
      setStep(2);
      return;
    }

    if (step === 2) {
      if (!selectedMajor || !graduationYear.trim()) {
        setError('Major and graduation year are required.');
        return;
      }
      await saveStep(2);
      setStep(3);
      return;
    }

    if (step === 3) {
      await saveStep(3);
      setStep(4);
      return;
    }
  };

  const handleSkip = async () => {
    setError(null);
    if (step === 3) {
      await saveStep(3);
      setStep(4);
      return;
    }

    if (step === 4) {
      await handleFinish();
    }
  };

  const handleFinish = async () => {
    setError(null);
    try {
      await completeProfile({
        display_name: displayName.trim(),
        username: sanitizeUsername(username),
        avatar_url: avatarUrl.trim() || null,
        bio: bio.trim() || null,
        degree_type: degreeType,
        major: selectedMajor || null,
        graduation_year: Number(graduationYear) || null,
        minor: minor.trim() || null,
        courses: selectedCourses,
        interests: selectedInterests,
      });
    } catch (completionError) {
      setError(completionError instanceof Error ? completionError.message : 'Unable to finish onboarding.');
    }
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      <KeyboardAvoidingView style={styles.flex} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
        <ScrollView contentContainerStyle={styles.scrollContent} keyboardShouldPersistTaps="handled">
          <View style={styles.headerRow}>
            <Text style={styles.stepText}>Step {step} of 4</Text>
            {step >= 3 ? (
              <Pressable onPress={() => void handleSkip()}>
                <Text style={styles.skipText}>Skip</Text>
              </Pressable>
            ) : <View />}
          </View>

          <Card style={styles.card}>
            <View style={styles.heroRow}>
              <Avatar uri={(avatarUrl || user?.avatar_url) ?? null} name={displayName || user?.display_name || 'Terp'} size="xl" />
              <View style={styles.heroCopy}>
                <Text style={styles.title}>Finish your xUMD profile</Text>
                <Text style={styles.subtitle}>We will use this to personalize your campus feed, search, and recommendations.</Text>
              </View>
            </View>

            {step === 1 ? (
              <View style={styles.section}>
                <Text style={styles.sectionTitle}>How should campus see you?</Text>
                <View style={styles.avatarUploadCard}>
                  <Text style={styles.label}>Profile Photo (optional)</Text>
                  <View style={styles.avatarUploadRow}>
                    <Avatar uri={avatarUrl || null} name={displayName || user?.display_name || 'Terp'} size="lg" />
                    <View style={styles.avatarUploadActions}>
                      <Button title={avatarUrl ? 'Change Photo' : 'Choose Photo'} variant="secondary" onPress={() => void handlePickAvatar()} loading={uploadingAvatar} />
                      {avatarUrl ? <Button title="Remove" variant="ghost" onPress={removeAvatar} /> : null}
                    </View>
                  </View>
                  <Text style={styles.helper}>A clean square image works best for cards and comments across the app.</Text>
                  {avatarError ? <Text style={styles.errorText}>{avatarError}</Text> : null}
                </View>
                <LabeledField label="Display Name" value={displayName} onChangeText={setDisplayName} placeholder="Abhay Kumar" />
                <LabeledField label="Username" value={username} onChangeText={setUsername} placeholder="abhay_terp" autoCapitalize="none" />
                <Text style={[styles.helper, !usernameState.available && styles.helperError]}>
                  {checkingUsername ? 'Checking username...' : usernameState.message ?? 'Use lowercase letters, numbers, and underscores.'}
                </Text>
                <LabeledField label="Bio (optional)" value={bio} onChangeText={setBio} placeholder="CS grad student, basketball fan, always looking for coffee." multiline />
              </View>
            ) : null}

            {step === 2 ? (
              <View style={styles.section}>
                <Text style={styles.sectionTitle}>What are you studying?</Text>
                <Text style={styles.label}>Degree Type</Text>
                <View style={styles.optionRow}>
                  {DEGREE_OPTIONS.map((option) => {
                    const selected = degreeType === option.value;
                    return (
                      <Pressable key={option.value} onPress={() => setDegreeType(option.value)} style={[styles.optionChip, selected && styles.optionChipSelected]}>
                        <Text style={[styles.optionChipLabel, selected && styles.optionChipLabelSelected]}>{option.label}</Text>
                      </Pressable>
                    );
                  })}
                </View>
                <LabeledField label="Major" value={majorQuery} onChangeText={(value) => { setMajorQuery(value); setSelectedMajor(value); }} placeholder="Search majors..." />
                {majorSuggestions.length > 0 ? (
                  <View style={styles.suggestionList}>
                    {majorSuggestions.map((entry) => (
                      <Pressable key={entry} onPress={() => { setMajorQuery(entry); setSelectedMajor(entry); }} style={styles.suggestionRow}>
                        <Text style={styles.suggestionLabel}>{entry}</Text>
                      </Pressable>
                    ))}
                  </View>
                ) : null}
                <LabeledField label="Expected Graduation Year" value={graduationYear} onChangeText={setGraduationYear} placeholder="2028" keyboardType="number-pad" />
                <LabeledField label="Minor (optional)" value={minor} onChangeText={setMinor} placeholder="Statistics" />
              </View>
            ) : null}

            {step === 3 ? (
              <View style={styles.section}>
                <Text style={styles.sectionTitle}>What are you taking this semester?</Text>
                <LabeledField label="Search courses" value={courseQuery} onChangeText={setCourseQuery} placeholder="CMSC330" autoCapitalize="characters" />
                {courseSuggestions.length > 0 ? (
                  <View style={styles.suggestionList}>
                    {courseSuggestions.map((course) => (
                      <Pressable key={course.id} onPress={() => addCourse(course)} style={styles.suggestionRow}>
                        <Text style={styles.suggestionLabel}>{course.course_code} · {course.section} · {course.title}</Text>
                        <Text style={styles.suggestionMeta}>{formatCourseSubtitle(course)}</Text>
                      </Pressable>
                    ))}
                  </View>
                ) : null}
                <View style={styles.tagWrap}>
                  {selectedCourses.map((course) => (
                    <View key={course} style={styles.selectedTag}>
                      <Text style={styles.selectedTagLabel}>{course}</Text>
                      <Pressable onPress={() => setSelectedCourses((current) => current.filter((item) => item !== course))}>
                        <Ionicons name="close" size={14} color={colors.primary.main} />
                      </Pressable>
                    </View>
                  ))}
                </View>
              </View>
            ) : null}

            {step === 4 ? (
              <View style={styles.section}>
                <Text style={styles.sectionTitle}>What are you into?</Text>
                <Text style={styles.helper}>Pick a few so xUMD can personalize your feed and recommendations.</Text>
                <View style={styles.optionRow}>
                  {INTEREST_OPTIONS.map((interest) => {
                    const selected = selectedInterests.includes(interest);
                    return (
                      <Pressable key={interest} onPress={() => toggleInterest(interest)} style={[styles.optionChip, selected && styles.optionChipSelected]}>
                        <Text style={[styles.optionChipLabel, selected && styles.optionChipLabelSelected]}>{interest}</Text>
                      </Pressable>
                    );
                  })}
                </View>
              </View>
            ) : null}

            {error ? <Text style={styles.errorText}>{error}</Text> : null}

            <View style={styles.footerRow}>
              {step > 1 ? (
                <Button title="Back" variant="ghost" onPress={() => setStep((current) => Math.max(1, current - 1))} />
              ) : <View />}
              {step < 4 ? (
                <Button title="Next" onPress={() => void handleNext()} loading={loading} />
              ) : (
                <Button title="Let's go" onPress={() => void handleFinish()} loading={loading} />
              )}
            </View>
          </Card>
        </ScrollView>
      </KeyboardAvoidingView>

      {(loading || uploadingAvatar) ? (
        <View style={styles.loadingOverlay}>
          <View style={styles.loadingCard}>
            <ActivityIndicator size="small" color={colors.primary.main} />
            <Text style={styles.loadingLabel}>{uploadingAvatar ? 'Uploading your photo...' : 'Saving your profile...'}</Text>
          </View>
        </View>
      ) : null}
    </SafeAreaView>
  );
}

function LabeledField({
  label,
  value,
  onChangeText,
  placeholder,
  multiline = false,
  keyboardType,
  autoCapitalize = 'sentences',
}: {
  label: string;
  value: string;
  onChangeText: (value: string) => void;
  placeholder: string;
  multiline?: boolean;
  keyboardType?: 'default' | 'number-pad';
  autoCapitalize?: 'none' | 'sentences' | 'words' | 'characters';
}) {
  return (
    <View style={styles.fieldWrap}>
      <Text style={styles.label}>{label}</Text>
      <TextInput
        value={value}
        onChangeText={onChangeText}
        placeholder={placeholder}
        placeholderTextColor={colors.text.tertiary}
        style={[styles.input, multiline && styles.inputMultiline]}
        multiline={multiline}
        keyboardType={keyboardType}
        autoCapitalize={autoCapitalize}
      />
    </View>
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
    padding: spacing.lg,
  },
  headerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: spacing.md,
  },
  stepText: {
    fontSize: typography.fontSize.sm,
    fontWeight: typography.fontWeight.semiBold,
    color: colors.text.secondary,
  },
  skipText: {
    fontSize: typography.fontSize.sm,
    fontWeight: typography.fontWeight.semiBold,
    color: colors.primary.main,
  },
  card: {
    borderRadius: borderRadius.xl,
    borderWidth: 1,
    borderColor: colors.border.light,
    ...shadows.lg,
  },
  heroRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
    marginBottom: spacing.lg,
  },
  heroCopy: {
    flex: 1,
  },
  title: {
    fontSize: typography.fontSize['2xl'],
    fontWeight: typography.fontWeight.bold,
    color: colors.text.primary,
  },
  subtitle: {
    marginTop: spacing.xs,
    fontSize: typography.fontSize.base,
    lineHeight: 24,
    color: colors.text.secondary,
  },
  section: {
    gap: spacing.sm,
  },
  sectionTitle: {
    fontSize: typography.fontSize.xl,
    fontWeight: typography.fontWeight.bold,
    color: colors.text.primary,
    marginBottom: spacing.xs,
  },
  avatarUploadCard: {
    padding: spacing.md,
    borderRadius: borderRadius.lg,
    borderWidth: 1,
    borderColor: colors.border.light,
    backgroundColor: colors.background.secondary,
    marginBottom: spacing.sm,
  },
  avatarUploadRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
  },
  avatarUploadActions: {
    flex: 1,
    gap: spacing.sm,
  },
  fieldWrap: {
    marginBottom: spacing.sm,
  },
  label: {
    marginBottom: spacing.xs,
    fontSize: typography.fontSize.sm,
    fontWeight: typography.fontWeight.semiBold,
    color: colors.text.secondary,
  },
  input: {
    minHeight: 50,
    borderRadius: borderRadius.lg,
    borderWidth: 1,
    borderColor: colors.border.default,
    backgroundColor: colors.brand.white,
    paddingHorizontal: spacing.md,
    fontSize: typography.fontSize.base,
    color: colors.text.primary,
  },
  inputMultiline: {
    minHeight: 100,
    textAlignVertical: 'top',
    paddingVertical: spacing.md,
  },
  helper: {
    fontSize: typography.fontSize.sm,
    color: colors.text.secondary,
  },
  helperError: {
    color: colors.status.error,
  },
  optionRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.sm,
    marginBottom: spacing.sm,
  },
  optionChip: {
    borderRadius: borderRadius.full,
    borderWidth: 1,
    borderColor: colors.border.default,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    backgroundColor: colors.brand.white,
  },
  optionChipSelected: {
    borderColor: colors.primary.main,
    backgroundColor: colors.primary.lightest,
  },
  optionChipLabel: {
    fontSize: typography.fontSize.sm,
    fontWeight: typography.fontWeight.semiBold,
    color: colors.text.primary,
  },
  optionChipLabelSelected: {
    color: colors.primary.main,
  },
  suggestionList: {
    borderRadius: borderRadius.lg,
    borderWidth: 1,
    borderColor: colors.border.light,
    overflow: 'hidden',
    marginBottom: spacing.sm,
  },
  suggestionRow: {
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    backgroundColor: colors.brand.white,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: colors.border.light,
  },
  suggestionLabel: {
    fontSize: typography.fontSize.sm,
    color: colors.text.primary,
  },
  suggestionMeta: {
    marginTop: spacing.xs,
    fontSize: typography.fontSize.xs,
    color: colors.text.secondary,
  },
  tagWrap: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.sm,
  },
  selectedTag: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
    borderRadius: borderRadius.full,
    backgroundColor: colors.primary.lightest,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
  },
  selectedTagLabel: {
    fontSize: typography.fontSize.sm,
    fontWeight: typography.fontWeight.semiBold,
    color: colors.primary.main,
  },
  errorText: {
    marginTop: spacing.md,
    fontSize: typography.fontSize.sm,
    fontWeight: typography.fontWeight.semiBold,
    color: colors.status.error,
  },
  footerRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: spacing.lg,
  },
  loadingOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(17, 24, 39, 0.16)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  loadingCard: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.md,
    borderRadius: borderRadius.full,
    backgroundColor: colors.brand.white,
    ...shadows.md,
  },
  loadingLabel: {
    fontSize: typography.fontSize.base,
    fontWeight: typography.fontWeight.semiBold,
    color: colors.text.primary,
  },
});
