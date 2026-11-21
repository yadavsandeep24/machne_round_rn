import { useState } from 'react';
import { Text } from 'react-native';

/**
 * BUG: "the header still shows the old user after switching account". useState
 * uses its argument only on the FIRST render; later prop changes are ignored.
 */
export function GreetingBuggy({ name }: { name: string }) {
  const [display] = useState(`Hello, ${name}`);
  return <Text testID="greeting">{display}</Text>;
}
