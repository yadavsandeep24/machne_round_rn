import { useCallback, useEffect } from 'react';
import { FlatList, RefreshControl, StyleSheet, Text, View } from 'react-native';

import { useAppDispatch, useAppSelector } from '../../../app/store';
import { userMessage } from '../../../core/error/appError';
import { EmptyView, ErrorView, LoadingView } from '../../../core/ui/StateViews';
import { colors, spacing } from '../../../ui/theme';
import type { Post } from '../domain/post';
import { loadCachedPosts, refreshPosts } from '../state/postsSlice';
import { PostRow, ROW_HEIGHT } from './PostRow';

const keyExtractor = (p: Post) => String(p.id);
const getItemLayout = (_: unknown, index: number) => ({
  length: ROW_HEIGHT,
  offset: ROW_HEIGHT * index,
  index,
});

export function PostsScreen() {
  const dispatch = useAppDispatch();
  const { status, items, isRefreshing, error } = useAppSelector((s) => s.posts);

  useEffect(() => {
    dispatch(loadCachedPosts());
    dispatch(refreshPosts());
  }, [dispatch]);

  const onRefresh = useCallback(() => {
    dispatch(refreshPosts());
  }, [dispatch]);
  const renderItem = useCallback(({ item }: { item: Post }) => <PostRow post={item} />, []);

  if (status === 'loading') return <LoadingView />;
  if (status === 'failure') {
    return <ErrorView message={userMessage(error ?? { kind: 'unknown' })} onRetry={onRefresh} />;
  }
  return (
    <View style={styles.flex}>
      {error ? (
        <Text style={styles.banner} accessibilityRole="alert">
          {userMessage(error)}
        </Text>
      ) : null}
      <FlatList
        data={items}
        keyExtractor={keyExtractor}
        renderItem={renderItem}
        getItemLayout={getItemLayout}
        refreshControl={<RefreshControl refreshing={isRefreshing} onRefresh={onRefresh} />}
        // Empty state inside the list so pull-to-refresh still works.
        ListEmptyComponent={<EmptyView message="No posts yet" />}
        contentContainerStyle={items.length === 0 ? styles.flex : undefined}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1 },
  banner: {
    backgroundColor: '#FDECEA',
    color: colors.error,
    padding: spacing.md,
    textAlign: 'center',
  },
});
