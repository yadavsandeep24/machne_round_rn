import { FlatList, Text, View } from 'react-native';

const DATA = Array.from({ length: 200 }, (_, i) => `Story ${i}`);

/**
 * FIX: one scroll container. Put the header (and footer) INSIDE the list with
 * ListHeaderComponent / ListFooterComponent, or use a SectionList for mixed
 * content. Horizontal lists inside a vertical one are fine.
 */
export function FeedFixed() {
  return (
    <FlatList
      data={DATA}
      keyExtractor={(s) => s}
      renderItem={({ item }) => <Text>{item}</Text>}
      ListHeaderComponent={
        <View>
          <Text>Today&apos;s feed</Text>
        </View>
      }
    />
  );
}
