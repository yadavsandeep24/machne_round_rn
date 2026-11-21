import { useState } from 'react';
import { FlatList } from 'react-native';

import { UserRow } from './shared';

const IDS = Array.from({ length: 30 }, (_, i) => i);

/**
 * SLOW: rows are wrapped in React.memo, yet one tap re-renders every visible
 * row. The parent passes a NEW function (`onPress`) and a NEW style object on
 * every render, so memo's shallow compare always fails.
 */
export function UsersBuggy() {
  const [selected, setSelected] = useState<number | null>(null);
  return (
    <FlatList
      data={IDS}
      keyExtractor={(id) => String(id)}
      renderItem={({ item }) => (
        <UserRow id={item} selected={item === selected} onPress={(id) => setSelected(id)} style={{ padding: 12 }} />
      )}
    />
  );
}
