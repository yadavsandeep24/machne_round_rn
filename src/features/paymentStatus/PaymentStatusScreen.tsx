import { useState } from 'react';
import { ActivityIndicator, StyleSheet, Switch, Text, View } from 'react-native';

import { useServices } from '../../app/ServicesContext';
import { userMessage } from '../../core/error/appError';
import { Button } from '../../core/ui/StateViews';
import { colors, spacing } from '../../ui/theme';
import type { PaymentStatus } from './paymentStatusApi';
import { usePaymentStatusPolling } from './usePaymentStatusPolling';

const STATUS_LABEL: Record<PaymentStatus, string> = {
  pending: 'Waiting for the bank…',
  succeeded: 'Payment successful',
  failed: 'Payment failed',
};

/**
 * After checkout we poll the payment until the bank confirms it. While
 * waiting, the user can change "Email me a receipt". The settle handler must
 * use the LATEST choice, and flipping the switch must NOT restart polling.
 */
export function PaymentStatusScreen({ intervalMs = 1500 }: { intervalMs?: number }) {
  const { payments } = useServices();
  const [attempt, setAttempt] = useState(1);
  const [simulateFailure, setSimulateFailure] = useState(false);
  const [paymentId, setPaymentId] = useState('pay_1');
  const [emailReceipt, setEmailReceipt] = useState(false);
  const [outcome, setOutcome] = useState<string | null>(null);

  const snapshot = usePaymentStatusPolling({
    api: payments,
    paymentId,
    intervalMs,
    // A new inline function on every render. It reads the latest `emailReceipt`.
    onSettled: (status) => {
      if (status === 'failed') setOutcome('No money was taken. You can try again.');
      else setOutcome(emailReceipt ? 'Receipt sent to your email.' : 'No receipt requested.');
    },
  });

  const startNewPayment = () => {
    const next = attempt + 1;
    setAttempt(next);
    setOutcome(null);
    setPaymentId(simulateFailure ? `pay_${next}-fail` : `pay_${next}`);
  };

  const pending = snapshot.status === 'pending' && !snapshot.timedOut;

  return (
    <View style={styles.container}>
      <Text style={styles.caption}>Payment {paymentId}</Text>
      <View style={styles.statusRow}>
        {pending ? <ActivityIndicator accessibilityLabel="Checking payment status" /> : null}
        <Text style={[styles.status, snapshot.status === 'failed' && styles.failed]}>
          {snapshot.timedOut ? 'Still processing. We will notify you.' : STATUS_LABEL[snapshot.status]}
        </Text>
      </View>
      <Text style={styles.caption} accessibilityLabel={`Status checks: ${snapshot.attempts}`}>
        Status checks: {snapshot.attempts}
      </Text>
      {snapshot.error ? <Text style={styles.failed}>{userMessage(snapshot.error)}</Text> : null}
      {outcome ? <Text style={styles.outcome}>{outcome}</Text> : null}

      <View style={styles.row}>
        <Text>Email me a receipt</Text>
        <Switch accessibilityLabel="Email me a receipt" value={emailReceipt} onValueChange={setEmailReceipt} />
      </View>
      <View style={styles.row}>
        <Text>Next payment fails (demo)</Text>
        <Switch accessibilityLabel="Next payment fails" value={simulateFailure} onValueChange={setSimulateFailure} />
      </View>
      <Button title="Start a new payment" onPress={startNewPayment} disabled={pending} />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, padding: spacing.xl, gap: spacing.md, backgroundColor: colors.background },
  statusRow: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm },
  status: { fontSize: 22, fontWeight: '600', color: colors.text },
  failed: { color: colors.error },
  outcome: { color: colors.success, fontSize: 16 },
  caption: { color: colors.muted },
  row: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
});
