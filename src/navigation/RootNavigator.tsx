import { createNativeStackNavigator } from '@react-navigation/native-stack';

import { LoadingView } from '../core/ui/StateViews';
import { useAuth } from '../features/auth/ui/AuthContext';
import { LoginScreen } from '../features/auth/ui/LoginScreen';
import { ProfileScreen } from '../features/auth/ui/ProfileScreen';

export type RootStackParamList = { Login: undefined; Profile: undefined };

const Stack = createNativeStackNavigator<RootStackParamList>();

/**
 * React Navigation's auth-flow pattern: render different screens for each
 * auth state instead of navigating imperatively. Signing out (or an expired
 * refresh token) swaps the stack, and the back button cannot return to a
 * protected screen.
 */
export function RootNavigator() {
  const { status } = useAuth();
  if (status === 'restoring') return <LoadingView />;
  return (
    <Stack.Navigator>
      {status === 'signedIn' ? (
        <Stack.Screen name="Profile" component={ProfileScreen} />
      ) : (
        <Stack.Screen name="Login" component={LoginScreen} options={{ headerShown: false }} />
      )}
    </Stack.Navigator>
  );
}
