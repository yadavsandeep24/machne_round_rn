import { createContext, memo, useCallback, useContext, useMemo, useState } from 'react';
import { Text, View } from 'react-native';

import { Button } from '../../core/ui/StateViews';
import { countRender } from './shared';

/**
 * FAST: split contexts by how often they change, memoise each value, and
 * memo the consumers so a parent re-render does not cascade. For app-wide
 * state that changes often, a store with selectors (Redux, Zustand) re-renders
 * only the components whose selected slice changed.
 */
const ThemeContext = createContext('light');
const CartContext = createContext<{ cartCount: number; add: () => void } | null>(null);

const ThemeLabel = memo(function ThemeLabel() {
  const theme = useContext(ThemeContext);
  countRender('theme');
  return <Text>Theme: {theme}</Text>;
});

const CartBadge = memo(function CartBadge() {
  const cart = useContext(CartContext)!;
  countRender('cart');
  return <Button title={`Cart (${cart.cartCount})`} onPress={cart.add} />;
});

export function AppFixed() {
  const [cartCount, setCartCount] = useState(0);
  const add = useCallback(() => setCartCount((c) => c + 1), []);
  const cart = useMemo(() => ({ cartCount, add }), [cartCount, add]);
  return (
    <ThemeContext.Provider value="light">
      <CartContext.Provider value={cart}>
        <View>
          <ThemeLabel />
          <CartBadge />
        </View>
      </CartContext.Provider>
    </ThemeContext.Provider>
  );
}
