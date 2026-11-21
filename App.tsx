import { NavigationContainer } from '@react-navigation/native';
import { StatusBar } from 'expo-status-bar';
import { useState } from 'react';
import { Provider } from 'react-redux';
import { SafeAreaProvider } from 'react-native-safe-area-context';

import { ServicesProvider } from './src/app/ServicesContext';
import { createServices, type Services } from './src/app/services';
import { makeStore } from './src/app/store';
import { AuthProvider } from './src/features/auth/ui/AuthContext';
import { RootNavigator } from './src/navigation/RootNavigator';

export default function App({ services: injected }: { services?: Services }) {
  const [services] = useState(() => injected ?? createServices());
  const [store] = useState(() => makeStore(services));
  return (
    <ServicesProvider services={services}>
      <AuthProvider tokens={services.tokens} authApi={services.authApi} expiredSignal={services.sessionExpired}>
        <Provider store={store}>
          <SafeAreaProvider>
            <NavigationContainer>
              <RootNavigator />
            </NavigationContainer>
            <StatusBar style="auto" />
          </SafeAreaProvider>
        </Provider>
      </AuthProvider>
    </ServicesProvider>
  );
}
