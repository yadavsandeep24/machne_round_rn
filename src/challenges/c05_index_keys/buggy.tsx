import { useState } from 'react';
import { FlatList } from 'react-native';

import { TaskRow } from './shared';

/**
 * BUG: check B, delete A: now C looks checked. keyExtractor returns the
 * INDEX, so after a removal the row state at index 1 is reused for the item
 * that moved into index 1.
 */
export function TasksBuggy() {
  const [items, setItems] = useState(['A', 'B', 'C', 'D']);
  return (
    <FlatList
      data={items}
      keyExtractor={(_, index) => String(index)}
      renderItem={({ item }) => <TaskRow label={item} onDelete={() => setItems((xs) => xs.filter((x) => x !== item))} />}
    />
  );
}
