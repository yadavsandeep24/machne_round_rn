import { createNativeStackNavigator } from '@react-navigation/native-stack';

import { PaymentStatusScreen } from '../features/paymentStatus/PaymentStatusScreen';

export type RootStackParamList = {
  Home: undefined;
};

const Stack = createNativeStackNavigator<RootStackParamList>();

export function RootNavigator() {
  return (
    <Stack.Navigator>
      <Stack.Screen name="Home" component={PaymentStatusScreen} options={{ title: 'Payment status' }} />
    </Stack.Navigator>
  );
}
