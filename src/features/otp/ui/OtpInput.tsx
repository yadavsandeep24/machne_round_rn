import { forwardRef, useImperativeHandle, useRef, type ComponentRef } from 'react';
import { Pressable, StyleSheet, Text, TextInput, View } from 'react-native';

import { colors, spacing } from '../../../ui/theme';

/**
 * One hidden TextInput behind N boxes (not N inputs): paste, SMS autofill
 * (iOS oneTimeCode, Android sms-otp) and backspace all just work, and focus
 * never has to jump between fields.
 */
export const OtpInput = forwardRef<{ clear: () => void }, {
  length?: number;
  value: string;
  onChange: (code: string) => void;
  disabled?: boolean;
  error?: boolean;
}>(function OtpInput({ length = 6, value, onChange, disabled, error }, ref) {
  const input = useRef<ComponentRef<typeof TextInput>>(null);
  useImperativeHandle(ref, () => ({ clear: () => onChange('') }), [onChange]);
  return (
    <Pressable onPress={() => input.current?.focus()} accessibilityLabel="One-time code">
      <View style={styles.row} pointerEvents="none">
        {Array.from({ length }, (_, i) => (
          <View
            key={i}
            style={[styles.box, i === value.length && styles.active, error && styles.error]}
          >
            <Text style={styles.digit}>{value[i] ?? ''}</Text>
          </View>
        ))}
      </View>
      <TextInput
        ref={input}
        value={value}
        // Keep digits only, max length: handles pasted "123 456" or "Your code is 123456".
        onChangeText={(t) => onChange(t.replace(/\D/g, '').slice(0, length))}
        editable={!disabled}
        keyboardType="number-pad"
        textContentType="oneTimeCode"
        autoComplete="sms-otp"
        maxLength={length + 10}
        autoFocus
        accessibilityLabel="Enter the 6 digit code"
        style={styles.hidden}
        caretHidden
      />
    </Pressable>
  );
});

const styles = StyleSheet.create({
  row: { flexDirection: 'row', gap: spacing.sm, justifyContent: 'center' },
  box: {
    width: 44,
    height: 52,
    borderRadius: 8,
    borderWidth: 1.5,
    borderColor: colors.border,
    alignItems: 'center',
    justifyContent: 'center',
  },
  active: { borderColor: colors.primary },
  error: { borderColor: colors.error },
  digit: { fontSize: 22, fontWeight: '700' },
  hidden: { position: 'absolute', opacity: 0, width: 1, height: 1 },
});
