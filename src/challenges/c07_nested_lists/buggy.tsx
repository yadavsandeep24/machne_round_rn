import { FlatList, ScrollView, Text, View } from 'react-native';

const DATA = Array.from({ length: 200 }, (_, i) => `Story ${i}`);

/**
 * BUG: "VirtualizedLists should never be nested inside plain ScrollViews with
 * the same orientation". The outer ScrollView gives the FlatList unlimited
 * height, so it renders ALL 200 rows: virtualisation is gone and onEndReached
 * misfires.
 */
export function FeedBuggy() {
  return (
    <ScrollView>
      <View>
        <Text>Today&apos;s feed</Text>
      </View>
      <FlatList data={DATA} keyExtractor={(s) => s} renderItem={({ item }) => <Text>{item}</Text>} />
    </ScrollView>
  );
}
