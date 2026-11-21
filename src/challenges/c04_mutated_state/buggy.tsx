import { useState } from 'react';
import { Text, View } from 'react-native';

import { Button } from '../../core/ui/StateViews';

/**
 * BUG: "cart count doesn't update after tapping Add". The array is mutated
 * and the SAME reference is set; React compares with Object.is and skips the
 * render. (Redux Toolkit's Immer hides this in reducers, but not in useState.)
 */
export function CartBuggy() {
  const [items, setItems] = useState<string[]>([]);
  return (
    <View>
      <Text>Items in cart: {items.length}</Text>
      <Button
        title="Add"
        onPress={() => {
          items.push('Shoe');
          setItems(items);
        }}
      />
    </View>
  );
}
