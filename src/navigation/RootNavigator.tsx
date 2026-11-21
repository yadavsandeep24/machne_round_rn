import { createNativeStackNavigator } from '@react-navigation/native-stack';

import { createFakeTxnApi, makeTransactions } from '../features/txns/data/txnApi';
import { TransactionsScreen } from '../features/txns/ui/TransactionsScreen';

export type RootStackParamList = { Transactions: undefined };

const Stack = createNativeStackNavigator<RootStackParamList>();
const api = createFakeTxnApi(makeTransactions(200));

function TransactionsRoute() {
  return <TransactionsScreen api={api} />;
}

export function RootNavigator() {
  return (
    <Stack.Navigator>
      <Stack.Screen name="Transactions" component={TransactionsRoute} />
    </Stack.Navigator>
  );
}
