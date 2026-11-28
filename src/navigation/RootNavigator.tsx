import { createNativeStackNavigator } from '@react-navigation/native-stack';

import { CheckoutScreen } from '../features/checkout/CheckoutScreen';

export type RootStackParamList = {
  Home: undefined;
};

const Stack = createNativeStackNavigator<RootStackParamList>();

export function RootNavigator() {
  return (
    <Stack.Navigator>
      <Stack.Screen name="Home" component={CheckoutScreen} options={{ title: 'Checkout' }} />
    </Stack.Navigator>
  );
}
