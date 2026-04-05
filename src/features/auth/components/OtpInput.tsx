import React, { useMemo, useRef } from 'react';
import { Pressable, StyleSheet, TextInput, View } from 'react-native';
import { colors } from '../../../shared/theme/colors';
import { borderRadius, spacing } from '../../../shared/theme/spacing';
import { typography } from '../../../shared/theme/typography';

interface OtpInputProps {
  value: string;
  onChange: (value: string) => void;
  onComplete?: (value: string) => void;
  disabled?: boolean;
}

const OTP_LENGTH = 6;

export default function OtpInput({ value, onChange, onComplete, disabled = false }: OtpInputProps) {
  const refs = useRef<Array<TextInput | null>>([]);
  const digits = useMemo(() => value.padEnd(OTP_LENGTH, ' ').slice(0, OTP_LENGTH).split(''), [value]);

  const focusIndex = (index: number) => {
    refs.current[index]?.focus();
  };

  const applyValue = (nextValue: string) => {
    const sanitized = nextValue.replace(/\D/g, '').slice(0, OTP_LENGTH);
    onChange(sanitized);
    if (sanitized.length === OTP_LENGTH) {
      onComplete?.(sanitized);
      return;
    }
    focusIndex(Math.min(sanitized.length, OTP_LENGTH - 1));
  };

  const handleChangeAtIndex = (text: string, index: number) => {
    const sanitized = text.replace(/\D/g, '');
    if (!sanitized) {
      const nextDigits = value.split('');
      nextDigits[index] = '';
      onChange(nextDigits.join('').slice(0, OTP_LENGTH));
      return;
    }

    if (sanitized.length > 1) {
      applyValue(sanitized);
      return;
    }

    const nextDigits = value.padEnd(OTP_LENGTH, ' ').slice(0, OTP_LENGTH).split('');
    nextDigits[index] = sanitized;
    const joined = nextDigits.join('').replace(/\s/g, '').slice(0, OTP_LENGTH);
    onChange(joined);

    if (joined.length === OTP_LENGTH) {
      onComplete?.(joined);
      return;
    }

    focusIndex(Math.min(index + 1, OTP_LENGTH - 1));
  };

  const handleKeyPress = (key: string, index: number) => {
    if (key !== 'Backspace') {
      return;
    }

    if (digits[index]?.trim()) {
      const nextDigits = value.padEnd(OTP_LENGTH, ' ').slice(0, OTP_LENGTH).split('');
      nextDigits[index] = ' ';
      onChange(nextDigits.join('').replace(/\s/g, '').slice(0, OTP_LENGTH));
      return;
    }

    if (index > 0) {
      focusIndex(index - 1);
    }
  };

  return (
    <Pressable style={styles.row} onPress={() => focusIndex(Math.min(value.length, OTP_LENGTH - 1))}>
      {Array.from({ length: OTP_LENGTH }).map((_, index) => (
        <TextInput
          key={`otp-${index}`}
          ref={(ref) => {
            refs.current[index] = ref;
          }}
          value={digits[index]?.trim() ?? ''}
          onChangeText={(text) => handleChangeAtIndex(text, index)}
          onKeyPress={({ nativeEvent }) => handleKeyPress(nativeEvent.key, index)}
          style={[styles.cell, disabled && styles.cellDisabled]}
          maxLength={index === 0 ? OTP_LENGTH : 1}
          keyboardType="number-pad"
          editable={!disabled}
          textAlign="center"
          accessibilityLabel={`OTP digit ${index + 1}`}
        />
      ))}
    </Pressable>
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: spacing.sm,
  },
  cell: {
    width: 46,
    height: 58,
    borderRadius: borderRadius.md,
    borderWidth: 1,
    borderColor: colors.border.default,
    backgroundColor: colors.brand.white,
    fontSize: typography.fontSize['2xl'],
    fontWeight: typography.fontWeight.bold,
    color: colors.text.primary,
  },
  cellDisabled: {
    opacity: 0.6,
  },
});
