import { NavigationContainer } from '@react-navigation/native';
import { StatusBar } from 'expo-status-bar';
import { useState } from 'react';
import { Provider } from 'react-redux';
import { SafeAreaProvider } from 'react-native-safe-area-context';

import { ServicesProvider } from './src/app/ServicesContext';
import { createServices, type Services } from './src/app/services';
import { makeStore } from './src/app/store';
import { RootNavigator } from './src/navigation/RootNavigator';

export default function App({ services }: { services?: Services }) {
  // Created once per app instance (not per render). Tests inject fakes.
  const [resolved] = useState(() => services ?? createServices());
  const [store] = useState(() => makeStore(resolved));
  return (
    <ServicesProvider services={resolved}>
      <Provider store={store}>
        <SafeAreaProvider>
          <NavigationContainer>
            <RootNavigator />
          </NavigationContainer>
          <StatusBar style="auto" />
        </SafeAreaProvider>
      </Provider>
    </ServicesProvider>
  );
}
