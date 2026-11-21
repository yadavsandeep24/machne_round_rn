import { memo } from 'react';
import { Pressable, StyleSheet, Text } from 'react-native';

import { useAppDispatch, useAppSelector } from '../../app/store';
import { colors, spacing } from '../../ui/theme';
import { selectIsFavorite, toggleFavorite } from './favoritesSlice';

/**
 * Selects ONE boolean, so useSelector re-renders only this button when its
 * id flips, not the whole list. The answer to "how do you avoid re-rendering
 * every row?".
 */
export const FavoriteButton = memo(function FavoriteButton({ id }: { id: number }) {
  const dispatch = useAppDispatch();
  const isFavorite = useAppSelector((s) => selectIsFavorite(s, id));
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={isFavorite ? 'Remove from favorites' : 'Add to favorites'}
      hitSlop={8}
      onPress={() => dispatch(toggleFavorite(id))}
      style={styles.button}
    >
      <Text style={[styles.icon, isFavorite && styles.on]}>{isFavorite ? '♥' : '♡'}</Text>
    </Pressable>
  );
});

const styles = StyleSheet.create({
  button: { padding: spacing.sm },
  icon: { fontSize: 22, color: colors.muted },
  on: { color: '#E53935' },
});
