import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { useState } from 'react';
import { StyleSheet, Text, View } from 'react-native';

import { Button } from '../core/ui/StateViews';
import { usersApi } from '../features/datatable/api/usersApi';
import { DataTable } from '../features/datatable/refactored/DataTable';
import { DataTableStarter } from '../features/datatable/starter/DataTableStarter';

export type RootStackParamList = { DataTable: undefined };

const Stack = createNativeStackNavigator<RootStackParamList>();

/** Toggle between the starter the interviewer gives you and the refactor. */
function DataTableDemo() {
  const [refactored, setRefactored] = useState(true);
  return (
    <View style={styles.flex}>
      <View style={styles.toggle}>
        <Text>{refactored ? 'Refactored' : 'Starter (with bugs)'}</Text>
        <Button
          variant="text"
          title={refactored ? 'Show starter' : 'Show refactor'}
          onPress={() => setRefactored((r) => !r)}
        />
      </View>
      {refactored ? <DataTable api={usersApi} /> : <DataTableStarter api={usersApi} />}
    </View>
  );
}

export function RootNavigator() {
  return (
    <Stack.Navigator>
      <Stack.Screen name="DataTable" component={DataTableDemo} options={{ title: 'Users table' }} />
    </Stack.Navigator>
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1 },
  toggle: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 16 },
});
