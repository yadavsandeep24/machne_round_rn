import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { useMemo } from 'react';

import { useServices } from '../app/ServicesContext';
import { createDiceStorage } from '../features/dice/data/historyStore';
import { DiceScreen } from '../features/dice/ui/DiceScreen';

export type RootStackParamList = { Dice: undefined };

const Stack = createNativeStackNavigator<RootStackParamList>();

function DiceRoute() {
  const { store } = useServices();
  const storage = useMemo(() => createDiceStorage(store), [store]);
  return <DiceScreen storage={storage} />;
}

export function RootNavigator() {
  return (
    <Stack.Navigator>
      <Stack.Screen name="Dice" component={DiceRoute} options={{ title: 'Dice Roller' }} />
    </Stack.Navigator>
  );
}
