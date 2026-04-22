import React, { useEffect, useMemo, useState } from 'react';
import { Modal, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import {
  addMonths,
  eachDayOfInterval,
  endOfMonth,
  endOfWeek,
  format,
  getHours,
  getMinutes,
  isSameDay,
  isSameMonth,
  isToday,
  setHours,
  setMinutes,
  startOfMonth,
  startOfWeek,
  subMonths,
} from 'date-fns';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { colors } from '../theme/colors';
import { borderRadius, shadows, spacing } from '../theme/spacing';
import { typography } from '../theme/typography';

interface NativeDateTimePickerModalProps {
  visible: boolean;
  title: string;
  value: Date;
  mode: 'date' | 'time';
  onConfirm: (nextValue: Date) => void;
  onClose: () => void;
  minimumDate?: Date;
  maximumDate?: Date;
}

// ── Calendar Grid (date mode) ───────────────────────────────

const WEEKDAYS = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

function CalendarPicker({
  value,
  onChange,
  minimumDate,
  maximumDate,
}: {
  value: Date;
  onChange: (date: Date) => void;
  minimumDate?: Date;
  maximumDate?: Date;
}) {
  const [viewMonth, setViewMonth] = useState(startOfMonth(value));

  const calendarDays = useMemo(() => {
    const monthStart = startOfMonth(viewMonth);
    const monthEnd = endOfMonth(viewMonth);
    const calStart = startOfWeek(monthStart);
    const calEnd = endOfWeek(monthEnd);
    return eachDayOfInterval({ start: calStart, end: calEnd });
  }, [viewMonth]);

  const canGoPrev = !minimumDate || startOfMonth(subMonths(viewMonth, 1)) >= startOfMonth(minimumDate);
  const canGoNext = !maximumDate || startOfMonth(addMonths(viewMonth, 1)) <= startOfMonth(maximumDate);

  return (
    <View style={calStyles.container}>
      <View style={calStyles.monthNav}>
        <Pressable
          onPress={() => canGoPrev && setViewMonth(subMonths(viewMonth, 1))}
          style={[calStyles.navArrow, !canGoPrev && calStyles.navArrowDisabled]}
          hitSlop={12}
        >
          <Ionicons name="chevron-back" size={20} color={canGoPrev ? colors.text.primary : colors.text.tertiary} />
        </Pressable>
        <Text style={calStyles.monthLabel}>{format(viewMonth, 'MMMM yyyy')}</Text>
        <Pressable
          onPress={() => canGoNext && setViewMonth(addMonths(viewMonth, 1))}
          style={[calStyles.navArrow, !canGoNext && calStyles.navArrowDisabled]}
          hitSlop={12}
        >
          <Ionicons name="chevron-forward" size={20} color={canGoNext ? colors.text.primary : colors.text.tertiary} />
        </Pressable>
      </View>

      <View style={calStyles.weekdayRow}>
        {WEEKDAYS.map((day) => (
          <Text key={day} style={calStyles.weekdayLabel}>{day}</Text>
        ))}
      </View>

      <View style={calStyles.grid}>
        {calendarDays.map((day, index) => {
          const inMonth = isSameMonth(day, viewMonth);
          const selected = isSameDay(day, value);
          const today = isToday(day);
          const disabled =
            !inMonth ||
            (minimumDate && day < startOfMonth(minimumDate) ? true : false) ||
            (maximumDate && day > endOfMonth(maximumDate) ? true : false);

          // More precise min/max check at day level
          const beforeMin = minimumDate ? day.getTime() < new Date(minimumDate.getFullYear(), minimumDate.getMonth(), minimumDate.getDate()).getTime() : false;
          const afterMax = maximumDate ? day.getTime() > new Date(maximumDate.getFullYear(), maximumDate.getMonth(), maximumDate.getDate(), 23, 59, 59).getTime() : false;
          const isDisabled = !inMonth || beforeMin || afterMax;

          return (
            <Pressable
              key={index}
              onPress={() => {
                if (!isDisabled) {
                  const next = new Date(value);
                  next.setFullYear(day.getFullYear(), day.getMonth(), day.getDate());
                  onChange(next);
                }
              }}
              style={[
                calStyles.dayCell,
                selected && calStyles.dayCellSelected,
                today && !selected && calStyles.dayCellToday,
              ]}
            >
              <Text
                style={[
                  calStyles.dayText,
                  !inMonth && calStyles.dayTextOutside,
                  isDisabled && calStyles.dayTextDisabled,
                  selected && calStyles.dayTextSelected,
                  today && !selected && calStyles.dayTextToday,
                ]}
              >
                {day.getDate()}
              </Text>
            </Pressable>
          );
        })}
      </View>
    </View>
  );
}

const calStyles = StyleSheet.create({
  container: {
    gap: spacing.sm,
  },
  monthNav: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: spacing.xs,
  },
  navArrow: {
    width: 36,
    height: 36,
    borderRadius: borderRadius.full,
    alignItems: 'center',
    justifyContent: 'center',
  },
  navArrowDisabled: {
    opacity: 0.3,
  },
  monthLabel: {
    fontSize: typography.fontSize.lg,
    fontWeight: typography.fontWeight.bold,
    color: colors.text.primary,
  },
  weekdayRow: {
    flexDirection: 'row',
  },
  weekdayLabel: {
    flex: 1,
    textAlign: 'center',
    fontSize: typography.fontSize.xs,
    fontWeight: typography.fontWeight.semiBold,
    color: colors.text.tertiary,
    textTransform: 'uppercase',
  },
  grid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
  },
  dayCell: {
    width: '14.285%',
    aspectRatio: 1,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: borderRadius.full,
  },
  dayCellSelected: {
    backgroundColor: colors.primary.main,
  },
  dayCellToday: {
    backgroundColor: colors.primary.lightest,
  },
  dayText: {
    fontSize: typography.fontSize.base,
    fontWeight: typography.fontWeight.medium,
    color: colors.text.primary,
  },
  dayTextOutside: {
    color: colors.text.tertiary,
    opacity: 0.4,
  },
  dayTextDisabled: {
    color: colors.text.tertiary,
    opacity: 0.3,
  },
  dayTextSelected: {
    color: colors.brand.white,
    fontWeight: typography.fontWeight.bold,
  },
  dayTextToday: {
    color: colors.primary.main,
    fontWeight: typography.fontWeight.bold,
  },
});

// ── Time Picker (time mode) ─────────────────────────────────

function TimePicker({
  value,
  onChange,
}: {
  value: Date;
  onChange: (date: Date) => void;
}) {
  const rawHour = getHours(value);
  const minute = getMinutes(value);
  const isPM = rawHour >= 12;
  const displayHour = rawHour === 0 ? 12 : rawHour > 12 ? rawHour - 12 : rawHour;

  const setTime = (hour12: number, min: number, pm: boolean) => {
    let h24 = hour12;
    if (pm && hour12 !== 12) h24 = hour12 + 12;
    if (!pm && hour12 === 12) h24 = 0;
    onChange(setMinutes(setHours(new Date(value), h24), min));
  };

  const adjustHour = (delta: number) => {
    let nextHour = displayHour + delta;
    if (nextHour > 12) nextHour = 1;
    if (nextHour < 1) nextHour = 12;
    setTime(nextHour, minute, isPM);
  };

  const adjustMinute = (delta: number) => {
    let nextMinute = minute + delta;
    if (nextMinute >= 60) nextMinute = 0;
    if (nextMinute < 0) nextMinute = 55;
    setTime(displayHour, nextMinute, isPM);
  };

  const togglePeriod = () => {
    setTime(displayHour, minute, !isPM);
  };

  return (
    <View style={timeStyles.container}>
      <View style={timeStyles.display}>
        <View style={timeStyles.column}>
          <Pressable onPress={() => adjustHour(1)} style={timeStyles.stepButton} hitSlop={8}>
            <Ionicons name="chevron-up" size={24} color={colors.text.secondary} />
          </Pressable>
          <Text style={timeStyles.digit}>{String(displayHour).padStart(2, '0')}</Text>
          <Pressable onPress={() => adjustHour(-1)} style={timeStyles.stepButton} hitSlop={8}>
            <Ionicons name="chevron-down" size={24} color={colors.text.secondary} />
          </Pressable>
        </View>

        <Text style={timeStyles.colon}>:</Text>

        <View style={timeStyles.column}>
          <Pressable onPress={() => adjustMinute(5)} style={timeStyles.stepButton} hitSlop={8}>
            <Ionicons name="chevron-up" size={24} color={colors.text.secondary} />
          </Pressable>
          <Text style={timeStyles.digit}>{String(minute).padStart(2, '0')}</Text>
          <Pressable onPress={() => adjustMinute(-5)} style={timeStyles.stepButton} hitSlop={8}>
            <Ionicons name="chevron-down" size={24} color={colors.text.secondary} />
          </Pressable>
        </View>

        <View style={timeStyles.periodColumn}>
          <Pressable
            onPress={togglePeriod}
            style={[timeStyles.periodButton, !isPM && timeStyles.periodButtonActive]}
          >
            <Text style={[timeStyles.periodText, !isPM && timeStyles.periodTextActive]}>AM</Text>
          </Pressable>
          <Pressable
            onPress={togglePeriod}
            style={[timeStyles.periodButton, isPM && timeStyles.periodButtonActive]}
          >
            <Text style={[timeStyles.periodText, isPM && timeStyles.periodTextActive]}>PM</Text>
          </Pressable>
        </View>
      </View>

      <View style={timeStyles.quickRow}>
        {[
          { label: ':00', min: 0 },
          { label: ':15', min: 15 },
          { label: ':30', min: 30 },
          { label: ':45', min: 45 },
        ].map((q) => (
          <Pressable
            key={q.label}
            onPress={() => setTime(displayHour, q.min, isPM)}
            style={[timeStyles.quickChip, minute === q.min && timeStyles.quickChipActive]}
          >
            <Text style={[timeStyles.quickChipText, minute === q.min && timeStyles.quickChipTextActive]}>
              {q.label}
            </Text>
          </Pressable>
        ))}
      </View>
    </View>
  );
}

const timeStyles = StyleSheet.create({
  container: {
    gap: spacing.lg,
    alignItems: 'center',
    paddingVertical: spacing.md,
  },
  display: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
  },
  column: {
    alignItems: 'center',
    gap: spacing.xs,
  },
  stepButton: {
    width: 44,
    height: 32,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: borderRadius.sm,
    backgroundColor: colors.background.secondary,
  },
  digit: {
    fontSize: 44,
    fontWeight: typography.fontWeight.bold,
    color: colors.text.primary,
    fontVariant: ['tabular-nums'],
    minWidth: 70,
    textAlign: 'center',
  },
  colon: {
    fontSize: 40,
    fontWeight: typography.fontWeight.bold,
    color: colors.text.tertiary,
    marginBottom: 4,
  },
  periodColumn: {
    gap: spacing.xs,
    marginLeft: spacing.sm,
  },
  periodButton: {
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    borderRadius: borderRadius.sm,
    backgroundColor: colors.background.secondary,
    borderWidth: 1.5,
    borderColor: colors.border.light,
  },
  periodButtonActive: {
    backgroundColor: colors.primary.main,
    borderColor: colors.primary.main,
  },
  periodText: {
    fontSize: typography.fontSize.sm,
    fontWeight: typography.fontWeight.bold,
    color: colors.text.secondary,
  },
  periodTextActive: {
    color: colors.brand.white,
  },
  quickRow: {
    flexDirection: 'row',
    gap: spacing.sm,
  },
  quickChip: {
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    borderRadius: borderRadius.full,
    backgroundColor: colors.background.secondary,
    borderWidth: 1,
    borderColor: colors.border.light,
  },
  quickChipActive: {
    backgroundColor: colors.primary.lightest,
    borderColor: colors.primary.main,
  },
  quickChipText: {
    fontSize: typography.fontSize.sm,
    fontWeight: typography.fontWeight.semiBold,
    color: colors.text.secondary,
  },
  quickChipTextActive: {
    color: colors.primary.main,
  },
});

// ── Main Modal ──────────────────────────────────────────────

export default function NativeDateTimePickerModal({
  visible,
  title,
  value,
  mode,
  onConfirm,
  onClose,
  minimumDate,
  maximumDate,
}: NativeDateTimePickerModalProps) {
  const insets = useSafeAreaInsets();
  const [draftValue, setDraftValue] = useState(value);

  useEffect(() => {
    if (visible) {
      setDraftValue(value);
    }
  }, [value, visible]);

  if (!visible) {
    return null;
  }

  return (
    <Modal
      visible={visible}
      transparent
      animationType="slide"
      onRequestClose={onClose}
    >
      <Pressable style={styles.overlay} onPress={onClose}>
        <Pressable
          style={[styles.sheet, { paddingBottom: Math.max(spacing.xl, insets.bottom + spacing.md) }]}
          onPress={(e) => e.stopPropagation()}
        >
          <View style={styles.handle} />
          <View style={styles.header}>
            <Text onPress={onClose} style={styles.secondaryAction}>
              Cancel
            </Text>
            <Text style={styles.title}>{title}</Text>
            <Text
              onPress={() => {
                onConfirm(draftValue);
              }}
              style={styles.primaryAction}
            >
              Done
            </Text>
          </View>

          {mode === 'date' ? (
            <CalendarPicker
              value={draftValue}
              onChange={setDraftValue}
              minimumDate={minimumDate}
              maximumDate={maximumDate}
            />
          ) : (
            <TimePicker value={draftValue} onChange={setDraftValue} />
          )}
        </Pressable>
      </Pressable>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    justifyContent: 'flex-end',
    backgroundColor: 'rgba(15, 23, 42, 0.28)',
  },
  sheet: {
    borderTopLeftRadius: borderRadius.xl,
    borderTopRightRadius: borderRadius.xl,
    backgroundColor: colors.brand.white,
    paddingHorizontal: spacing.lg,
    paddingTop: spacing.sm,
    ...shadows.lg,
  },
  handle: {
    width: 36,
    height: 4,
    borderRadius: 2,
    backgroundColor: colors.border.default,
    alignSelf: 'center',
    marginBottom: spacing.sm,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: spacing.md,
    marginBottom: spacing.md,
  },
  title: {
    flex: 1,
    textAlign: 'center',
    fontSize: typography.fontSize.base,
    fontWeight: typography.fontWeight.bold,
    color: colors.text.primary,
  },
  secondaryAction: {
    fontSize: typography.fontSize.sm,
    fontWeight: typography.fontWeight.semiBold,
    color: colors.text.secondary,
    paddingVertical: spacing.xs,
  },
  primaryAction: {
    fontSize: typography.fontSize.sm,
    fontWeight: typography.fontWeight.bold,
    color: colors.primary.main,
    paddingVertical: spacing.xs,
  },
});
