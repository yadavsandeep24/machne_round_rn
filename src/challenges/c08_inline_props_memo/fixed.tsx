import { useCallback, useState } from 'react';
import { FlatList, StyleSheet } from 'react-native';

import { UserRow } from './shared';

const IDS = Array.from({ length: 30 }, (_, i) => i);
const keyExtractor = (id: number) => String(id);

/**
 * FAST: stable callback (useCallback with a functional update), styles from
 * StyleSheet (created once), renderItem memoised. Now a tap re-renders only
 * the two rows whose `selected` changed. Pass `extraData` when renderItem
 * depends on state outside `data`.
 */
export function UsersFixed() {
  const [selected, setSelected] = useState<number | null>(null);
  const onPress = useCallback((id: number) => setSelected(id), []);
  const renderItem = useCallback(
    ({ item }: { item: number }) => (
      <UserRow id={item} selected={item === selected} onPress={onPress} style={styles.row} />
    ),
    [selected, onPress],
  );
  return <FlatList data={IDS} keyExtractor={keyExtractor} renderItem={renderItem} extraData={selected} />;
}

const styles = StyleSheet.create({ row: { padding: 12 } });
