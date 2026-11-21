import { createNativeStackNavigator } from '@react-navigation/native-stack';

import { PostDetailScreen } from '../features/posts/ui/PostDetailScreen';
import { PostsScreen } from '../features/posts/ui/PostsScreen';

export type RootStackParamList = {
  Posts: undefined;
  PostDetail: { id: number };
};

const Stack = createNativeStackNavigator<RootStackParamList>();

export function RootNavigator() {
  return (
    <Stack.Navigator>
      <Stack.Screen name="Posts" component={PostsScreen} />
      <Stack.Screen name="PostDetail" component={PostDetailScreen} options={{ title: 'Post' }} />
    </Stack.Navigator>
  );
}
