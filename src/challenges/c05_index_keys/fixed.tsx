import { useState } from 'react';
import { FlatList } from 'react-native';

import { TaskRow } from './shared';

/** FIX: a stable id from the DATA. Better still, keep `done` in the model. */
export function TasksFixed() {
  const [items, setItems] = useState(['A', 'B', 'C', 'D']);
  return (
    <FlatList
      data={items}
      keyExtractor={(item) => item}
      renderItem={({ item }) => <TaskRow label={item} onDelete={() => setItems((xs) => xs.filter((x) => x !== item))} />}
    />
  );
}
