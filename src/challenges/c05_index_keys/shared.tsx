import { useState } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';

/** A row with LOCAL state (a checkbox), like a real "selected" or "expanded" row. */
export function TaskRow({ label, onDelete }: { label: string; onDelete: () => void }) {
  const [done, setDone] = useState(false);
  return (
    <View style={styles.row}>
      <Pressable
        accessibilityRole="checkbox"
        accessibilityState={{ checked: done }}
        accessibilityLabel={`Task ${label}`}
        onPress={() => setDone((d) => !d)}
        style={styles.flex}
      >
        <Text>
          {done ? '☑' : '☐'} Task {label}
        </Text>
      </Pressable>
      <Pressable accessibilityRole="button" accessibilityLabel={`Delete ${label}`} onPress={onDelete}>
        <Text>🗑</Text>
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({ row: { flexDirection: 'row', padding: 12 }, flex: { flex: 1 } });
