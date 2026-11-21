import { useNavigation } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { useCallback, useEffect, useState } from 'react';
import { ActivityIndicator, FlatList, RefreshControl, StyleSheet, Text, View } from 'react-native';

import { useAppDispatch, useAppSelector } from '../../../app/store';
import { userMessage } from '../../../core/error/appError';
import { useDebouncedValue } from '../../../core/hooks/useDebouncedValue';
import { EmptyView, ErrorView, LoadingView, LoadMoreFooter } from '../../../core/ui/StateViews';
import type { RootStackParamList } from '../../../navigation/RootNavigator';
import { colors, spacing } from '../../../ui/theme';
import type { Post } from '../domain/post';
import {
  loadCachedPosts,
  loadNextPage,
  refreshPosts,
  searchCleared,
  searchPosts,
} from '../state/postsSlice';
import { PostRow, ROW_HEIGHT } from './PostRow';
import { SearchBar } from './SearchBar';

const keyExtractor = (p: Post) => String(p.id);
const getItemLayout = (_: unknown, index: number) => ({
  length: ROW_HEIGHT,
  offset: ROW_HEIGHT * index,
  index,
});

export function PostsScreen({ debounceMs = 300 }: { debounceMs?: number }) {
  const dispatch = useAppDispatch();
  const navigation = useNavigation<NativeStackNavigationProp<RootStackParamList>>();
  const posts = useAppSelector((s) => s.posts);

  // The input owns its text, so typing never waits for Redux or the network.
  const [text, setText] = useState('');
  const query = useDebouncedValue(text, debounceMs).trim();

  useEffect(() => {
    dispatch(loadCachedPosts());
    dispatch(refreshPosts());
  }, [dispatch]);

  useEffect(() => {
    if (query === '') {
      dispatch(searchCleared());
      return;
    }
    const request = dispatch(searchPosts({ query }));
    // A newer query (or leaving the screen) aborts this request.
    return () => request.abort();
  }, [dispatch, query]);

  const onRefresh = useCallback(() => {
    dispatch(refreshPosts());
  }, [dispatch]);
  const onEndReached = useCallback(() => {
    dispatch(loadNextPage());
  }, [dispatch]);
  const retryLoadMore = useCallback(() => {
    dispatch(loadNextPage({ isRetry: true }));
  }, [dispatch]);
  const retrySearch = useCallback(() => {
    dispatch(searchPosts({ query, force: true }));
  }, [dispatch, query]);

  // Stable callbacks keep memoised rows from re-rendering.
  const openPost = useCallback(
    (id: number) => navigation.navigate('PostDetail', { id }),
    [navigation],
  );
  const renderItem = useCallback(
    ({ item }: { item: Post }) => <PostRow post={item} onPress={openPost} />,
    [openPost],
  );

  return (
    <View style={styles.flex}>
      <SearchBar value={text} onChangeText={setText} />
      {query !== '' ? (
        <SearchResults
          query={query}
          status={posts.searchStatus}
          results={posts.searchResults}
          errorMessage={posts.searchError ? userMessage(posts.searchError) : undefined}
          onRetry={retrySearch}
          renderItem={renderItem}
        />
      ) : posts.status === 'loading' ? (
        <LoadingView />
      ) : posts.status === 'failure' ? (
        <ErrorView message={userMessage(posts.error ?? { kind: 'unknown' })} onRetry={onRefresh} />
      ) : (
        <View style={styles.flex}>
          {posts.error ? (
            <Text style={styles.banner} accessibilityRole="alert">
              {userMessage(posts.error)}
            </Text>
          ) : null}
          <FlatList
            data={posts.items}
            keyExtractor={keyExtractor}
            renderItem={renderItem}
            getItemLayout={getItemLayout}
            refreshControl={<RefreshControl refreshing={posts.isRefreshing} onRefresh={onRefresh} />}
            ListEmptyComponent={<EmptyView message="No posts yet" />}
            contentContainerStyle={posts.items.length === 0 ? styles.flex : undefined}
            onEndReached={onEndReached}
            onEndReachedThreshold={0.5}
            ListFooterComponent={
              posts.hasReachedEnd ? undefined : (
                <LoadMoreFooter
                  loading={posts.isLoadingMore}
                  errorMessage={posts.loadMoreError ? userMessage(posts.loadMoreError) : undefined}
                  onRetry={retryLoadMore}
                />
              )
            }
          />
        </View>
      )}
    </View>
  );
}

function SearchResults({
  query,
  status,
  results,
  errorMessage,
  onRetry,
  renderItem,
}: {
  query: string;
  status: string;
  results: Post[];
  errorMessage?: string;
  onRetry: () => void;
  renderItem: ({ item }: { item: Post }) => React.ReactElement;
}) {
  if (status === 'failure') return <ErrorView message={errorMessage ?? 'Search failed'} onRetry={onRetry} />;
  const loading = status === 'loading';
  if (loading && results.length === 0) return <LoadingView />;
  if (!loading && results.length === 0) return <EmptyView message={`No results for "${query}"`} />;
  return (
    <View style={styles.flex}>
      {/* Old results stay visible while the new query loads. */}
      {loading ? <ActivityIndicator style={styles.inlineSpinner} color={colors.primary} /> : null}
      <FlatList
        data={results}
        keyExtractor={keyExtractor}
        renderItem={renderItem}
        getItemLayout={getItemLayout}
        keyboardShouldPersistTaps="handled"
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
  inlineSpinner: { marginVertical: spacing.sm },
});
