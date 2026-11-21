import { createContext, useContext, useState } from 'react';
import { Text, View } from 'react-native';

import { Button } from '../../core/ui/StateViews';
import { countRender } from './shared';

/**
 * SLOW: one "AppContext" holding everything, with a NEW value object on every
 * render. Changing the cart count re-renders every consumer, including ones
 * that only read the theme.
 */
const AppContext = createContext<{ theme: string; cartCount: number; add: () => void } | null>(null);

function ThemeLabel() {
  const ctx = useContext(AppContext)!;
  countRender('theme');
  return <Text>Theme: {ctx.theme}</Text>;
}

function CartBadge() {
  const ctx = useContext(AppContext)!;
  countRender('cart');
  return <Button title={`Cart (${ctx.cartCount})`} onPress={ctx.add} />;
}

export function AppBuggy() {
  const [cartCount, setCartCount] = useState(0);
  return (
    <AppContext.Provider value={{ theme: 'light', cartCount, add: () => setCartCount((c) => c + 1) }}>
      <View>
        <ThemeLabel />
        <CartBadge />
      </View>
    </AppContext.Provider>
  );
}
