import { useEffect, useRef, useState } from 'react';
import { Keyboard, Text } from 'react-native';

/**
 * FIX: subscribe once and return the cleanup (`sub.remove()`). The latest
 * callback lives in a ref, so a new `onShow` prop does not resubscribe.
 * Same for AppState, Dimensions, Linking, NetInfo, BackHandler, intervals.
 */
export function KeyboardWatcherFixed({ onShow }: { onShow: () => void }) {
  const [renders, setRenders] = useState(0);
  const onShowRef = useRef(onShow);
  useEffect(() => {
    onShowRef.current = onShow;
  });
  useEffect(() => {
    const sub = Keyboard.addListener('keyboardDidShow', () => onShowRef.current());
    return () => sub.remove();
  }, []);
  return (
    <Text onPress={() => setRenders((r) => r + 1)} accessibilityRole="button">
      Re-render ({renders})
    </Text>
  );
}
