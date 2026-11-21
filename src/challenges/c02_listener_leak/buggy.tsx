import { useEffect, useState } from 'react';
import { Keyboard, Text } from 'react-native';

/**
 * BUG: "keyboard handler fires many times / memory grows". The effect has no
 * dependency array and no cleanup, so EVERY render adds another listener
 * and none is ever removed, even after the screen closes.
 */
export function KeyboardWatcherBuggy({ onShow }: { onShow: () => void }) {
  const [renders, setRenders] = useState(0);
  useEffect(() => {
    Keyboard.addListener('keyboardDidShow', onShow);
  });
  return (
    <Text onPress={() => setRenders((r) => r + 1)} accessibilityRole="button">
      Re-render ({renders})
    </Text>
  );
}
