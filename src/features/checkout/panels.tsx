import { useEffect, useState } from 'react';
import { Pressable, StyleSheet, Text, TextInput, View } from 'react-native';

import { colors, spacing } from '../../ui/theme';
import { formatCardNumber, isLuhnValid } from './cardFormat';
import { isValidVpa, type UpiApi } from './upiApi';

type UpiPhase = { kind: 'idle' } | { kind: 'waiting'; requestId: string } | { kind: 'approved' };

/**
 * Polls the collect request while visible. Inside a hidden <Activity>, React runs the
 * effect cleanup (interval cleared), then re-runs the effect when the tab is shown again.
 * The typed VPA and the phase live in state, so they survive the round trip.
 */
export function UpiPanel({ api, intervalMs }: { api: UpiApi; intervalMs: number }) {
  const [vpa, setVpa] = useState('');
  const [phase, setPhase] = useState<UpiPhase>({ kind: 'idle' });

  const requestId = phase.kind === 'waiting' ? phase.requestId : null;
  useEffect(() => {
    if (!requestId) return;
    let cancelled = false;
    const id = setInterval(async () => {
      const status = await api.checkStatus(requestId);
      if (!cancelled && status === 'approved') setPhase({ kind: 'approved' });
    }, intervalMs);
    return () => {
      cancelled = true;
      clearInterval(id);
    };
  }, [api, intervalMs, requestId]);

  async function send() {
    const { requestId: newId } = await api.sendCollect(vpa.trim());
    setPhase({ kind: 'waiting', requestId: newId });
  }

  return (
    <View style={styles.panel}>
      <TextInput
        accessibilityLabel="UPI ID"
        placeholder="name@bank"
        autoCapitalize="none"
        value={vpa}
        onChangeText={setVpa}
        style={styles.input}
      />
      {phase.kind === 'idle' && (
        <Button label="Send collect request" disabled={!isValidVpa(vpa)} onPress={send} />
      )}
      {phase.kind === 'waiting' && <Text>Approve the request in your UPI app…</Text>}
      {phase.kind === 'approved' && <Text style={styles.success}>UPI payment approved</Text>}
    </View>
  );
}

export function CardPanel() {
  const [number, setNumber] = useState('');
  const complete = number.replace(/\D/g, '').length >= 12;
  return (
    <View style={styles.panel}>
      <TextInput
        accessibilityLabel="Card number"
        placeholder="1234 5678 9012 3456"
        keyboardType="number-pad"
        value={number}
        onChangeText={(text) => setNumber(formatCardNumber(text))}
        style={styles.input}
      />
      {complete && (
        <Text style={isLuhnValid(number) ? styles.success : styles.error}>
          {isLuhnValid(number) ? 'Card number looks valid' : 'Check the card number'}
        </Text>
      )}
    </View>
  );
}

export const BANKS = ['HDFC Bank', 'ICICI Bank', 'State Bank of India', 'Axis Bank'] as const;

export function NetbankingPanel() {
  const [bank, setBank] = useState<string | null>(null);
  return (
    <View style={styles.panel}>
      {BANKS.map((name) => (
        <Pressable
          key={name}
          accessibilityRole="radio"
          accessibilityState={{ selected: bank === name }}
          onPress={() => setBank(name)}
          style={[styles.row, bank === name && styles.rowSelected]}
        >
          <Text>{name}</Text>
        </Pressable>
      ))}
    </View>
  );
}

function Button({ label, disabled, onPress }: { label: string; disabled?: boolean; onPress: () => void }) {
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityState={{ disabled: !!disabled }}
      disabled={disabled}
      onPress={onPress}
      style={[styles.button, disabled && styles.buttonDisabled]}
    >
      <Text style={styles.buttonText}>{label}</Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  panel: { gap: spacing.md, padding: spacing.lg },
  input: { borderWidth: 1, borderColor: colors.border, borderRadius: 8, padding: spacing.md, color: colors.text },
  button: { backgroundColor: colors.primary, borderRadius: 8, padding: spacing.md, alignItems: 'center' },
  buttonDisabled: { opacity: 0.4 },
  buttonText: { color: colors.background, fontWeight: '600' },
  row: { padding: spacing.md, borderRadius: 8, borderWidth: 1, borderColor: colors.border },
  rowSelected: { borderColor: colors.primary, backgroundColor: colors.surface },
  success: { color: colors.success },
  error: { color: colors.error },
});
