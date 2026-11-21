import { memo } from 'react';
import { Text, View } from 'react-native';

export const SIZE = 2000;
export const ROW_HEIGHT = 48;
export const renders = { count: 0 };

export const Row = memo(function Row({ rank }: { rank: number }) {
  renders.count++;
  return (
    <View style={{ height: ROW_HEIGHT, justifyContent: 'center', paddingHorizontal: 16 }}>
      <Text>
        #{rank} Player {rank}
      </Text>
    </View>
  );
});
