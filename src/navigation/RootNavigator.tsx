import { createNativeStackNavigator } from '@react-navigation/native-stack';

import { ChallengeListScreen, ChallengeScreen } from '../challenges/ChallengesScreens';

export type RootStackParamList = { Challenges: undefined; Challenge: { id: number } };

const Stack = createNativeStackNavigator<RootStackParamList>();

export function RootNavigator() {
  return (
    <Stack.Navigator>
      <Stack.Screen name="Challenges" component={ChallengeListScreen} options={{ title: 'Bugs & optimisation: top 10' }} />
      <Stack.Screen name="Challenge" component={ChallengeScreen} options={{ title: 'Challenge' }} />
    </Stack.Navigator>
  );
}
