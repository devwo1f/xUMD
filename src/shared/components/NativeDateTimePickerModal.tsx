import React, { useEffect, useRef, useState } from 'react';
import {
  Modal,
  Platform,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import DateTimePicker, {
  DateTimePickerAndroid,
  type DateTimePickerChangeEvent,
  type DateTimePickerEvent,
} from '@react-native-community/datetimepicker';
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
  const [draftValue, setDraftValue] = useState(value);
  const hasOpenedAndroidDialog = useRef(false);
  const confirmRef = useRef(onConfirm);
  const closeRef = useRef(onClose);

  useEffect(() => {
    confirmRef.current = onConfirm;
    closeRef.current = onClose;
  }, [onClose, onConfirm]);

  useEffect(() => {
    if (visible) {
      setDraftValue(value);
    }
  }, [value, visible]);

  useEffect(() => {
    if (Platform.OS !== 'android') {
      return;
    }

    if (!visible) {
      hasOpenedAndroidDialog.current = false;
      return;
    }

    if (hasOpenedAndroidDialog.current) {
      return;
    }

    hasOpenedAndroidDialog.current = true;
    DateTimePickerAndroid.open({
      value,
      mode,
      is24Hour: false,
      display: mode === 'date' ? 'calendar' : 'clock',
      minimumDate,
      maximumDate,
      onChange: (event: DateTimePickerEvent, nextValue?: Date) => {
        hasOpenedAndroidDialog.current = false;
        if (event.type === 'set' && nextValue) {
          confirmRef.current(nextValue);
        }
        closeRef.current();
      },
    });
  }, [maximumDate, minimumDate, mode, value, visible]);

  if (Platform.OS === 'android' || !visible) {
    return null;
  }

  return (
    <Modal
      visible={visible}
      transparent
      animationType="fade"
      presentationStyle="overFullScreen"
      onRequestClose={onClose}
    >
      <View style={styles.overlay}>
        <View pointerEvents="none" style={StyleSheet.absoluteFillObject} />
        <View style={styles.sheet}>
          <View style={styles.header}>
            <Text onPress={onClose} style={styles.secondaryAction}>
              Cancel
            </Text>
            <Text style={styles.title}>{title}</Text>
            <Text
              onPress={() => {
                onConfirm(draftValue);
                onClose();
              }}
              style={styles.primaryAction}
            >
              Done
            </Text>
          </View>
          <View style={styles.pickerWrap}>
            <DateTimePicker
              value={draftValue}
              mode={mode}
              display={mode === 'date' ? 'inline' : 'spinner'}
              minimumDate={minimumDate}
              maximumDate={maximumDate}
              onValueChange={(_event: DateTimePickerChangeEvent, nextValue: Date) => {
                setDraftValue(nextValue);
              }}
            />
          </View>
        </View>
      </View>
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
    paddingTop: spacing.md,
    paddingBottom: spacing.xl,
    ...shadows.lg,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: spacing.md,
    marginBottom: spacing.sm,
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
  },
  primaryAction: {
    fontSize: typography.fontSize.sm,
    fontWeight: typography.fontWeight.bold,
    color: colors.primary.main,
  },
  pickerWrap: {
    alignItems: 'stretch',
  },
});
