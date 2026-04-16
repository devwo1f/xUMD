import React, { useMemo, useState } from 'react';
import { Platform, Pressable, StyleSheet, Text, TextInput, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import DateTimePicker, { DateTimePickerAndroid } from '@react-native-community/datetimepicker';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import { format, parseISO } from 'date-fns';
import Button from '../../../shared/components/Button';
import Card from '../../../shared/components/Card';
import ScreenLayout from '../../../shared/components/ScreenLayout';
import { buildings } from '../../../assets/data/buildings';
import { colors } from '../../../shared/theme/colors';
import { borderRadius, spacing } from '../../../shared/theme/spacing';
import { typography } from '../../../shared/theme/typography';
import type { CalendarStackParamList } from '../../../navigation/types';
import { useCalendarEntries } from '../hooks/useCalendarEntries';
import type { PersonalBlockRecurrence } from '../types';

const RECURRENCE_OPTIONS: Array<{ value: PersonalBlockRecurrence; label: string }> = [
  { value: 'never', label: 'Never' },
  { value: 'daily', label: 'Daily' },
  { value: 'weekly', label: 'Weekly' },
];

const WEEKDAY_OPTIONS = [
  { label: 'Sun', value: 0 },
  { label: 'Mon', value: 1 },
  { label: 'Tue', value: 2 },
  { label: 'Wed', value: 3 },
  { label: 'Thu', value: 4 },
  { label: 'Fri', value: 5 },
  { label: 'Sat', value: 6 },
];

type PickerTarget = 'date' | 'start' | 'end';

function combineDateAndTime(dateText: string, timeText: string) {
  const iso = `${dateText}T${timeText}:00`;
  return parseISO(iso);
}

export default function AddPersonalBlockScreen({ navigation }: NativeStackScreenProps<CalendarStackParamList, 'AddPersonalBlock'>) {
  const today = new Date();
  const isNativeMobile = Platform.OS !== 'web';
  const [title, setTitle] = useState('');
  const [locationName, setLocationName] = useState('');
  const [dateText, setDateText] = useState(format(today, 'yyyy-MM-dd'));
  const [startTimeText, setStartTimeText] = useState('18:00');
  const [endTimeText, setEndTimeText] = useState('19:30');
  const [recurrence, setRecurrence] = useState<PersonalBlockRecurrence>('never');
  const [recurrenceDays, setRecurrenceDays] = useState<number[]>([today.getDay()]);
  const [error, setError] = useState<string | null>(null);

  const anchorDate = useMemo(() => parseISO(`${dateText}T12:00:00`), [dateText]);
  const selectedDateValue = useMemo(() => parseISO(`${dateText}T12:00:00`), [dateText]);
  const startDateValue = useMemo(() => combineDateAndTime(dateText, startTimeText), [dateText, startTimeText]);
  const endDateValue = useMemo(() => combineDateAndTime(dateText, endTimeText), [dateText, endTimeText]);
  const { selectedDayEntries, addOrUpdatePersonalBlock } = useCalendarEntries({
    anchorDate,
    viewMode: 'day',
  });

  const locationSuggestions = useMemo(() => {
    const needle = locationName.trim().toLowerCase();
    if (needle.length < 2) {
      return [];
    }

    return buildings
      .filter(
        (building) =>
          building.name.toLowerCase().includes(needle) || building.code.toLowerCase().includes(needle),
      )
      .slice(0, 5);
  }, [locationName]);

  const previewConflictCount = useMemo(() => {
    if (!title.trim()) {
      return 0;
    }

    const start = combineDateAndTime(dateText, startTimeText);
    const end = combineDateAndTime(dateText, endTimeText);

    return selectedDayEntries.filter((entry) => {
      const entryStart = new Date(entry.startsAt);
      const entryEnd = new Date(entry.endsAt);
      return start < entryEnd && entryStart < end;
    }).length;
  }, [dateText, endTimeText, selectedDayEntries, startTimeText, title]);

  const applyPickerValue = (target: PickerTarget, nextValue: Date) => {
    if (target === 'date') {
      setDateText(format(nextValue, 'yyyy-MM-dd'));
      return;
    }

    const nextTimeValue = format(nextValue, 'HH:mm');
    if (target === 'start') {
      setStartTimeText(nextTimeValue);
      return;
    }

    setEndTimeText(nextTimeValue);
  };

  const openAndroidPicker = (target: PickerTarget) => {
    const value = target === 'date' ? selectedDateValue : target === 'start' ? startDateValue : endDateValue;
    DateTimePickerAndroid.open({
      value,
      mode: target === 'date' ? 'date' : 'time',
      display: target === 'date' ? 'calendar' : 'clock',
      is24Hour: false,
      onValueChange: (_event, nextValue) => {
        applyPickerValue(target, nextValue);
      },
    });
  };

  const handleSave = async () => {
    setError(null);

    if (!title.trim()) {
      setError('Title is required.');
      return;
    }

    const start = combineDateAndTime(dateText, startTimeText);
    const end = combineDateAndTime(dateText, endTimeText);

    if (Number.isNaN(start.getTime()) || Number.isNaN(end.getTime())) {
      setError('Use valid date and time values.');
      return;
    }

    if (end <= start) {
      setError('End time must be after start time.');
      return;
    }

    const building = buildings.find(
      (item) => item.name === locationName || item.code === locationName,
    ) ??
      buildings.find((item) => locationName.toLowerCase().includes(item.code.toLowerCase()) || locationName.toLowerCase().includes(item.name.toLowerCase()));

    await addOrUpdatePersonalBlock({
      title: title.trim(),
      locationName: locationName.trim() || 'Personal time',
      locationId: building?.id ?? null,
      latitude: building?.latitude ?? null,
      longitude: building?.longitude ?? null,
      startsAt: start.toISOString(),
      endsAt: end.toISOString(),
      recurrence,
      recurrenceDays: recurrence === 'weekly' ? recurrenceDays : [],
    });

    navigation.goBack();
  };

  return (
    <ScreenLayout
      title="Add Personal Block"
      subtitle="Reserve focus time, workouts, meals, or anything else that owns your day."
      keyboardShouldPersistTaps="handled"
      leftAction={
        <Pressable onPress={() => navigation.goBack()} style={styles.iconButton}>
          <Ionicons name="arrow-back" size={20} color={colors.text.primary} />
        </Pressable>
      }
    >
      <Card style={styles.card}>
        <Text style={styles.sectionTitle}>Block Details</Text>
        <View style={styles.fieldGroup}>
          <Text style={styles.label}>Title</Text>
          <TextInput
            value={title}
            onChangeText={setTitle}
            placeholder="Deep work, gym, dinner with friends"
            placeholderTextColor={colors.text.tertiary}
            style={styles.input}
          />
        </View>

        <View style={styles.fieldGroup}>
          <Text style={styles.label}>Location</Text>
          <TextInput
            value={locationName}
            onChangeText={setLocationName}
            placeholder="McKeldin, Eppley, Stamp"
            placeholderTextColor={colors.text.tertiary}
            style={styles.input}
          />
          {locationSuggestions.length > 0 ? (
            <View style={styles.suggestionList}>
              {locationSuggestions.map((building) => (
                <Pressable key={building.id} onPress={() => setLocationName(building.name)} style={styles.suggestionRow}>
                  <Text style={styles.suggestionTitle}>{building.name}</Text>
                  <Text style={styles.suggestionMeta}>{building.code}</Text>
                </Pressable>
              ))}
            </View>
          ) : null}
        </View>

        <View style={styles.fieldRow}>
          <View style={styles.fieldColumn}>
            <Text style={styles.label}>Date</Text>
            {isNativeMobile ? (
              Platform.OS === 'ios' ? (
                <View style={[styles.pickerField, styles.pickerFieldIos]}>
                  <DateTimePicker
                    value={selectedDateValue}
                    mode="date"
                    display="compact"
                    onValueChange={(_event, nextValue) => {
                      applyPickerValue('date', nextValue);
                    }}
                    style={styles.inlinePicker}
                  />
                </View>
              ) : (
                <Pressable onPress={() => openAndroidPicker('date')} style={styles.pickerField}>
                  <Text style={styles.pickerFieldValue}>{format(selectedDateValue, 'EEE, MMM d')}</Text>
                  <Ionicons name="calendar-outline" size={18} color={colors.text.secondary} />
                </Pressable>
              )
            ) : (
              <TextInput
                value={dateText}
                onChangeText={setDateText}
                placeholder="2026-04-06"
                placeholderTextColor={colors.text.tertiary}
                style={styles.input}
                autoCapitalize="none"
              />
            )}
          </View>
          <View style={styles.fieldColumn}>
            <Text style={styles.label}>Start</Text>
            {isNativeMobile ? (
              Platform.OS === 'ios' ? (
                <View style={[styles.pickerField, styles.pickerFieldIos]}>
                  <DateTimePicker
                    value={startDateValue}
                    mode="time"
                    display="compact"
                    onValueChange={(_event, nextValue) => {
                      applyPickerValue('start', nextValue);
                    }}
                    style={styles.inlinePicker}
                  />
                </View>
              ) : (
                <Pressable onPress={() => openAndroidPicker('start')} style={styles.pickerField}>
                  <Text style={styles.pickerFieldValue}>{format(startDateValue, 'h:mm a')}</Text>
                  <Ionicons name="time-outline" size={18} color={colors.text.secondary} />
                </Pressable>
              )
            ) : (
              <TextInput
                value={startTimeText}
                onChangeText={setStartTimeText}
                placeholder="18:00"
                placeholderTextColor={colors.text.tertiary}
                style={styles.input}
                autoCapitalize="none"
              />
            )}
          </View>
          <View style={styles.fieldColumn}>
            <Text style={styles.label}>End</Text>
            {isNativeMobile ? (
              Platform.OS === 'ios' ? (
                <View style={[styles.pickerField, styles.pickerFieldIos]}>
                  <DateTimePicker
                    value={endDateValue}
                    mode="time"
                    display="compact"
                    onValueChange={(_event, nextValue) => {
                      applyPickerValue('end', nextValue);
                    }}
                    style={styles.inlinePicker}
                  />
                </View>
              ) : (
                <Pressable onPress={() => openAndroidPicker('end')} style={styles.pickerField}>
                  <Text style={styles.pickerFieldValue}>{format(endDateValue, 'h:mm a')}</Text>
                  <Ionicons name="time-outline" size={18} color={colors.text.secondary} />
                </Pressable>
              )
            ) : (
              <TextInput
                value={endTimeText}
                onChangeText={setEndTimeText}
                placeholder="19:30"
                placeholderTextColor={colors.text.tertiary}
                style={styles.input}
                autoCapitalize="none"
              />
            )}
          </View>
        </View>

      </Card>

      <Card style={styles.card}>
        <Text style={styles.sectionTitle}>Recurrence</Text>
        <View style={styles.chipRow}>
          {RECURRENCE_OPTIONS.map((option) => {
            const selected = recurrence === option.value;
            return (
              <Pressable key={option.value} onPress={() => setRecurrence(option.value)} style={[styles.chip, selected && styles.chipActive]}>
                <Text style={[styles.chipLabel, selected && styles.chipLabelActive]}>{option.label}</Text>
              </Pressable>
            );
          })}
        </View>

        {recurrence === 'weekly' ? (
          <View style={styles.weekdayWrap}>
            {WEEKDAY_OPTIONS.map((option) => {
              const selected = recurrenceDays.includes(option.value);
              return (
                <Pressable
                  key={option.value}
                  onPress={() =>
                    setRecurrenceDays((current) =>
                      current.includes(option.value)
                        ? current.filter((item) => item !== option.value)
                        : [...current, option.value].sort((left, right) => left - right),
                    )
                  }
                  style={[styles.weekdayChip, selected && styles.weekdayChipActive]}
                >
                  <Text style={[styles.weekdayLabel, selected && styles.weekdayLabelActive]}>{option.label}</Text>
                </Pressable>
              );
            })}
          </View>
        ) : null}
      </Card>

      <Card style={styles.card}>
        <Text style={styles.sectionTitle}>Real-time Conflict Check</Text>
        <Text style={styles.helperText}>
          {previewConflictCount > 0
            ? `${previewConflictCount} overlap${previewConflictCount === 1 ? '' : 's'} detected on this day.`
            : 'No overlaps detected in the selected day.'}
        </Text>
      </Card>

      {error ? <Text style={styles.errorText}>{error}</Text> : null}

      <Button title="Save Personal Block" onPress={() => void handleSave()} fullWidth />
    </ScreenLayout>
  );
}

const styles = StyleSheet.create({
  iconButton: {
    width: 40,
    height: 40,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: borderRadius.full,
    backgroundColor: colors.background.secondary,
  },
  card: {
    gap: spacing.md,
  },
  sectionTitle: {
    fontSize: typography.fontSize.lg,
    fontWeight: typography.fontWeight.bold,
    color: colors.text.primary,
  },
  fieldGroup: {
    gap: spacing.sm,
  },
  fieldRow: {
    flexDirection: 'row',
    gap: spacing.sm,
  },
  fieldColumn: {
    flex: 1,
    gap: spacing.sm,
  },
  label: {
    fontSize: typography.fontSize.sm,
    fontWeight: typography.fontWeight.semiBold,
    color: colors.text.secondary,
  },
  input: {
    minHeight: 48,
    borderRadius: borderRadius.lg,
    borderWidth: 1,
    borderColor: colors.border.light,
    backgroundColor: colors.brand.white,
    paddingHorizontal: spacing.md,
    color: colors.text.primary,
  },
  pickerField: {
    minHeight: 48,
    borderRadius: borderRadius.lg,
    borderWidth: 1,
    borderColor: colors.border.light,
    backgroundColor: colors.brand.white,
    paddingHorizontal: spacing.md,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: spacing.sm,
  },
  pickerFieldValue: {
    flex: 1,
    fontSize: typography.fontSize.base,
    color: colors.text.primary,
  },
  pickerFieldIos: {
    justifyContent: 'center',
    paddingHorizontal: spacing.sm,
  },
  inlinePicker: {
    width: '100%',
  },
  pickerCard: {
    gap: spacing.sm,
  },
  pickerHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: spacing.md,
  },
  pickerTitle: {
    fontSize: typography.fontSize.sm,
    fontWeight: typography.fontWeight.semiBold,
    color: colors.text.primary,
  },
  pickerDone: {
    fontSize: typography.fontSize.sm,
    fontWeight: typography.fontWeight.semiBold,
    color: colors.primary.main,
  },
  chipRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.sm,
  },
  chip: {
    borderRadius: borderRadius.full,
    borderWidth: 1,
    borderColor: colors.border.default,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    backgroundColor: colors.brand.white,
  },
  chipActive: {
    borderColor: colors.primary.main,
    backgroundColor: colors.primary.main,
  },
  chipLabel: {
    fontSize: typography.fontSize.sm,
    fontWeight: typography.fontWeight.semiBold,
    color: colors.text.primary,
  },
  chipLabelActive: {
    color: colors.brand.white,
  },
  weekdayWrap: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.sm,
  },
  weekdayChip: {
    width: 54,
    height: 40,
    borderRadius: borderRadius.full,
    borderWidth: 1,
    borderColor: colors.border.default,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.brand.white,
  },
  weekdayChipActive: {
    borderColor: colors.primary.main,
    backgroundColor: colors.primary.lightest,
  },
  weekdayLabel: {
    fontSize: typography.fontSize.sm,
    fontWeight: typography.fontWeight.semiBold,
    color: colors.text.primary,
  },
  weekdayLabelActive: {
    color: colors.primary.main,
  },
  helperText: {
    fontSize: typography.fontSize.sm,
    lineHeight: 20,
    color: colors.text.secondary,
  },
  suggestionList: {
    borderRadius: borderRadius.lg,
    borderWidth: 1,
    borderColor: colors.border.light,
    overflow: 'hidden',
  },
  suggestionRow: {
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    backgroundColor: colors.brand.white,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: colors.border.light,
  },
  suggestionTitle: {
    fontSize: typography.fontSize.sm,
    fontWeight: typography.fontWeight.semiBold,
    color: colors.text.primary,
  },
  suggestionMeta: {
    marginTop: spacing.xs,
    fontSize: typography.fontSize.xs,
    color: colors.text.secondary,
  },
  errorText: {
    fontSize: typography.fontSize.sm,
    fontWeight: typography.fontWeight.semiBold,
    color: colors.status.error,
  },
});
