import { useState } from 'react';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';

import { colors, spacing } from '../../ui/theme';
import { METHODS, MethodPanels, type Method } from './MethodPanels';
import { createFakeUpiApi, type UpiApi } from './upiApi';

const defaultApi = createFakeUpiApi();

type Props = { upiApi?: UpiApi; pollIntervalMs?: number; amountLabel?: string };

export function CheckoutScreen({ upiApi = defaultApi, pollIntervalMs = 2000, amountLabel = '₹1,499.00' }: Props) {
  const [method, setMethod] = useState<Method>('upi');

  return (
    <ScrollView contentContainerStyle={styles.container} keyboardShouldPersistTaps="handled">
      <Text style={styles.amount}>Pay {amountLabel}</Text>
      <View style={styles.tabs} accessibilityRole="tablist">
        {METHODS.map(({ key, label }) => (
          <Pressable
            key={key}
            accessibilityRole="tab"
            accessibilityState={{ selected: method === key }}
            onPress={() => setMethod(key)}
            style={[styles.tab, method === key && styles.tabSelected]}
          >
            <Text style={method === key ? styles.tabTextSelected : undefined}>{label}</Text>
          </Pressable>
        ))}
      </View>
      <MethodPanels selected={method} upiApi={upiApi} pollIntervalMs={pollIntervalMs} />
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { paddingVertical: spacing.lg, backgroundColor: colors.background, flexGrow: 1 },
  amount: { fontSize: 22, fontWeight: '700', color: colors.text, paddingHorizontal: spacing.lg },
  tabs: { flexDirection: 'row', gap: spacing.sm, paddingHorizontal: spacing.lg, paddingTop: spacing.lg },
  tab: { paddingVertical: spacing.sm, paddingHorizontal: spacing.md, borderRadius: 16, backgroundColor: colors.surface },
  tabSelected: { backgroundColor: colors.primary },
  tabTextSelected: { color: colors.background, fontWeight: '600' },
});
