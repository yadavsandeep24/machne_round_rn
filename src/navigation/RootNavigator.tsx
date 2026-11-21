import { createNativeStackNavigator } from '@react-navigation/native-stack';

import { PostsScreen } from '../features/posts/ui/PostsScreen';

export type RootStackParamList = {
  Posts: undefined;
};

const Stack = createNativeStackNavigator<RootStackParamList>();

export function RootNavigator() {
  return (
    <Stack.Navigator>
      <Stack.Screen name="Posts" component={PostsScreen} />
    </Stack.Navigator>
  );
}
