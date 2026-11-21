import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import { useLayoutEffect } from 'react';
import { FlatList, StyleSheet, Text, View } from 'react-native';

import { userMessage } from '../../../core/error/appError';
import { ErrorView, LoadingView } from '../../../core/ui/StateViews';
import type { RootStackParamList } from '../../../navigation/RootNavigator';
import { FavoriteButton } from '../../favorites/FavoriteButton';
import { colors, spacing } from '../../../ui/theme';
import type { Comment } from '../domain/comment';
import { usePostDetail } from './usePostDetail';

type Props = NativeStackScreenProps<RootStackParamList, 'PostDetail'>;

const keyExtractor = (c: Comment) => String(c.id);
const renderComment = ({ item }: { item: Comment }) => (
  <View style={styles.comment}>
    <Text style={styles.commentName} numberOfLines={1}>
      {item.name}
    </Text>
    <Text style={styles.muted}>{item.email}</Text>
    <Text>{item.body}</Text>
  </View>
);

export function PostDetailScreen({ route, navigation }: Props) {
  const { id } = route.params;
  const { state, retry } = usePostDetail(id);

  useLayoutEffect(() => {
    navigation.setOptions({ headerRight: () => <FavoriteButton id={id} /> });
  }, [navigation, id]);

  switch (state.status) {
    case 'loading':
      return <LoadingView />;
    case 'error':
      return <ErrorView message={userMessage(state.error)} onRetry={retry} />;
    case 'loaded':
      return (
        <FlatList
          data={state.comments}
          keyExtractor={keyExtractor}
          renderItem={renderComment}
          ListHeaderComponent={
            <View style={styles.header}>
              <Text style={styles.title}>{state.post.title}</Text>
              <Text style={styles.body}>{state.post.body}</Text>
              <Text style={styles.section}>Comments</Text>
              {state.commentsError ? (
                <Text style={styles.error}>{userMessage(state.commentsError)}</Text>
              ) : null}
            </View>
          }
        />
      );
  }
}

const styles = StyleSheet.create({
  header: { padding: spacing.lg },
  title: { fontSize: 22, fontWeight: '700', color: colors.text },
  body: { marginTop: spacing.md, color: colors.text, lineHeight: 20 },
  section: { marginTop: spacing.xl, fontSize: 16, fontWeight: '600' },
  error: { color: colors.error, marginTop: spacing.sm },
  comment: {
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.md,
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: colors.border,
  },
  commentName: { fontWeight: '600' },
  muted: { color: colors.muted, marginBottom: 4 },
});
