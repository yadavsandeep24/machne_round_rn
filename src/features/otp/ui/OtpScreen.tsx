import { useCallback, useEffect, useRef, useState } from 'react';
import { ActivityIndicator, StyleSheet, Text, View } from 'react-native';

import { Button } from '../../../core/ui/StateViews';
import { readJson, writeJson, type KeyValueStore } from '../../../core/storage/keyValueStore';
import { colors, spacing } from '../../../ui/theme';
import type { OtpChallenge, OtpService } from '../data/otpService';
import { OtpInput } from './OtpInput';
import { formatMmSs, useCountdown } from './useCountdown';

const CHALLENGE_KEY = 'otp_challenge_v1';

/** "+91 98765 43210" -> "+91 ••••• •3210": never show (or log) the full number. */
export const maskPhone = (phone: string) => {
  const digits = phone.replace(/\D/g, '');
  return `•••••• ${digits.slice(-4)}`;
};

export function OtpScreen({
  phone,
  service,
  store,
  now = Date.now,
  onVerified,
}: {
  phone: string;
  service: OtpService;
  store: KeyValueStore;
  now?: () => number;
  onVerified: () => void;
}) {
  const [challenge, setChallenge] = useState<OtpChallenge | null>(null);
  const [code, setCode] = useState('');
  const [message, setMessage] = useState<string>();
  const [busy, setBusy] = useState(false);
  const [locked, setLocked] = useState(false);
  const submitted = useRef<string | null>(null);

  const resendIn = useCountdown(challenge?.resendAvailableAt ?? null, now);
  const expiresIn = useCountdown(challenge?.expiresAt ?? null, now);

  // Restore a running challenge after an app kill, so killing the app does not
  // reset the cooldown (anti-abuse), otherwise request a new code.
  useEffect(() => {
    let cancelled = false;
    (async () => {
      const saved = await readJson<OtpChallenge | null>(store, CHALLENGE_KEY, null);
      const fresh = saved && saved.expiresAt > now() ? saved : await service.request(phone);
      if (cancelled) return;
      setChallenge(fresh);
      await writeJson(store, CHALLENGE_KEY, fresh);
    })();
    return () => {
      cancelled = true;
    };
  }, [phone, service, store, now]);

  const verify = useCallback(
    async (value: string) => {
      if (submitted.current === value) return; // same code twice (paste + autofill): one request
      submitted.current = value;
      setBusy(true);
      const result = await service.verify(phone, value);
      setBusy(false);
      if (result.ok) {
        await store.removeItem(CHALLENGE_KEY);
        onVerified();
        return;
      }
      setCode('');
      submitted.current = null;
      if (result.reason === 'wrong') setMessage(`Incorrect code. ${result.attemptsLeft} attempts left.`);
      else if (result.reason === 'expired') setMessage('This code has expired. Request a new one.');
      else {
        setLocked(true);
        setMessage('Too many attempts. Please try again later.');
      }
    },
    [phone, service, store, onVerified],
  );

  // Auto-submit when all 6 digits are in (typed, pasted or autofilled).
  const onChange = useCallback(
    (value: string) => {
      setCode(value);
      setMessage(undefined);
      if (value.length === 6) void verify(value);
    },
    [verify],
  );

  const resend = useCallback(async () => {
    setBusy(true);
    try {
      const next = await service.resend(phone);
      setChallenge(next);
      setCode('');
      setMessage('A new code was sent.');
      await writeJson(store, CHALLENGE_KEY, next);
    } catch {
      setMessage('Could not resend the code. Please try again.');
    } finally {
      setBusy(false);
    }
  }, [phone, service, store]);

  if (!challenge) return <ActivityIndicator style={styles.loading} />;
  const canResend = resendIn === 0 && challenge.resendsLeft > 0 && !busy && !locked;

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Enter verification code</Text>
      <Text style={styles.muted}>Sent to {maskPhone(phone)}</Text>
      <OtpInput value={code} onChange={onChange} disabled={busy || locked} error={!!message && !message.startsWith('A new')} />
      {busy ? <ActivityIndicator /> : null}
      {message ? (
        <Text style={styles.message} accessibilityRole="alert" accessibilityLiveRegion="assertive">
          {message}
        </Text>
      ) : null}
      <Text style={styles.muted} testID="expiry">
        {expiresIn > 0 ? `Code expires in ${formatMmSs(expiresIn)}` : 'Code expired'}
      </Text>
      {challenge.resendsLeft <= 0 ? (
        <Text style={styles.muted}>No more resends. Contact support if you did not get a code.</Text>
      ) : resendIn > 0 ? (
        <Text style={styles.muted} testID="resend-timer" accessibilityLiveRegion="polite">
          Resend code in {formatMmSs(resendIn)}
        </Text>
      ) : (
        <Button title="Resend code" variant="text" onPress={resend} disabled={!canResend} />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  loading: { flex: 1 },
  container: { flex: 1, padding: spacing.xl, gap: spacing.lg, alignItems: 'center' },
  title: { fontSize: 22, fontWeight: '700' },
  muted: { color: colors.muted },
  message: { color: colors.error, textAlign: 'center' },
});
