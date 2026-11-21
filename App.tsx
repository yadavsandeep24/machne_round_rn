import { NavigationContainer } from '@react-navigation/native';
import { StatusBar } from 'expo-status-bar';
import { useState } from 'react';
import { Provider } from 'react-redux';
import { SafeAreaProvider } from 'react-native-safe-area-context';

import { createServices, type Services } from './src/app/services';
import { makeStore } from './src/app/store';
import { RootNavigator } from './src/navigation/RootNavigator';

export default function App({ services }: { services?: Services }) {
  // Created once per app instance (not per render). Tests inject fakes.
  const [store] = useState(() => makeStore(services ?? createServices()));
  return (
    <Provider store={store}>
      <SafeAreaProvider>
        <NavigationContainer>
          <RootNavigator />
        </NavigationContainer>
        <StatusBar style="auto" />
      </SafeAreaProvider>
    </Provider>
  );
}
