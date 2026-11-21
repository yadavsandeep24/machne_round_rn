import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { useMemo } from 'react';
import { Linking } from 'react-native';

import { useServices } from '../app/ServicesContext';
import { createDemoGateway } from '../features/checkout/data/gateway';
import { CheckoutScreen, type CartLine } from '../features/checkout/ui/CheckoutScreen';

export type RootStackParamList = { Checkout: undefined };

const Stack = createNativeStackNavigator<RootStackParamList>();
const gateway = createDemoGateway();
const LINES: CartLine[] = [
  { id: 'a', title: 'Monthly plan', price: { minor: 49900, currency: 'INR' } },
  { id: 'b', title: 'GST (18%)', price: { minor: 8982, currency: 'INR' } },
];

function CheckoutRoute() {
  const { store } = useServices();
  const deps = useMemo(
    () => ({
      gateway,
      store,
      // In the demo there may be no UPI app installed: ignore failures.
      openUrl: (url: string) => Linking.openURL(url).catch(() => undefined),
      newKey: () => `idem_${Date.now()}_${Math.random().toString(36).slice(2)}`,
    }),
    [store],
  );
  return <CheckoutScreen orderId="order_1" lines={LINES} deps={deps} />;
}

export function RootNavigator() {
  return (
    <Stack.Navigator>
      <Stack.Screen name="Checkout" component={CheckoutRoute} />
    </Stack.Navigator>
  );
}
