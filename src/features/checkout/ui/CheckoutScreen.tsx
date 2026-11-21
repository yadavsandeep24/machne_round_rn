import { useMemo, useState } from 'react';
import { ActivityIndicator, Pressable, StyleSheet, Text, View } from 'react-native';

import { Button } from '../../../core/ui/StateViews';
import { colors, spacing } from '../../../ui/theme';
import type { CreatePaymentRequest } from '../data/gateway';
import { formatMoney, sumMoney, type Money } from '../domain/money';
import type { PaymentMethod } from '../domain/paymentMachine';
import { usePayment, type PaymentDeps } from './usePayment';

export interface CartLine {
  id: string;
  title: string;
  price: Money;
}

export function CheckoutScreen({ orderId, lines, deps }: { orderId: string; lines: CartLine[]; deps: PaymentDeps }) {
  const [method, setMethod] = useState<PaymentMethod>('upi');
  const total = useMemo(() => sumMoney(lines.map((l) => l.price), 'INR'), [lines]);
  const request: CreatePaymentRequest = useMemo(() => ({ orderId, amount: total, method }), [orderId, total, method]);
  const { state, pay, checkAgain, reset } = usePayment(request, deps);

  switch (state.status) {
    case 'initiating':
    case 'processing':
      return (
        <Centered>
          <ActivityIndicator size="large" color={colors.primary} />
          <Text style={styles.h2}>Processing payment…</Text>
          <Text style={styles.muted}>Please don’t close the app or press back.</Text>
        </Centered>
      );
    case 'awaitingAuthorization':
      return (
        <Centered>
          <ActivityIndicator size="large" color={colors.primary} />
          <Text style={styles.h2}>Approve the payment in your UPI app</Text>
          <Text style={styles.muted}>Come back here after approving. We’ll confirm automatically.</Text>
        </Centered>
      );
    case 'succeeded':
      return (
        <Centered>
          <Text style={styles.big}>✓</Text>
          <Text style={styles.h2}>Paid {formatMoney(total)}</Text>
          <Text style={styles.muted}>Payment ID {state.paymentId}</Text>
        </Centered>
      );
    case 'unknown':
      return (
        <Centered>
          <Text style={styles.h2}>We’re confirming your payment</Text>
          <Text style={styles.muted}>
            This is taking longer than usual. You will not be charged twice; if money was debited and the
            payment fails, it is refunded automatically.
          </Text>
          <Button title="Check status" onPress={checkAgain} />
        </Centered>
      );
    case 'idle':
    case 'failed':
      return (
        <View style={styles.container}>
          <Text style={styles.h2}>Order summary</Text>
          {lines.map((l) => (
            <View key={l.id} style={styles.line}>
              <Text style={styles.flex}>{l.title}</Text>
              <Text>{formatMoney(l.price)}</Text>
            </View>
          ))}
          <View style={[styles.line, styles.totalLine]}>
            <Text style={styles.bold}>Total</Text>
            <Text style={styles.bold} testID="total">
              {formatMoney(total)}
            </Text>
          </View>

          <Text style={styles.h2}>Pay with</Text>
          <View accessibilityRole="radiogroup">
            {(['upi', 'card'] as const).map((m) => (
              <Pressable
                key={m}
                accessibilityRole="radio"
                accessibilityState={{ selected: method === m }}
                onPress={() => setMethod(m)}
                style={[styles.method, method === m && styles.methodOn]}
              >
                <Text>{m === 'upi' ? 'UPI app' : 'Card (hosted by the gateway SDK)'}</Text>
              </Pressable>
            ))}
          </View>

          {state.status === 'failed' ? (
            <Text style={styles.error} accessibilityRole="alert">
              {state.reason}
            </Text>
          ) : null}
          <Button
            title={state.status === 'failed' ? `Try again · ${formatMoney(total)}` : `Pay ${formatMoney(total)}`}
            onPress={() => {
              if (state.status === 'failed') reset();
              void pay();
            }}
          />
        </View>
      );
  }
}

function Centered({ children }: { children: React.ReactNode }) {
  return <View style={styles.centered}>{children}</View>;
}

const styles = StyleSheet.create({
  flex: { flex: 1 },
  container: { flex: 1, padding: spacing.lg, gap: spacing.md },
  centered: { flex: 1, alignItems: 'center', justifyContent: 'center', padding: spacing.xl, gap: spacing.md },
  h2: { fontSize: 18, fontWeight: '700', textAlign: 'center' },
  big: { fontSize: 56, color: colors.success },
  muted: { color: colors.muted, textAlign: 'center' },
  line: { flexDirection: 'row', justifyContent: 'space-between' },
  totalLine: { borderTopWidth: StyleSheet.hairlineWidth, borderTopColor: colors.border, paddingTop: spacing.sm },
  bold: { fontWeight: '700' },
  method: { padding: spacing.md, borderRadius: 10, borderWidth: 1, borderColor: colors.border, marginBottom: spacing.sm },
  methodOn: { borderColor: colors.primary, backgroundColor: '#EEF0FB' },
  error: { color: colors.error },
});
