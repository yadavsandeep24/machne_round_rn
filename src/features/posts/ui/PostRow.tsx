import { memo } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';

import { colors, spacing } from '../../../ui/theme';
import type { Post } from '../domain/post';

/** memo: a row re-renders only when its own props change. */
export const PostRow = memo(function PostRow({
  post,
  onPress,
  right,
}: {
  post: Post;
  onPress?: (id: number) => void;
  right?: React.ReactNode;
}) {
  return (
    <Pressable
      accessibilityRole="button"
      onPress={onPress ? () => onPress(post.id) : undefined}
      style={({ pressed }) => [styles.row, pressed && styles.pressed]}
    >
      <View style={styles.avatar}>
        <Text style={styles.avatarText}>{post.id}</Text>
      </View>
      <View style={styles.texts}>
        <Text numberOfLines={1} style={styles.title}>
          {post.title}
        </Text>
        <Text numberOfLines={2} style={styles.body}>
          {post.body}
        </Text>
      </View>
      {right}
    </Pressable>
  );
});

export const ROW_HEIGHT = 76;

const styles = StyleSheet.create({
  row: {
    height: ROW_HEIGHT,
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: spacing.lg,
    gap: spacing.md,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: colors.border,
    backgroundColor: colors.background,
  },
  pressed: { backgroundColor: colors.surface },
  avatar: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: colors.surface,
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarText: { color: colors.primary, fontWeight: '600' },
  texts: { flex: 1 },
  title: { fontWeight: '600', color: colors.text },
  body: { color: colors.muted, marginTop: 2 },
});
