import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { useCallback } from 'react';
import { Alert, ScrollView } from 'react-native';

import { DEALS } from '../features/carousel/demoProducts';
import { ProductCarousel } from '../features/carousel/ui/ProductCarousel';

export type RootStackParamList = { Home: undefined };

const Stack = createNativeStackNavigator<RootStackParamList>();

function HomeScreen() {
  const open = useCallback((id: string) => Alert.alert('Open product', id), []);
  // A vertical ScrollView with a few horizontal FlatLists is fine (different
  // axes). A vertical FlatList inside a vertical ScrollView is not.
  return (
    <ScrollView>
      <ProductCarousel title="Today's deals" products={DEALS} onPressProduct={open} />
      <ProductCarousel title="Recently viewed" products={DEALS.slice(0, 4)} onPressProduct={open} />
    </ScrollView>
  );
}

export function RootNavigator() {
  return (
    <Stack.Navigator>
      <Stack.Screen name="Home" component={HomeScreen} options={{ title: 'Shop' }} />
    </Stack.Navigator>
  );
}
