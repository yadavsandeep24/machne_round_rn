import { useCallback, useState, type ComponentType } from 'react';
import { Keyboard, Text, TextInput, View } from 'react-native';

import { Button } from '../core/ui/StateViews';

/** C02: type in the field to show the keyboard; the count shows how many handlers fired. */
export function KeyboardDemo({ Watcher }: { Watcher: ComponentType<{ onShow: () => void }> }) {
  const [shows, setShows] = useState(0);
  const onShow = useCallback(() => setShows((n) => n + 1), []);
  return (
    <View style={{ padding: 16, gap: 12 }}>
      <Watcher onShow={onShow} />
      <TextInput placeholder="Tap here to open the keyboard" style={{ borderWidth: 1, padding: 8 }} />
      <Text>Handler calls: {shows}</Text>
      <Button title="Hide keyboard" onPress={() => Keyboard.dismiss()} variant="text" />
      <Text>Tap “Re-render” a few times, then open the keyboard once.</Text>
    </View>
  );
}

/** C03: counts API calls. */
export function ApiCallsDemo({ Search }: { Search: ComponentType<{ fetchResults: (q: { term: string; page: number }) => Promise<number> }> }) {
  const [calls, setCalls] = useState(0);
  const fetchResults = useCallback(async () => {
    setCalls((n) => n + 1);
    await new Promise((r) => setTimeout(r, 300));
    return 42;
  }, []);
  return (
    <View style={{ padding: 16, gap: 12 }}>
      <Search fetchResults={fetchResults} />
      <Text>API calls so far: {calls}</Text>
    </View>
  );
}

/** C06: switch the user prop. */
export function SwitchUserDemo({ Greeting }: { Greeting: ComponentType<{ name: string }> }) {
  const [name, setName] = useState('Ada');
  return (
    <View style={{ padding: 16, gap: 12 }}>
      <Greeting name={name} />
      <Button title="Switch account" onPress={() => setName((n) => (n === 'Ada' ? 'Grace' : 'Ada'))} />
      <Text>Prop name = {name}</Text>
    </View>
  );
}
