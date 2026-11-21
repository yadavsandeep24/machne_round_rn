import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { useState } from 'react';
import { StyleSheet, Text, View } from 'react-native';

import { useServices } from '../app/ServicesContext';
import { createFakeOtpService } from '../features/otp/data/otpService';
import { OtpScreen } from '../features/otp/ui/OtpScreen';

export type RootStackParamList = { Otp: undefined };

const Stack = createNativeStackNavigator<RootStackParamList>();
const service = createFakeOtpService(); // demo code: 123456

function OtpRoute() {
  const { store } = useServices();
  const [verified, setVerified] = useState(false);
  if (verified) {
    return (
      <View style={styles.center}>
        <Text style={styles.done}>Verified ✓</Text>
      </View>
    );
  }
  return <OtpScreen phone="+91 98765 43210" service={service} store={store} onVerified={() => setVerified(true)} />;
}

export function RootNavigator() {
  return (
    <Stack.Navigator>
      <Stack.Screen name="Otp" component={OtpRoute} options={{ title: 'Verify' }} />
    </Stack.Navigator>
  );
}

const styles = StyleSheet.create({
  center: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  done: { fontSize: 24, fontWeight: '700' },
});
