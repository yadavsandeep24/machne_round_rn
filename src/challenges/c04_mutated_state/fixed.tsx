import { useState } from 'react';
import { Text, View } from 'react-native';

import { Button } from '../../core/ui/StateViews';

/** FIX: always produce a new array/object: spread, map, filter, or Immer. */
export function CartFixed() {
  const [items, setItems] = useState<string[]>([]);
  return (
    <View>
      <Text>Items in cart: {items.length}</Text>
      <Button title="Add" onPress={() => setItems((prev) => [...prev, 'Shoe'])} />
    </View>
  );
}
