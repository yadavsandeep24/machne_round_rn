import { FlatList } from 'react-native';

import { ROW_HEIGHT, Row, SIZE } from './shared';

const DATA = Array.from({ length: SIZE }, (_, i) => i + 1);
const keyExtractor = (n: number) => String(n);
const renderItem = ({ item }: { item: number }) => <Row rank={item} />;
const getItemLayout = (_: unknown, index: number) => ({ length: ROW_HEIGHT, offset: ROW_HEIGHT * index, index });

/**
 * FAST: FlatList renders a window around the viewport (initialNumToRender,
 * windowSize) and unmounts what scrolls far away; getItemLayout skips
 * measuring. FlashList recycles views for even bigger lists.
 */
export function LeaderboardFixed() {
  return (
    <FlatList
      data={DATA}
      keyExtractor={keyExtractor}
      renderItem={renderItem}
      getItemLayout={getItemLayout}
      initialNumToRender={15}
      windowSize={5}
    />
  );
}
