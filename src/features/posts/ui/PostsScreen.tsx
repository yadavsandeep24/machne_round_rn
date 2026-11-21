import { useNavigation } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { useCallback, useEffect } from 'react';
import { FlatList, RefreshControl, StyleSheet, Text, View } from 'react-native';

import { useAppDispatch, useAppSelector } from '../../../app/store';
import { userMessage } from '../../../core/error/appError';
import { EmptyView, ErrorView, LoadingView, LoadMoreFooter } from '../../../core/ui/StateViews';
import type { RootStackParamList } from '../../../navigation/RootNavigator';
import { colors, spacing } from '../../../ui/theme';
import type { Post } from '../domain/post';
import { loadCachedPosts, loadNextPage, refreshPosts } from '../state/postsSlice';
import { PostRow, ROW_HEIGHT } from './PostRow';

const keyExtractor = (p: Post) => String(p.id);
const getItemLayout = (_: unknown, index: number) => ({
  length: ROW_HEIGHT,
  offset: ROW_HEIGHT * index,
  index,
});

export function PostsScreen() {
  const dispatch = useAppDispatch();
  const navigation = useNavigation<NativeStackNavigationProp<RootStackParamList>>();
  const { status, items, isRefreshing, error, isLoadingMore, hasReachedEnd, loadMoreError } =
    useAppSelector((s) => s.posts);

  useEffect(() => {
    dispatch(loadCachedPosts());
    dispatch(refreshPosts());
  }, [dispatch]);

  const onRefresh = useCallback(() => {
    dispatch(refreshPosts());
  }, [dispatch]);
  // The thunk's `condition` guards make repeated onEndReached calls harmless.
  const onEndReached = useCallback(() => {
    dispatch(loadNextPage());
  }, [dispatch]);
  const retryLoadMore = useCallback(() => {
    dispatch(loadNextPage({ isRetry: true }));
  }, [dispatch]);

  // Stable callbacks keep memoised rows from re-rendering.
  const openPost = useCallback((id: number) => navigation.navigate('PostDetail', { id }), [navigation]);
  const renderItem = useCallback(
    ({ item }: { item: Post }) => <PostRow post={item} onPress={openPost} />,
    [openPost],
  );

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
        onEndReached={onEndReached}
        onEndReachedThreshold={0.5}
        ListFooterComponent={
          hasReachedEnd ? undefined : (
            <LoadMoreFooter
              loading={isLoadingMore}
              errorMessage={loadMoreError ? userMessage(loadMoreError) : undefined}
              onRetry={retryLoadMore}
            />
          )
        }
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
