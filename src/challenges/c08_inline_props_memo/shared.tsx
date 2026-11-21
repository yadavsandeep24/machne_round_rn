import { memo } from 'react';
import { Pressable, Text } from 'react-native';

export const rowRenders = new Map<number, number>();

/** memo'd row: re-renders only if a prop changes identity. Counts renders (debug). */
export const UserRow = memo(function UserRow({
  id,
  selected,
  onPress,
  style,
}: {
  id: number;
  selected: boolean;
  onPress: (id: number) => void;
  style?: object;
}) {
  rowRenders.set(id, (rowRenders.get(id) ?? 0) + 1);
  return (
    <Pressable accessibilityRole="button" onPress={() => onPress(id)} style={style}>
      <Text>
        {selected ? '★' : '☆'} User {id}
      </Text>
    </Pressable>
  );
});
