import { Text } from 'react-native';

/**
 * FIX: derive it during render, do not copy props into state. If the child
 * needs its own editable copy that resets per item, give it `key={item.id}`
 * so React remounts it with fresh state.
 */
export function GreetingFixed({ name }: { name: string }) {
  return <Text testID="greeting">{`Hello, ${name}`}</Text>;
}
